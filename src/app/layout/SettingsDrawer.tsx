import React from 'react';
import { SettingsModal, SettingsTab } from './SettingsModal';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: SettingsTab;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = props => {
  return <SettingsModal {...props} />;
};
