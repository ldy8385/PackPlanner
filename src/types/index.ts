export interface Manufacturer {
  key: string;
  ko: string;
  en: string;
}

export interface Gear {
  id: string;
  name: string;
  manufacturer?: string;
  category: GearCategory;
  weight: number;
  description?: string;
  imageUrl?: string;
  tags: string[];
  container?: boolean; // 수납 여부 (배낭/파우치 등에 담을 수 있는지)
  quantity?: number; // 수량 (기본값: 1)
}

export enum GearCategory {
  TENT = 'TENT',
  TARP = 'TARP',
  SLEEPING_BAG = 'SLEEPING_BAG',
  PILLOW = 'PILLOW',
  MAT = 'MAT',
  COOKING = 'COOKING',
  LIGHTING = 'LIGHTING',
  BATTERY = 'BATTERY',
  CAMERA = 'CAMERA',
  POUCH = 'POUCH',
  CHAIR = 'CHAIR',
  TABLE = 'TABLE',
  SOUND = 'SOUND',
  FURNITURE = 'FURNITURE',
  CLOTHING = 'CLOTHING',
  ACCESSORIES = 'ACCESSORIES',
  TOOLS = 'TOOLS',
  CARE = 'CARE',
  DOWN = 'DOWN',
  BOOTY = 'BOOTY',
  FOOD = 'FOOD',
  BOTTLE = 'BOTTLE',
  TABLEWARE = 'TABLEWARE',
  HIKING_STICK = 'HIKING_STICK',
  BAG = 'BAG',
  ETC = 'ETC',
}

export enum PlanType {
  AUTO_CAMPING = 'AUTO_CAMPING',
  MOTO_CAMPING = 'MOTO_CAMPING',
  BIKE_CAMPING = 'BIKE_CAMPING',
  BACKPACKING = 'BACKPACKING',
}

export interface Location {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

export const PLAN_MAX_PHOTOS = 10;

export interface Plan {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  destination: string;
  location?: Location;
  type: PlanType;
  description?: string;
  photos?: string[];
  createdAt: Date;
  items: PlanItem[];
  isCompleted: boolean;
}

export interface PlanItem {
  id: string;
  gearId: string;
  gear: Gear;
  isChecked: boolean;
  quantity: number;
  children?: PlanItem[]; // 자식 장비 (계층 구조)
  parentId?: string; // 부모 장비 ID
  expanded?: boolean; // UI에서 펼침/접힘 상태
}

export interface GearTemplate {
  id: string;
  name: string;
  description?: string;
  gearIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
}
