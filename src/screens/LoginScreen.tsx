import React, {useState} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Surface,
  Divider,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({onLogin}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const theme = useTheme();

  const handleEmailLogin = () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    console.log('Email login:', email);
    onLogin();
  };

  const handleGoogleLogin = () => {
    console.log('Google login');
    onLogin();
  };

  const handleAppleLogin = () => {
    console.log('Apple login');
    onLogin();
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.logoContainer} elevation={4}>
        <Icon name="bag-personal" size={80} color={theme.colors.primary} />
        <Text variant="headlineLarge" style={styles.appName}>
          PackPlanner
        </Text>
        <Text variant="bodyMedium" style={styles.tagline}>
          캠핑 장비 패킹 체크리스트
        </Text>
      </Surface>

      <View style={styles.formContainer}>
        <TextInput
          mode="outlined"
          label="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleEmailLogin}
          style={styles.loginButton}>
          {isLoginMode ? '로그인' : '회원가입'}
        </Button>

        <Button
          mode="text"
          onPress={() => setIsLoginMode(!isLoginMode)}
          style={styles.toggleMode}>
          {isLoginMode
            ? '계정이 없으신가요? 회원가입'
            : '이미 계정이 있으신가요? 로그인'}
        </Button>

        <Divider style={styles.divider} />

        <Button
          mode="outlined"
          icon="google"
          onPress={handleGoogleLogin}
          style={styles.socialButton}>
          Google로 계속하기
        </Button>

        <Button
          mode="contained"
          icon="apple"
          buttonColor="#000"
          textColor="#fff"
          onPress={handleAppleLogin}
          style={styles.socialButton}>
          Apple로 계속하기
        </Button>
      </View>

      <Text variant="bodySmall" style={styles.footer}>
        로그인함으로써 이용약관 및 개인정보처리방침에 동의합니다.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  appName: {
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  tagline: {
    color: '#666',
  },
  formContainer: {
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
  loginButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  toggleMode: {
    marginTop: 16,
  },
  divider: {
    marginVertical: 24,
  },
  socialButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 24,
  },
});

export default LoginScreen;
