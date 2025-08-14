declare global {
  interface Window {
    triggerSync?: () => void;
    refreshData?: () => void;
  }
}

export {};