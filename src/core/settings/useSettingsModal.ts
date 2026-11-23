import { create } from 'zustand';
import { SettingsTab } from '../../app/layout/SettingsModal';

interface SettingsModalStore {
  isOpen: boolean;
  activeTab: SettingsTab;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  setActiveTab: (tab: SettingsTab) => void;
}

export const useSettingsModal = create<SettingsModalStore>((set) => ({
  isOpen: false,
  activeTab: 'general',
  openSettings: (tab = 'general') => set({ isOpen: true, activeTab: tab }),
  closeSettings: () => set({ isOpen: false }),
  setActiveTab: (tab: SettingsTab) => set({ activeTab: tab }),
}));
