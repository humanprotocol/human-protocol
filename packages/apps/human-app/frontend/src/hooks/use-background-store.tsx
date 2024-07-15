import { create } from 'zustand';
import { colorPalette } from '@/styles/color-palette';

interface BackgroundStore {
  backgroundColor: string;
  setWhiteBackground: () => void;
  setGrayBackground: () => void;
}

export const useBackgroundColorStore = create<BackgroundStore>((set) => ({
  backgroundColor: colorPalette.white,
  setWhiteBackground: () => {
    set((state) => ({ ...state, backgroundColor: colorPalette.white }));
  },
  setGrayBackground: () => {
    set((state) => ({ ...state, backgroundColor: colorPalette.paper.main }));
  },
}));
