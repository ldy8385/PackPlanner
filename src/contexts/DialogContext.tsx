import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type DialogType = 'alert' | 'confirm';
type DialogIcon = 'error' | 'warning' | 'success' | 'info' | 'delete';

interface DialogConfig {
  type: DialogType;
  title: string;
  message: string;
  icon?: DialogIcon;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogContextType {
  showAlert: (config: {
    title: string;
    message: string;
    icon?: DialogIcon;
    confirmText?: string;
    onConfirm?: () => void;
  }) => void;
  showConfirm: (config: {
    title: string;
    message: string;
    icon?: DialogIcon;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

const ICON_MAP: Record<DialogIcon, { name: string; color: string; bg: string }> = {
  error: { name: 'alert-circle', color: '#EF4444', bg: '#FEE2E2' },
  warning: { name: 'alert', color: '#F59E0B', bg: '#FEF3C7' },
  success: { name: 'check-circle', color: '#10B981', bg: '#D1FAE5' },
  info: { name: 'information', color: '#4F46E5', bg: '#E0E7FF' },
  delete: { name: 'delete-alert', color: '#EF4444', bg: '#FEE2E2' },
};

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DialogConfig | null>(null);

  const showAlert = useCallback((cfg: Parameters<DialogContextType['showAlert']>[0]) => {
    setConfig({ type: 'alert', icon: 'error', ...cfg });
    setVisible(true);
  }, []);

  const showConfirm = useCallback((cfg: Parameters<DialogContextType['showConfirm']>[0]) => {
    setConfig({ type: 'confirm', icon: 'warning', ...cfg });
    setVisible(true);
  }, []);

  const handleConfirm = () => {
    setVisible(false);
    config?.onConfirm?.();
  };

  const handleCancel = () => {
    setVisible(false);
    config?.onCancel?.();
  };

  const iconInfo = config?.icon ? ICON_MAP[config.icon] : null;

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={config?.type === 'confirm' ? handleCancel : handleConfirm}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={config?.type === 'confirm' ? handleCancel : handleConfirm}>
          <TouchableOpacity activeOpacity={1} style={[styles.dialog, { backgroundColor: theme.colors.surface }]}>
            {iconInfo && (
              <View style={[styles.iconContainer, { backgroundColor: iconInfo.bg }]}>
                <Icon name={iconInfo.name} size={28} color={iconInfo.color} />
              </View>
            )}
            <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
              {config?.title}
            </Text>
            <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
              {config?.message}
            </Text>
            <View style={styles.buttons}>
              {config?.type === 'confirm' && (
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={[styles.button, { borderColor: theme.colors.outline }]}
                  textColor={theme.colors.onSurface}>
                  {config?.cancelText || '취소'}
                </Button>
              )}
              <Button
                mode="contained"
                onPress={handleConfirm}
                style={styles.button}
                buttonColor={config?.confirmColor || (config?.icon === 'delete' || config?.icon === 'error' ? '#EF4444' : theme.colors.primary)}>
                {config?.confirmText || '확인'}
              </Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dialog: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
  },
});
