import { storage, db } from '../storage/dexieStorage';
import { logger } from './logger';

export const setupDiagnostics = () => {
  if (typeof window === 'undefined') return;

  (window as any).__PROMETHEUS_DEBUG__ = {
    healthCheck: async () => {
      console.log('%c[Prometheus Diagnostics] Running health check...', 'color: #ff9800; font-weight: bold;');
      const isDbOpen = db.isOpen();
      const count = await db.store.count();
      console.table({
        'IndexedDB Status': isDbOpen ? 'Connected (Dexie)' : 'Disconnected',
        'Stored Keys Count': count,
        'Environment': 'React 19 + TypeScript + Vite',
      });
      return { isDbOpen, count };
    },

    inspectState: async () => {
      const allEntries = await db.store.toArray();
      const summary: Record<string, any> = {};
      allEntries.forEach(e => {
        summary[e.key] = Array.isArray(e.value) ? `Array(${e.value.length})` : typeof e.value;
      });
      console.log('%c[Prometheus State Dump]:', 'color: #2196f3; font-weight: bold;', summary);
      return allEntries;
    },

    exportDiagnosticReport: async () => {
      const allEntries = await db.store.toArray();
      const report = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        data: allEntries,
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prometheus-diagnostic-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      logger.info('App', 'Diagnóstico descargado con éxito.');
    },

    showLogs: () => {
      console.info('%cPara ver logs en vivo, filtra en la consola por [Prometheus]', 'color: #4caf50;');
    },
  };
};

