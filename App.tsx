import './src/i18n';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Alert,
} from 'react-native';
import {
  Provider as PaperProvider,
  DefaultTheme,
  MD3DarkTheme,
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import PlanScreen from './src/screens/PlanScreen';
import GearScreen from './src/screens/GearScreen';
import CreatePlanScreen from './src/screens/CreatePlanScreen';
import CreateGearScreen from './src/screens/CreateGearScreen';
import MyPageScreen from './src/screens/MyPageScreen';

import { Plan, Gear, GearTemplate, PlanItem } from './src/types';
import { storage } from './src/utils/storage';
import { ThemeProvider, useThemeMode } from './src/contexts/ThemeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Material Design 3 테마
// Modern Clean 테마 (Indigo & Emerald & Stone)
const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4F46E5', // Indigo 600
    onPrimary: '#FFFFFF',
    primaryContainer: '#E0E7FF', // Indigo 100
    onPrimaryContainer: '#3730A3', // Indigo 800
    secondary: '#10B981', // Emerald 500
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D1FAE5', // Emerald 100
    onSecondaryContainer: '#065F46', // Emerald 800
    tertiary: '#F59E0B', // Amber 500 (Accents)
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FEF3C7', // Amber 100
    onTertiaryContainer: '#92400E', // Amber 800
    background: '#F9FAFB', // Gray 50 (Cleaner background)
    onBackground: '#111827', // Gray 900
    surface: '#FFFFFF',
    onSurface: '#1F2937', // Gray 800
    surfaceVariant: '#F3F4F6', // Gray 100
    onSurfaceVariant: '#4B5563', // Gray 600
    outline: '#9CA3AF', // Gray 400
    outlineVariant: '#E5E7EB', // Gray 200
    error: '#EF4444', // Red 500
    onError: '#FFFFFF',
    errorContainer: '#FEE2E2', // Red 100
    onErrorContainer: '#991B1B', // Red 800
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF', // Clean cards
      level2: '#F9FAFB',
      level3: '#F3F4F6',
      level4: '#E5E7EB',
      level5: '#D1D5DB',
    },
  },
  roundness: 3,
};

// 다크 테마
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#818CF8', // Indigo 400
    onPrimary: '#1E1B4B', // Indigo 950
    primaryContainer: '#3730A3', // Indigo 800
    onPrimaryContainer: '#E0E7FF', // Indigo 100
    secondary: '#34D399', // Emerald 400
    onSecondary: '#022C22', // Emerald 950
    secondaryContainer: '#065F46', // Emerald 800
    onSecondaryContainer: '#D1FAE5', // Emerald 100
    tertiary: '#FBBF24', // Amber 400
    onTertiary: '#451A03', // Amber 950
    tertiaryContainer: '#92400E', // Amber 800
    onTertiaryContainer: '#FEF3C7', // Amber 100
    background: '#111827', // Gray 900
    onBackground: '#F9FAFB', // Gray 50
    surface: '#1F2937', // Gray 800
    onSurface: '#F3F4F6', // Gray 100
    surfaceVariant: '#374151', // Gray 700
    onSurfaceVariant: '#D1D5DB', // Gray 300
    outline: '#6B7280', // Gray 500
    outlineVariant: '#4B5563', // Gray 600
    error: '#F87171', // Red 400
    onError: '#450A0A', // Red 950
    errorContainer: '#991B1B', // Red 800
    onErrorContainer: '#FEE2E2', // Red 100
    elevation: {
      level0: 'transparent',
      level1: '#1F2937', // Gray 800
      level2: '#374151', // Gray 700
      level3: '#4B5563', // Gray 600
      level4: '#6B7280', // Gray 500
      level5: '#9CA3AF', // Gray 400
    },
  },
  roundness: 3,
};

