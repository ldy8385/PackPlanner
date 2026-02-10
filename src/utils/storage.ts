import AsyncStorage from '@react-native-async-storage/async-storage';
import {Plan, Gear, GearTemplate} from '../types';
import {
  flattenPlanItemHierarchy,
  restorePlanItemHierarchy,
} from './gearHierarchy';

const STORAGE_KEYS = {
  PLANS: 'packplanner_plans',
  GEARS: 'packplanner_gears',
  TEMPLATES: 'packplanner_templates',
  IS_FIRST_LAUNCH: 'packplanner_is_first_launch',
  THEME: 'packplanner_theme',
  LANGUAGE: 'packplanner_language',
};

export const storage = {
  // Plans 저장
  savePlans: async (plans: Plan[]): Promise<void> => {
    try {
      // 계층 구조를 평탄화하여 저장
      const plansToSave = plans.map(plan => ({
        ...plan,
        items: flattenPlanItemHierarchy(plan.items),
      }));
      const jsonValue = JSON.stringify(plansToSave);
      await AsyncStorage.setItem(STORAGE_KEYS.PLANS, jsonValue);
    } catch (error) {
      console.error('Error saving plans:', error);
    }
  },

  // Plans 불러오기
  loadPlans: async (): Promise<Plan[] | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PLANS);
      if (jsonValue != null) {
        const plans = JSON.parse(jsonValue);
        // Date 객체 복원 및 계층 구조 복원
        return plans.map((plan: any) => ({
          ...plan,
          startDate: new Date(plan.startDate),
          endDate: new Date(plan.endDate),
          createdAt: new Date(plan.createdAt),
          items: restorePlanItemHierarchy(
            plan.items.map((item: any) => ({
              ...item,
              gear: {
                ...item.gear,
              },
            })),
          ),
        }));
      }
      return null;
    } catch (error) {
      console.error('Error loading plans:', error);
      return null;
    }
  },

  // Gears 저장 (평면 구조)
  saveGears: async (gears: Gear[]): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(gears);
      await AsyncStorage.setItem(STORAGE_KEYS.GEARS, jsonValue);
    } catch (error) {
      console.error('Error saving gears:', error);
    }
  },

  // Gears 불러오기 (평면 구조)
  loadGears: async (): Promise<Gear[] | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.GEARS);
      if (jsonValue != null) {
        return JSON.parse(jsonValue);
      }
      return null;
    } catch (error) {
      console.error('Error loading gears:', error);
      return null;
    }
  },

  // Templates 저장
  saveTemplates: async (templates: GearTemplate[]): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(templates);
      await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, jsonValue);
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  },

  // Templates 불러오기
  loadTemplates: async (): Promise<GearTemplate[] | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (jsonValue != null) {
        const templates = JSON.parse(jsonValue);
        // Date 객체 복원
        return templates.map((template: any) => ({
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt),
        }));
      }
      return null;
    } catch (error) {
      console.error('Error loading templates:', error);
      return null;
    }
  },

  // 첫 실행 여부 확인
  isFirstLaunch: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.IS_FIRST_LAUNCH);
      return value === null;
    } catch (error) {
      return true;
    }
  },

  // 첫 실행 완료 표시
  setFirstLaunchComplete: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_FIRST_LAUNCH, 'false');
    } catch (error) {
      console.error('Error setting first launch:', error);
    }
  },

  // 테마 저장
  saveTheme: async (theme: 'light' | 'dark' | 'system'): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  // 테마 불러오기
  loadTheme: async (): Promise<'light' | 'dark' | 'system' | null> => {
    try {
      const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (theme === 'light' || theme === 'dark' || theme === 'system') {
        return theme;
      }
      return null;
    } catch (error) {
      console.error('Error loading theme:', error);
      return null;
    }
  },

  // 언어 저장
  saveLanguage: async (language: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },

  // 언어 불러오기
  loadLanguage: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    } catch (error) {
      console.error('Error loading language:', error);
      return null;
    }
  },

  // 모든 데이터 초기화
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PLANS,
        STORAGE_KEYS.GEARS,
        STORAGE_KEYS.TEMPLATES,
        STORAGE_KEYS.IS_FIRST_LAUNCH,
        STORAGE_KEYS.THEME,
        STORAGE_KEYS.LANGUAGE,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
