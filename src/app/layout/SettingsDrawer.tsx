import React from 'react';
import { SettingsModal, SettingsTab } from './SettingsModal';

/**
 * SettingsDrawer
 * 
 * Alias retrocompatible para SettingsModal que preserva la interfaz
 * histórica utilizada en pruebas unitarias y extensiones.
 */
export interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: SettingsTab;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = props => {
  return <SettingsModal {...props} />;
};