const AppContent = () => {
  const { isDarkMode, themeMode, setThemeMode } = useThemeMode();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t } = useTranslation();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'gear' | 'mypage'>('home');
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showCreateGear, setShowCreateGear] = useState(false);
  const [editingGear, setEditingGear] = useState<Gear | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [gears, setGears] = useState<Gear[]>([]);
  const [templates, setTemplates] = useState<GearTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialPlanId, setInitialPlanId] = useState<string | null>(null);
  const [initialGearTags, setInitialGearTags] = useState<string[]>([]);

  // gears에서 태그 실시간 추출 (useMemo로 캐싱)
  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    gears.forEach(gear => {
      gear.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [gears]);

  // 앱 시작 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 데이터 로드
  const loadData = async () => {
    try {
      setIsLoading(true);

      // 저장된 데이터 불러오기
      const savedPlans = await storage.loadPlans();
      const savedGears = await storage.loadGears();
      const savedTemplates = await storage.loadTemplates();
      const isFirstLaunch = await storage.isFirstLaunch();

      if (isFirstLaunch) {
        // 첫 실행 시 빈 데이터로 시작
        setPlans([]);
        setGears([]);
        setTemplates([]);
        await storage.savePlans([]);
        await storage.saveGears([]);
        await storage.saveTemplates([]);
        await storage.setFirstLaunchComplete();
      } else {
        // 이후 실행 시 저장된 데이터 사용
        setPlans(savedPlans || []);
        setGears(savedGears || []);
        setTemplates(savedTemplates || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // 에러 시 빈 데이터로 시작
      setPlans([]);
      setGears([]);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Plans 업데이트 및 저장
  const handleUpdatePlans = async (newPlans: Plan[]) => {
    setPlans(newPlans);
    await storage.savePlans(newPlans);
  };

  // Gears 업데이트 및 저장
  const handleUpdateGears = async (newGears: Gear[]) => {
    setGears(newGears);
    await storage.saveGears(newGears);
  };

  // Gear 삭제 및 연결된 계획에서도 제거
  const handleDeleteGear = async (
    gearId: string,
    affectedPlanIds: string[],
  ) => {
    // 1. 장비 삭제 (단순 filter)
    const updatedGears = gears.filter(gear => gear.id !== gearId);
    setGears(updatedGears);
    await storage.saveGears(updatedGears);

    // 2. 연결된 계획에서 해당 장비 제거 (PlanItem 계층 구조 유지하며 제거)
    if (affectedPlanIds.length > 0) {
      const removeItemsFromPlan = (items: PlanItem[]): PlanItem[] => {
        return items
          .map(item => {
            if (item.gearId === gearId) {
              // 해당 아이템 제거 (자식들은 승격)
              return item.children || null;
            }
            if (item.children) {
              const updatedChildren = removeItemsFromPlan(item.children);
              const filteredChildren = updatedChildren.filter(
                (i): i is PlanItem => i !== null,
              );
              if (filteredChildren.length === 0) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { children: _, ...rest } = item;
                return rest;
              }
              return { ...item, children: filteredChildren };
            }
            return item;
          })
          .flat()
          .filter((i): i is PlanItem => i !== null);
      };

      const updatedPlans = plans.map(plan => {
        if (affectedPlanIds.includes(plan.id)) {
          return {
            ...plan,
            items: removeItemsFromPlan(plan.items),
          };
        }
        return plan;
      });
      setPlans(updatedPlans);
      await storage.savePlans(updatedPlans);
    }
  };

  // Templates 업데이트 및 저장
  const handleUpdateTemplates = async (newTemplates: GearTemplate[]) => {
    setTemplates(newTemplates);
    await storage.saveTemplates(newTemplates);
  };

  // 새 계획 생성
  const handleCreatePlan = async (newPlan: Plan) => {
    const updatedPlans = [...plans, newPlan];
    setPlans(updatedPlans);
    await storage.savePlans(updatedPlans);
    setShowCreatePlan(false);
    setActiveTab('plan');
  };

  // 계획 수정
  const handleUpdatePlan = async (updatedPlan: Plan) => {
    const updatedPlans = plans.map(p =>
      p.id === updatedPlan.id ? updatedPlan : p,
    );
    setPlans(updatedPlans);
    await storage.savePlans(updatedPlans);
    setEditingPlan(null);
    setInitialPlanId(updatedPlan.id);
  };

  // 새 장비 생성
  const handleCreateGear = async (newGear: Gear) => {
    const updatedGears = [...gears, newGear];
    setGears(updatedGears);
    await storage.saveGears(updatedGears);
    setShowCreateGear(false);
  };

  // 장비 수정
  const handleUpdateGear = async (updatedGear: Gear) => {
    const updatedGears = gears.map(g =>
      g.id === updatedGear.id ? updatedGear : g,
    );
    setGears(updatedGears);
    await storage.saveGears(updatedGears);
    setEditingGear(null);
  };

  // 특정 계획 상세로 이동
  const navigateToPlanDetail = (planId: string) => {
    setInitialPlanId(planId);
    setActiveTab('plan');
  };

  // 뒤로가기 버튼 처리
  useEffect(() => {
    const backAction = () => {
      // 1. 새 장비 추가/수정 화면이 열린 경우 → 닫기
      if (showCreateGear || editingGear) {
        setShowCreateGear(false);
        setEditingGear(null);
        return true;
      }

      // 2. 새 계획 만들기 화면이 열린 경우 → 닫기
      if (showCreatePlan || editingPlan) {
        setShowCreatePlan(false);
        setEditingPlan(null);
        return true;
      }

      // 3. 계획 상세 화면인 경우 → 계획 목록으로
      if (initialPlanId) {
        setInitialPlanId(null);
        return true;
      }

      // 4. 계획 탭이나 장비 탭이나 마이페이지 탭인 경우 → 홈으로 이동
      if (activeTab === 'plan' || activeTab === 'gear' || activeTab === 'mypage') {
        setActiveTab('home');
        return true;
      }

      // 5. 홈 화면인 경우 → 앱 종료 확인
      if (activeTab === 'home') {
        Alert.alert(t('app.exitTitle'), t('app.exitMessage'), [
          {
            text: t('common.cancel'),
            onPress: () => null,
            style: 'cancel',
          },
          { text: t('app.exit'), onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [
    showCreatePlan,
    editingPlan,
    showCreateGear,
    editingGear,
    initialPlanId,
    activeTab,
  ]);

  // 탭 변경 시 initialPlanId 초기화
  useEffect(() => {
    if (activeTab !== 'plan') {
      setInitialPlanId(null);
    }
  }, [activeTab]);

  // 로딩 중
  if (isLoading || isAuthLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>{t('common.loading')}</Text>
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // 로그인 화면
  if (!user) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <LoginScreen />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // 새 계획 만들기 화면 또는 계획 수정 화면
  if (showCreatePlan || editingPlan) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <CreatePlanScreen
            onSave={editingPlan ? handleUpdatePlan : handleCreatePlan}
            onCancel={() => {
              setShowCreatePlan(false);
              setEditingPlan(null);
            }}
            editingPlan={editingPlan}
          />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // 새 장비 추가 화면 또는 장비 수정 화면
  if (showCreateGear || editingGear) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <CreateGearScreen
            onSave={editingGear ? handleUpdateGear : handleCreateGear}
            onCancel={() => {
              setShowCreateGear(false);
              setEditingGear(null);
            }}
            editingGear={editingGear}
            tags={tags}
          />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // 현재 선택된 탭에 따라 화면 렌더링
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            plans={plans}
            gears={gears}
            onNavigateToPlans={() => setActiveTab('plan')}
            onNavigateToGears={() => {
              setInitialGearTags([]);
              setActiveTab('gear');
            }}
            onCreateNewPlan={() => setShowCreatePlan(true)}
            onNavigateToPlanDetail={navigateToPlanDetail}
            onNavigateToGearsWithTag={(tag: string) => {
              setInitialGearTags([tag]);
              setActiveTab('gear');
            }}
          />
        );
      case 'plan':
        return (
          <PlanScreen
            plans={plans}
            gears={gears}
            onUpdatePlans={handleUpdatePlans}
            initialPlanId={initialPlanId}
            onEditPlan={plan => setEditingPlan(plan)}
            onCreateNewPlan={() => setShowCreatePlan(true)}
          />
        );
      case 'gear':
        return (
          <GearScreen
            gears={gears}
            onUpdateGears={handleUpdateGears}
            templates={templates}
            onUpdateTemplates={handleUpdateTemplates}
            onCreateGear={() => setShowCreateGear(true)}
            onEditGear={(gear: Gear) => setEditingGear(gear)}
            onDeleteGear={handleDeleteGear}
            initialSelectedTags={initialGearTags}
            plans={plans}
          />
        );
      case 'mypage':
        return (
          <MyPageScreen
            themeMode={themeMode}
            onChangeThemeMode={setThemeMode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.content}>{renderContent()}</View>
          <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'home' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('home')}>
              <Icon
                name="home"
                size={24}
                color={activeTab === 'home' ? theme.colors.primary : theme.colors.outline}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === 'home' ? theme.colors.primary : theme.colors.outline },
                ]}>
                {t('tabs.home')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'plan' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('plan')}>
              <Icon
                name="calendar-check"
                size={24}
                color={activeTab === 'plan' ? theme.colors.primary : theme.colors.outline}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === 'plan' ? theme.colors.primary : theme.colors.outline },
                ]}>
                {t('tabs.plan')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'gear' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('gear')}>
              <Icon
                name="briefcase"
                size={24}
                color={activeTab === 'gear' ? theme.colors.primary : theme.colors.outline}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === 'gear' ? theme.colors.primary : theme.colors.outline },
                ]}>
                {t('tabs.gear')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'mypage' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('mypage')}>
              <Icon
                name="account"
                size={24}
                color={activeTab === 'mypage' ? theme.colors.primary : theme.colors.outline}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === 'mypage' ? theme.colors.primary : theme.colors.outline },
                ]}>
                {t('tabs.mypage')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  tabBar: {
    flexDirection: 'row',
    height: 65,
    paddingBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonActive: {
    //
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default App;
