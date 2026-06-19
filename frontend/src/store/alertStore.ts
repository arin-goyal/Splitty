import { Alert } from 'react-native';
import { create } from 'zustand';

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: { cancelable?: boolean };
  showAlert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { cancelable?: boolean }
  ) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  buttons: undefined,
  options: undefined,
  showAlert: (title, message, buttons, options) =>
    set({
      visible: true,
      title,
      message,
      buttons,
      options,
    }),
  hideAlert: () => set({ visible: false }),
}));

// Globally intercept all Alert.alert calls and route them through our custom store
Alert.alert = (title, message, buttons, options) => {
  useAlertStore.getState().showAlert(title, message, buttons, options);
};
