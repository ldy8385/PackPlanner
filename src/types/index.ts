export interface Gear {
  id: string;
  name: string;
  manufacturer?: string;
  category: GearCategory;
  weight: number;
  description?: string;
  imageUrl?: string;
  tags: string[];
}

export enum GearCategory {
  TENT = '텐트/쉘터',
  TARP = '타프',
  SLEEPING_BAG = '침낭',
  PILLOW = '베개',
  MAT = '매트',
  COOKING = '취사도구',
  LIGHTING = '조명',
  BATTERY = '배터리',
  CAMERA = '카메라',
  POUCH = '파우치/디팩',
  CHAIR = '의자',
  TABLE = '테이블',
  SOUND = '음향기기',
  FURNITURE = '가구',
  CLOTHING = '의류',
  ACCESSORIES = '액세서리',
  TOOLS = '도구',
  CARE = '위생용품',
  DOWN = '우모복',
  BOOTY = '부티',
  FOOD = '음식',
  BOTTLE = '물병',
  TABLEWARE = '식기',
  HIKING_STICK = '등산스틱',
  BAG = '배낭/가방',
  ETC = '기타',
}

export enum PlanType {
  AUTO_CAMPING = '오토캠핑',
  MOTO_CAMPING = '모토캠핑',
  BACKPACKING = '백패킹',
}

export interface Location {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

export interface Plan {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  destination: string;
  location?: Location;
  type: PlanType;
  description?: string;
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
}

export interface GearTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
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
