import AsyncStorage from '@react-native-async-storage/async-storage';
import {Plan, Gear, GearTemplate} from '../types';

const STORAGE_KEYS = {
  PLANS: 'packplanner_plans',
  GEARS: 'packplanner_gears',
  TEMPLATES: 'packplanner_templates',
  IS_FIRST_LAUNCH: 'packplanner_is_first_launch',
};

export const storage = {
  // Plans 저장
  savePlans: async (plans: Plan[]): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(plans);
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
        // Date 객체 복원
        return plans.map((plan: any) => ({
          ...plan,
          startDate: new Date(plan.startDate),
          endDate: new Date(plan.endDate),
          createdAt: new Date(plan.createdAt),
          items: plan.items.map((item: any) => ({
            ...item,
            gear: {
              ...item.gear,
            },
          })),
        }));
      }
      return null;
    } catch (error) {
      console.error('Error loading plans:', error);
      return null;
    }
  },

  // Gears 저장
  saveGears: async (gears: Gear[]): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(gears);
      await AsyncStorage.setItem(STORAGE_KEYS.GEARS, jsonValue);
    } catch (error) {
      console.error('Error saving gears:', error);
    }
  },

  // Gears 불러오기
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

  // 모든 데이터 초기화
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PLANS,
        STORAGE_KEYS.GEARS,
        STORAGE_KEYS.TEMPLATES,
        STORAGE_KEYS.IS_FIRST_LAUNCH,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
