interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export function alert(title: string, message?: string, buttons?: AlertButton[]) {
  const fullMessage = message ? `${title}\n${message}` : title;

  if (!buttons || buttons.length <= 1) {
    window.alert(fullMessage);
    buttons?.[0]?.onPress?.();
    return;
  }

  const cancelBtn = buttons.find(b => b.style === 'cancel');
  const actionBtn = buttons.find(b => b.style !== 'cancel') ?? buttons[buttons.length - 1];

  if (window.confirm(fullMessage)) {
    actionBtn?.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}
