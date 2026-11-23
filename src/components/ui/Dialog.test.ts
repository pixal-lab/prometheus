import { describe, it, expect, beforeEach } from 'vitest';
import { useDialogStore } from './Dialog';

describe('useDialogStore', () => {
  beforeEach(() => {
    useDialogStore.setState({
      isOpen: false,
      type: null,
      title: '',
      message: '',
      placeholder: '',
      defaultValue: '',
      confirmText: '',
      cancelText: '',
      variant: 'primary',
      icon: undefined,
      inputType: 'text',
      resolve: undefined,
    });
  });

  describe('confirm', () => {
    it('sets state and resolves true when closed with true', async () => {
      const promise = useDialogStore.getState().confirm({
        title: '¿Eliminar lección?',
        message: 'Esta acción no se puede deshacer.',
        confirmText: 'Sí, eliminar',
        cancelText: 'No',
        variant: 'danger',
        icon: 'trash',
      });

      const state = useDialogStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.type).toBe('confirm');
      expect(state.title).toBe('¿Eliminar lección?');
      expect(state.message).toBe('Esta acción no se puede deshacer.');
      expect(state.confirmText).toBe('Sí, eliminar');
      expect(state.cancelText).toBe('No');
      expect(state.variant).toBe('danger');
      expect(state.icon).toBe('trash');

      // Simulate user clicking confirm
      useDialogStore.getState().close(true);

      const result = await promise;
      expect(result).toBe(true);
      expect(useDialogStore.getState().isOpen).toBe(false);
    });

    it('resolves false when closed with false or cancelled', async () => {
      const promise = useDialogStore.getState().confirm({
        title: 'Confirmar acción',
        message: '¿Continuar?',
      });

      expect(useDialogStore.getState().isOpen).toBe(true);

      // Simulate user clicking cancel
      useDialogStore.getState().close(false);

      const result = await promise;
      expect(result).toBe(false);
      expect(useDialogStore.getState().isOpen).toBe(false);
    });
  });

  describe('prompt', () => {
    it('sets state and resolves with string value when submitted', async () => {
      const promise = useDialogStore.getState().prompt({
        title: 'Renombrar Lección',
        message: 'Introduce nuevo nombre:',
        defaultValue: 'Clase 1',
        placeholder: 'Título...',
        confirmText: 'Guardar',
        icon: 'edit',
      });

      const state = useDialogStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.type).toBe('prompt');
      expect(state.title).toBe('Renombrar Lección');
      expect(state.defaultValue).toBe('Clase 1');
      expect(state.placeholder).toBe('Título...');
      expect(state.icon).toBe('edit');

      // Simulate user submitting input
      useDialogStore.getState().close('Clase 1 Actualizada');

      const result = await promise;
      expect(result).toBe('Clase 1 Actualizada');
      expect(useDialogStore.getState().isOpen).toBe(false);
    });

    it('resolves with null when cancelled', async () => {
      const promise = useDialogStore.getState().prompt({
        title: 'Nueva Carpeta',
      });

      expect(useDialogStore.getState().isOpen).toBe(true);

      // Simulate cancel / esc
      useDialogStore.getState().close(null);

      const result = await promise;
      expect(result).toBe(null);
      expect(useDialogStore.getState().isOpen).toBe(false);
    });
  });

  describe('alert', () => {
    it('sets state and resolves when closed', async () => {
      const promise = useDialogStore.getState().alert({
        title: 'Aviso Importante',
        message: 'Operación completada con éxito.',
      });

      const state = useDialogStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.type).toBe('alert');
      expect(state.title).toBe('Aviso Importante');

      useDialogStore.getState().close(undefined);

      await promise;
      expect(useDialogStore.getState().isOpen).toBe(false);
    });
  });
});
