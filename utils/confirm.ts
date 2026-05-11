import { Alert } from 'react-native';

export const confirmAction = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel: string = 'Usuń',
) => {
  Alert.alert(title, message, [
    { text: 'Anuluj', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
};
