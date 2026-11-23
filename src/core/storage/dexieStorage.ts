import Dexie, { type Table } from 'dexie';
import { IStorageAdapter } from './storage.interface';
import { logger } from '../debug/logger';

export interface StorageEntry {
  key: string;
  value: any;
}

export class PrometheusDexieDB extends Dexie {
  store!: Table<StorageEntry, string>;

  constructor() {
    super('PrometheusDB');
    this.version(1).stores({
      store: 'key',
    });
  }
}

export const db = new PrometheusDexieDB();

export class DexieStorageAdapter implements IStorageAdapter {
  private isInitialized = false;
  private memoryFallback = new Map<string, any>();

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (typeof indexedDB === 'undefined') {
      this.isInitialized = true;
      return;
    }
    try {
      await db.open();
      this.isInitialized = true;
      logger.info('Storage', 'Dexie IndexedDB abierto exitosamente.');
      await this.migrateLegacyLocalForage();
    } catch (err) {
      logger.error('Storage', 'Error al abrir Dexie DB', err);
    }
  }

  /**
   * Intenta migrar datos si existen en el IndexedDB legacy de localforage
   */
  private async migrateLegacyLocalForage(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    return new Promise<void>(async resolve => {
      try {
        const dbs = await indexedDB.databases?.();
        const hasLegacy = dbs?.some(d => d.name === 'localforage');
        if (!hasLegacy) {
          resolve();
          return;
        }

        const count = await db.store.count();
        if (count > 0) {
          resolve();
          return; // Ya hay datos en la nueva base
        }

        logger.info('Storage', 'Detectada base de datos previa de localforage. Iniciando migración automática...');

        const req = indexedDB.open('localforage');
        req.onerror = () => resolve();
        req.onsuccess = () => {
          const legacyDb = req.result;
          if (!legacyDb.objectStoreNames.contains('keyvaluepairs')) {
            resolve();
            return;
          }

          const tx = legacyDb.transaction('keyvaluepairs', 'readonly');
          const store = tx.objectStore('keyvaluepairs');
          const getAllKeys = store.getAllKeys();
          const getAllVals = store.getAll();

          getAllKeys.onerror = () => resolve();
          getAllVals.onerror = () => resolve();

          getAllKeys.onsuccess = () => {
            const keys = getAllKeys.result as string[];
            getAllVals.onsuccess = async () => {
              const vals = getAllVals.result;
              try {
                for (let i = 0; i < keys.length; i++) {
                  await this.setItem(keys[i], vals[i]);
                }
                logger.info('Storage', `Migrados ${keys.length} registros desde localforage.`);
              } catch (e) {
                logger.warn('Storage', 'Error durante copia de registros de localforage', e);
              } finally {
                resolve();
              }
            };
          };
        };
      } catch (err) {
        logger.warn('Storage', 'No se pudo migrar automáticamente localforage', err);
        resolve();
      }
    });
  }

  async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      await this.init();
      if (typeof indexedDB !== 'undefined' && db.isOpen()) {
        const entry = await db.store.get(key);
        if (entry !== undefined && entry.value !== null) {
          return entry.value as T;
        }
      }

      // Fallback a localStorage
      if (typeof localStorage !== 'undefined') {
        const localVal = localStorage.getItem(`prometheus_${key}`) || localStorage.getItem(key);
        if (localVal !== null) {
          try {
            return JSON.parse(localVal) as T;
          } catch {
            return localVal as unknown as T;
          }
        }
      }

      // Fallback a memoria en entornos sin IndexedDB ni localStorage
      if (this.memoryFallback.has(key)) {
        return this.memoryFallback.get(key) as T;
      }

      return defaultValue !== undefined ? defaultValue : null;
    } catch (err) {
      logger.error('Storage', `Error al leer [${key}]`, err);
      return defaultValue !== undefined ? defaultValue : null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      await this.init();
      this.memoryFallback.set(key, value);

      if (typeof indexedDB !== 'undefined' && db.isOpen()) {
        await db.store.put({ key, value });
      }
      // Guardar espejo en localStorage para redundancia
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(`prometheus_${key}`, JSON.stringify(value));
        } catch {
          // Ignorar límites de 5MB en localStorage
        }
      }
      return true;
    } catch (err) {
      logger.error('Storage', `Error al escribir [${key}]`, err);
      return false;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      await this.init();
      this.memoryFallback.delete(key);

      if (typeof indexedDB !== 'undefined' && db.isOpen()) {
        await db.store.delete(key);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`prometheus_${key}`);
        localStorage.removeItem(key);
      }
      return true;
    } catch (err) {
      logger.error('Storage', `Error al eliminar [${key}]`, err);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await this.init();
      this.memoryFallback.clear();

      if (typeof indexedDB !== 'undefined' && db.isOpen()) {
        await db.store.clear();
      }
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('prometheus_') || k.startsWith('prometheus-') || k === 'classBlocks' || k === 'subjects' || k === 'timetableData' || k === 'gradebookData' || k === 'lessonPlannerData')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
      return true;
    } catch (err) {
      logger.error('Storage', 'Error al vaciar DB', err);
      return false;
    }
  }
}

export const storage = new DexieStorageAdapter();

