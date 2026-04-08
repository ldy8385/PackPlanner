import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Text,
  Button,
  Surface,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';

const LoginScreen: React.FC = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();
  const { signInWithGoogle } = useAuth();
  const { showAlert } = useDialog();

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error: any) {
      console.error('GoogleSignIn error:', error?.code, error?.message);
      if (error?.code !== 'SIGN_IN_CANCELLED') {
        showAlert({
          title: t('common.error'),
          message: `${t('login.errorGoogle')}\n(${error?.code || 'UNKNOWN'})`,
          icon: 'error',
          confirmText: t('common.confirm'),
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 상단 여백 */}
      <View style={styles.topSpacer} />

      {/* 로고 영역 - 화면 중앙 */}
      <Surface style={[styles.logoContainer, { backgroundColor: 'transparent' }]} elevation={0}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon name="bag-personal" size={56} color={theme.colors.primary} />
        </View>
        <Text variant="headlineLarge" style={[styles.appName, { color: theme.colors.onSurface }]}>
          PackPlanner
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('login.tagline')}
        </Text>
      </Surface>

      {/* 하단 영역 - 버튼 + 약관 */}
      <View style={styles.bottomSection}>
        <Button
          mode="outlined"
          icon="google"
          onPress={handleGoogleLogin}
          loading={isSigningIn}
          disabled={isSigningIn}
          style={[styles.googleButton, { borderColor: theme.colors.outline }]}
          contentStyle={styles.googleButtonContent}
          textColor={theme.colors.onSurface}>
          {t('login.continueGoogle')}
        </Button>
        <Text variant="bodySmall" style={[styles.footer, { color: theme.colors.outline }]}>
          {t('login.footer')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSpacer: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontWeight: '700',
    marginBottom: 8,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  googleButton: {
    borderRadius: 12,
  },
  googleButtonContent: {
    height: 52,
  },
  footer: {
    textAlign: 'center',
    marginTop: 16,
  },
});

export default LoginScreen;
