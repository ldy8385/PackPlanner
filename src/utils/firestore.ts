import database from '@react-native-firebase/database';
import { Plan, Gear, GearTemplate } from '../types';
import {
  flattenPlanItemHierarchy,
} from './gearHierarchy';

// 오프라인 캐싱 활성화
database().setPersistenceEnabled(true);

const getUserRef = (userId: string, path: string) =>
  database().ref(`users/${userId}/${path}`);

// ===== Plan 변환 =====

const planToDb = (plan: Plan) => {
  const { items, ...rest } = plan;
  const flatItems = flattenPlanItemHierarchy(items);
  return {
    ...rest,
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate.toISOString(),
    createdAt: plan.createdAt.toISOString(),
    items: flatItems.map(({ children, expanded, gear, ...item }) => item),
  };
};

const planFromDb = (key: string, data: any): Plan => ({
  ...data,
  id: key,
  startDate: new Date(data.startDate),
  endDate: new Date(data.endDate),
  createdAt: new Date(data.createdAt),
  items: data.items || [],
});

// ===== Template 변환 =====

const templateToDb = (template: GearTemplate) => ({
  ...template,
  createdAt: template.createdAt.toISOString(),
  updatedAt: template.updatedAt.toISOString(),
});

const templateFromDb = (key: string, data: any): GearTemplate => ({
  ...data,
  id: key,
  createdAt: new Date(data.createdAt),
  updatedAt: new Date(data.updatedAt),
});

// ===== 헬퍼: snapshot → 배열 =====

const snapshotToArray = <T>(
  snapshot: any,
  fromDb: (key: string, data: any) => T,
): T[] => {
  const results: T[] = [];
  if (snapshot.exists()) {
    snapshot.forEach((child: any) => {
      results.push(fromDb(child.key, child.val()));
      return undefined;
    });
  }
  return results;
};

// ===== DB 서비스 =====

export const firestoreService = {
  // ----- Gears -----
  saveGear: async (userId: string, gear: Gear): Promise<void> => {
    await getUserRef(userId, `gears/${gear.id}`).set(gear);
  },

  saveGears: async (userId: string, gears: Gear[]): Promise<void> => {
    const updates: Record<string, any> = {};
    gears.forEach(gear => {
      updates[gear.id] = gear;
    });
    await getUserRef(userId, 'gears').update(updates);
  },

  deleteGear: async (userId: string, gearId: string): Promise<void> => {
    await getUserRef(userId, `gears/${gearId}`).remove();
  },

  loadGears: async (userId: string): Promise<Gear[]> => {
    const snapshot = await getUserRef(userId, 'gears').once('value');
    const results: Gear[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child: any) => {
        results.push({ ...child.val(), id: child.key });
        return undefined;
      });
    }
    return results;
  },

  // ----- Plans -----
  savePlan: async (userId: string, plan: Plan): Promise<void> => {
    await getUserRef(userId, `plans/${plan.id}`).set(planToDb(plan));
  },

  savePlans: async (userId: string, plans: Plan[]): Promise<void> => {
    const updates: Record<string, any> = {};
    plans.forEach(plan => {
      updates[plan.id] = planToDb(plan);
    });
    await getUserRef(userId, 'plans').update(updates);
  },

  deletePlan: async (userId: string, planId: string): Promise<void> => {
    await getUserRef(userId, `plans/${planId}`).remove();
  },

  loadPlans: async (userId: string): Promise<Plan[]> => {
    const snapshot = await getUserRef(userId, 'plans').once('value');
    return snapshotToArray(snapshot, planFromDb);
  },

  // ----- Templates -----
  saveTemplate: async (userId: string, template: GearTemplate): Promise<void> => {
    await getUserRef(userId, `templates/${template.id}`).set(templateToDb(template));
  },

  saveTemplates: async (userId: string, templates: GearTemplate[]): Promise<void> => {
    const updates: Record<string, any> = {};
    templates.forEach(template => {
      updates[template.id] = templateToDb(template);
    });
    await getUserRef(userId, 'templates').update(updates);
  },

  deleteTemplate: async (userId: string, templateId: string): Promise<void> => {
    await getUserRef(userId, `templates/${templateId}`).remove();
  },

  loadTemplates: async (userId: string): Promise<GearTemplate[]> => {
    const snapshot = await getUserRef(userId, 'templates').once('value');
    return snapshotToArray(snapshot, templateFromDb);
  },
};
