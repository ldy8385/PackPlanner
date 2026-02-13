import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Text,
  Button,
  TextInput,
  Surface,
  Divider,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();
  const { signInWithGoogle } = useAuth();

  const handleEmailLogin = () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('login.errorEmpty'));
      return;
    }
    // TODO: Firebase email/password auth
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error: any) {
      if (error?.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert(t('common.error'), t('login.errorGoogle'));
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.logoContainer, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon name="bag-personal" size={48} color={theme.colors.primary} />
        </View>
        <Text variant="headlineMedium" style={[styles.appName, { color: theme.colors.onSurface }]}>
          PackPlanner
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>
          {t('login.tagline')}
        </Text>
      </Surface>

      <View style={styles.formContainer}>
        <TextInput
          mode="outlined"
          label={t('login.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
        />
        <TextInput
          mode="outlined"
          label={t('login.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
        />

        <Button
          mode="contained"
          onPress={handleEmailLogin}
          style={styles.loginButton}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          contentStyle={{ height: 48 }}>
          {isLoginMode ? t('login.loginBtn') : t('login.signUpBtn')}
        </Button>

        <Button
          mode="text"
          onPress={() => setIsLoginMode(!isLoginMode)}
          style={styles.toggleMode}
          textColor={theme.colors.secondary}>
          {isLoginMode
            ? t('login.noAccount')
            : t('login.hasAccount')}
        </Button>

        <View style={styles.dividerContainer}>
          <Divider style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{t('common.or')}</Text>
          <Divider style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
        </View>

        <Button
          mode="outlined"
          icon="google"
          onPress={handleGoogleLogin}
          loading={isSigningIn}
          disabled={isSigningIn}
          style={[styles.socialButton, { borderColor: theme.colors.outline }]}
          textColor={theme.colors.onSurface}>
          {t('login.continueGoogle')}
        </Button>
      </View>

      <Text variant="bodySmall" style={[styles.footer, { color: theme.colors.outline }]}>
        {t('login.footer')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    borderRadius: 16,
    padding: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontWeight: '700',
    marginBottom: 8,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  toggleMode: {
    marginTop: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
  },
  socialButton: {
    marginBottom: 12,
    borderRadius: 12,
    paddingVertical: 4,
  },
  footer: {
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
});

export default LoginScreen;
