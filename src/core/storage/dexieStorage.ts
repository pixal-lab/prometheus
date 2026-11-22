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
    try {
      const dbs = await indexedDB.databases?.();
      const hasLegacy = dbs?.some(d => d.name === 'localforage');
      if (!hasLegacy) return;

      const count = await db.store.count();
      if (count > 0) return; // Ya hay datos en la nueva base

      logger.info('Storage', 'Detectada base de datos previa de localforage. Iniciando migración automática...');

      const req = indexedDB.open('localforage');
      req.onsuccess = () => {
        const legacyDb = req.result;
        if (!legacyDb.objectStoreNames.contains('keyvaluepairs')) return;

        const tx = legacyDb.transaction('keyvaluepairs', 'readonly');
        const store = tx.objectStore('keyvaluepairs');
        const getAllKeys = store.getAllKeys();
        const getAllVals = store.getAll();

        getAllKeys.onsuccess = async () => {
          const keys = getAllKeys.result as string[];
          getAllVals.onsuccess = async () => {
            const vals = getAllVals.result;
            for (let i = 0; i < keys.length; i++) {
              await this.setItem(keys[i], vals[i]);
            }
            logger.info('Storage', `Migrados ${keys.length} registros desde localforage.`);
          };
        };
      };
    } catch (err) {
      logger.warn('Storage', 'No se pudo migrar automáticamente localforage', err);
    }
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
      const localVal = localStorage.getItem(`prometheus_${key}`) || localStorage.getItem(key);
      if (localVal !== null) {
        try {
          return JSON.parse(localVal) as T;
        } catch {
          return localVal as unknown as T;
        }
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
      if (typeof indexedDB !== 'undefined' && db.isOpen()) {
        await db.store.put({ key, value });
      }
      // Guardar espejo en localStorage para redundancia
      try {
        localStorage.setItem(`prometheus_${key}`, JSON.stringify(value));
      } catch {
        // Ignorar límites de 5MB en localStorage
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
      if (typeof indexedDB !== 'undefined' && db.isOpen()) {
        await db.store.delete(key);
      }
      localStorage.removeItem(`prometheus_${key}`);
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      logger.error('Storage', `Error al eliminar [${key}]`, err);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await this.init();
      if (typeof indexedDB !== 'undefined' && db.isOpen()) {
        await db.store.clear();
      }
      return true;
    } catch (err) {
      logger.error('Storage', 'Error al vaciar DB', err);
      return false;
    }
  }
}

export const storage = new DexieStorageAdapter();

