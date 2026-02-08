import React, {useState, useEffect, useMemo} from 'react';
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
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import PlanScreen from './src/screens/PlanScreen';
import GearScreen from './src/screens/GearScreen';
import CreatePlanScreen from './src/screens/CreatePlanScreen';
import CreateGearScreen from './src/screens/CreateGearScreen';

import {Plan, Gear, GearTemplate, PlanItem} from './src/types';
import {storage} from './src/utils/storage';

// Material Design 3 테마
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E7D32',
    onPrimary: '#FFFFFF',
    primaryContainer: '#C8E6C9',
    onPrimaryContainer: '#1B5E20',
    secondary: '#558B2F',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DCEDC8',
    onSecondaryContainer: '#33691E',
    tertiary: '#00695C',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#B2DFDB',
    onTertiaryContainer: '#004D40',
    background: '#F5F5F5',
    onBackground: '#1C1B1F',
    surface: '#FFFFFF',
    onSurface: '#1C1B1F',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',
    elevation: {
      level0: 'transparent',
      level1: '#F5F5F5',
      level2: '#EEEEEE',
      level3: '#E0E0E0',
      level4: '#BDBDBD',
      level5: '#9E9E9E',
    },
  },
  roundness: 4,
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'gear'>('home');
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

  const handleLogin = () => {
    setIsLoggedIn(true);
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
                const {children: _, ...rest} = item;
                return rest;
              }
              return {...item, children: filteredChildren};
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

      // 4. 계획 탭이나 장비 탭인 경우 → 홈으로 이동
      if (activeTab === 'plan' || activeTab === 'gear') {
        setActiveTab('home');
        return true;
      }

      // 5. 홈 화면인 경우 → 앱 종료 확인
      if (activeTab === 'home') {
        Alert.alert('앱 종료', 'PackPlanner를 종료하시겠습니까?', [
          {
            text: '취소',
            onPress: () => null,
            style: 'cancel',
          },
          {text: '종료', onPress: () => BackHandler.exitApp()},
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
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>데이터 로딩 중...</Text>
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // 로그인 화면
  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <LoginScreen onLogin={handleLogin} />
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
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <View style={styles.container}>
          <View style={styles.content}>{renderContent()}</View>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'home' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('home')}>
              <Icon
                name="home"
                size={24}
                color={activeTab === 'home' ? '#4CAF50' : '#999'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'home' && styles.tabLabelActive,
                ]}>
                홈
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
                color={activeTab === 'plan' ? '#4CAF50' : '#999'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'plan' && styles.tabLabelActive,
                ]}>
                계획
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
                color={activeTab === 'gear' ? '#4CAF50' : '#999'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'gear' && styles.tabLabelActive,
                ]}>
                장비
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FEF7FF',
    height: 80,
    paddingBottom: 16,
    paddingTop: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonActive: {
    // Material Design 3 스타일
  },
  tabLabel: {
    fontSize: 12,
    color: '#49454F',
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
});

export default App;
