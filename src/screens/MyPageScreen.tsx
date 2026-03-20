import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  useTheme,
  Divider,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { ThemeMode } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';

interface MyPageScreenProps {
  themeMode: ThemeMode;
  onChangeThemeMode: (mode: ThemeMode) => void;
}

const MyPageScreen: React.FC<MyPageScreenProps> = ({
  themeMode,
  onChangeThemeMode,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { user, signOut, deleteAccount } = useAuth();
  const [subScreen, setSubScreen] = useState<'terms' | 'privacy' | null>(null);

  const handleLogout = () => {
    Alert.alert(
      t('mypage.logoutTitle'),
      t('mypage.logoutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('mypage.logout'), onPress: () => signOut(), style: 'destructive' },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('mypage.deleteAccountTitle'),
      t('mypage.deleteAccountMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('mypage.deleteAccountConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch {
              Alert.alert(t('mypage.deleteAccountTitle'), t('mypage.deleteAccountError'));
            }
          },
        },
      ],
    );
  };

  const languageOptions: { code: string; label: string; icon: string }[] = [
    { code: 'ko', label: t('mypage.korean'), icon: 'translate' },
    { code: 'en', label: t('mypage.english'), icon: 'translate' },
  ];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    storage.saveLanguage(code);
  };

  const themeModeOptions: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: t('mypage.lightMode'), icon: 'weather-sunny' },
    { mode: 'dark', label: t('mypage.darkMode'), icon: 'weather-night' },
    { mode: 'system', label: t('mypage.systemMode'), icon: 'cellphone-cog' },
  ];

  // 이용약관 / 개인정보처리방침 서브 화면
  if (subScreen) {
    const isTerms = subScreen === 'terms';
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Surface style={[styles.subScreenHeader, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onSurface}
            onPress={() => setSubScreen(null)}
          />
          <Text variant="titleLarge" style={[styles.subScreenTitle, { color: theme.colors.onSurface }]}>
            {isTerms ? t('mypage.terms') : t('mypage.privacy')}
          </Text>
          <View style={{ width: 48 }} />
        </Surface>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.legalContent}>
          <Text variant="bodySmall" style={[styles.legalDate, { color: theme.colors.outline }]}>
            {isTerms ? t('legal.termsEffectiveDate') : t('legal.privacyEffectiveDate')}
          </Text>
          {(isTerms ? t('legal.termsContent', { returnObjects: true }) as string[] : t('legal.privacyContent', { returnObjects: true }) as string[]).map((section: string, index: number) => {
            const isHeading = section.startsWith('##');
            const text = isHeading ? section.replace('## ', '') : section;
            return (
              <Text
                key={index}
                variant={isHeading ? 'titleMedium' : 'bodyMedium'}
                style={[
                  isHeading ? styles.legalHeading : styles.legalParagraph,
                  { color: isHeading ? theme.colors.onSurface : theme.colors.onSurfaceVariant },
                ]}>
                {text}
              </Text>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
            {t('mypage.title')}
          </Text>
        </View>

        {/* 프로필 섹션 */}
        <Surface style={[styles.profileCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="account"
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {user?.displayName || t('mypage.camper')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
              {user?.email || t('mypage.campingWith')}
            </Text>
          </View>
        </Surface>

        {/* 설정 섹션 */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            {t('mypage.appSettings')}
          </Text>

          <Surface style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            {/* 테마 설정 */}
            <View style={styles.settingItem}>
              <View style={styles.settingHeader}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons
                    name="palette-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  {t('mypage.theme')}
                </Text>
              </View>

              <View style={styles.themeOptions}>
                {themeModeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.mode}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: themeMode === option.mode
                          ? theme.colors.primaryContainer
                          : theme.colors.surfaceVariant,
                        borderColor: themeMode === option.mode
                          ? theme.colors.primary
                          : 'transparent',
                      },
                    ]}
                    onPress={() => onChangeThemeMode(option.mode)}
                    activeOpacity={0.7}>
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={24}
                      color={themeMode === option.mode ? theme.colors.primary : theme.colors.onSurfaceVariant}
                    />
                    <Text
                      variant="labelMedium"
                      style={{
                        color: themeMode === option.mode ? theme.colors.primary : theme.colors.onSurfaceVariant,
                        marginTop: 4,
                      }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

            {/* 언어 설정 */}
            <View style={styles.settingItem}>
              <View style={styles.settingHeader}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <MaterialCommunityIcons
                    name="translate"
                    size={20}
                    color={theme.colors.secondary}
                  />
                </View>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  {t('mypage.language')}
                </Text>
              </View>

              <View style={styles.themeOptions}>
                {languageOptions.map((option) => (
                  <TouchableOpacity
                    key={option.code}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: i18n.language === option.code
                          ? theme.colors.secondaryContainer
                          : theme.colors.surfaceVariant,
                        borderColor: i18n.language === option.code
                          ? theme.colors.secondary
                          : 'transparent',
                      },
                    ]}
                    onPress={() => changeLanguage(option.code)}
                    activeOpacity={0.7}>
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={24}
                      color={i18n.language === option.code ? theme.colors.secondary : theme.colors.onSurfaceVariant}
                    />
                    <Text
                      variant="labelMedium"
                      style={{
                        color: i18n.language === option.code ? theme.colors.secondary : theme.colors.onSurfaceVariant,
                        marginTop: 4,
                      }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

            {/* 알림 설정 */}
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={20}
                    color={theme.colors.secondary}
                  />
                </View>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {t('mypage.notifications')}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.outline}
              />
            </TouchableOpacity>

            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

            {/* 데이터 관리 */}
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.tertiaryContainer }]}>
                  <MaterialCommunityIcons
                    name="database-outline"
                    size={20}
                    color={theme.colors.tertiary}
                  />
                </View>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {t('mypage.dataManagement')}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.outline}
              />
            </TouchableOpacity>
          </Surface>
        </View>

        {/* 로그아웃 */}
        <View style={styles.section}>
          <Surface style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <TouchableOpacity style={styles.settingRow} onPress={handleLogout} activeOpacity={0.7}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.errorContainer }]}>
                  <MaterialCommunityIcons
                    name="logout"
                    size={20}
                    color={theme.colors.error}
                  />
                </View>
                <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
                  {t('mypage.logout')}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.error}
              />
            </TouchableOpacity>

            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

            <TouchableOpacity style={styles.settingRow} onPress={handleDeleteAccount} activeOpacity={0.7}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.errorContainer }]}>
                  <MaterialCommunityIcons
                    name="account-remove"
                    size={20}
                    color={theme.colors.error}
                  />
                </View>
                <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
                  {t('mypage.deleteAccount')}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.error}
              />
            </TouchableOpacity>
          </Surface>
        </View>

        {/* 정보 섹션 */}
        <View style={[styles.section, styles.lastSection]}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            {t('mypage.info')}
          </Text>

          <Surface style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {t('mypage.appInfo')}
                </Text>
              </View>
              <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                v1.0.0
              </Text>
            </TouchableOpacity>

            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={() => setSubScreen('terms')}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {t('mypage.terms')}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.outline}
              />
            </TouchableOpacity>

            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={() => setSubScreen('privacy')}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {t('mypage.privacy')}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.outline}
              />
            </TouchableOpacity>
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  profileCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  settingsCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingItem: {
    padding: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  subScreenTitle: {
    fontWeight: '700',
  },
  legalContent: {
    padding: 24,
    paddingBottom: 48,
  },
  legalDate: {
    marginBottom: 20,
  },
  legalHeading: {
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  legalParagraph: {
    lineHeight: 22,
    marginBottom: 12,
  },
});

export default MyPageScreen;
