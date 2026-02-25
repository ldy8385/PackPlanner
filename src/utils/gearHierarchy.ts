import {PlanItem, Gear} from '../types';

/**
 * PlanItem 계층의 총 아이템 수, 체크 수, 무게 집계
 */
export const countAllItems = (
  items: PlanItem[],
): {total: number; checked: number; weight: number} => {
  let total = 0,
    checked = 0,
    weight = 0;
  const traverse = (list: PlanItem[]) => {
    list.forEach(i => {
      total++;
      if (i.isChecked) checked++;
      weight += i.gear.weight * i.quantity;
      if (i.children) traverse(i.children);
    });
  };
  traverse(items);
  return {total, checked, weight};
};

/**
 * PlanItem 배열에 gear 데이터를 주입 (gearId → Gear 매핑)
 * gear가 삭제된 아이템은 제외됨
 */
export const hydratePlanItemGears = (
  items: PlanItem[],
  gearMap: Map<string, Gear>,
): PlanItem[] => {
  const result: PlanItem[] = [];
  for (const item of items) {
    const gear = gearMap.get(item.gearId);
    if (!gear) continue;
    result.push({
      ...item,
      gear,
      children: item.children
        ? hydratePlanItemGears(item.children, gearMap)
        : undefined,
    });
  }
  return result;
};

/**
 * PlanItem 계층 구조를 평탄화하여 저장용으로 변환
 * 모든 노드를 1차원 배열로 만들되, parentId 참조를 유지
 */
export const flattenPlanItemHierarchy = (items: PlanItem[]): PlanItem[] => {
  const flatList: PlanItem[] = [];
  const processedIds = new Set<string>();

  const processItem = (item: PlanItem, parentId?: string) => {
    if (processedIds.has(item.id)) {
      return;
    }
    processedIds.add(item.id);

    const {children, ...itemWithoutChildren} = item;
    const flatItem: PlanItem = {
      ...itemWithoutChildren,
      parentId,
    };

    flatList.push(flatItem);

    if (children && children.length > 0) {
      children.forEach(child => processItem(child, item.id));
    }
  };

  items.forEach(item => processItem(item));
  return flatList;
};

/**
 * 평탄화된 PlanItem을 다시 계층 구조로 복원
 */
export const restorePlanItemHierarchy = (flatItems: PlanItem[]): PlanItem[] => {
  const itemMap = new Map<string, PlanItem>();
  const rootItems: PlanItem[] = [];

  // 1단계: 모든 item을 맵에 저장
  flatItems.forEach(item => {
    itemMap.set(item.id, {...item, children: []});
  });

  // 2단계: parentId 기반으로 트리 구조 복원
  flatItems.forEach(item => {
    const processedItem = itemMap.get(item.id)!;

    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent && parent.gear.container) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(processedItem);
      } else {
        rootItems.push(processedItem);
      }
    } else {
      rootItems.push(processedItem);
    }
  });

  // 3단계: 빈 children 배열 제거
  const cleanEmptyChildren = (item: PlanItem): PlanItem => {
    if (item.children && item.children.length === 0) {
      delete item.children;
    } else if (item.children) {
      item.children = item.children.map(cleanEmptyChildren);
    }
    return item;
  };

  return rootItems.map(cleanEmptyChildren);
};

/**
 * PlanItem 계층 구조를 깊은 복사 (deep clone)
 */
export const deepClonePlanItems = (items: PlanItem[]): PlanItem[] => {
  return items.map(item => {
    const cloned: PlanItem = {...item};
    if (item.children) {
      cloned.children = deepClonePlanItems(item.children);
    }
    return cloned;
  });
};

/**
 * PlanItem 계층 구조에서 모든 gearId 수집 (자식 포함)
 */
export const getAllGearIdsFromPlanItems = (items: PlanItem[]): string[] => {
  const gearIds: string[] = [];

  const collectIds = (itemList: PlanItem[]) => {
    itemList.forEach(item => {
      gearIds.push(item.gearId);
      if (item.children && item.children.length > 0) {
        collectIds(item.children);
      }
    });
  };

  collectIds(items);
  return gearIds;
};

/**
 * PlanItem 계층에서 특정 gearId를 가진 아이템과 그 자식들 제거
 */
export const removePlanItemByGearId = (
  items: PlanItem[],
  gearId: string,
): PlanItem[] => {
  const removeFromTree = (itemList: PlanItem[]): PlanItem[] => {
    return itemList
      .map(item => {
        if (item.gearId === gearId) {
          // 해당 아이템 제거 (자식들도 함께 제거됨)
          return null;
        }
        if (item.children) {
          const updatedChildren = removeFromTree(item.children);
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
      .filter((i): i is PlanItem => i !== null);
  };

  return removeFromTree(items);
};

/**
 * 특정 PlanItem에 자식 PlanItem 추가
 * parentGear가 container여야 함
 */
export const addChildPlanItem = (
  items: PlanItem[],
  parentItemId: string,
  childPlanItem: PlanItem,
): PlanItem[] => {
  const addToTree = (itemList: PlanItem[]): PlanItem[] => {
    return itemList.map(item => {
      if (item.id === parentItemId) {
        // parent 찾음 - 자식 추가 (gear가 container인 경우만)
        if (item.gear.container) {
          const existingChildren = item.children || [];
          return {
            ...item,
            children: [...existingChildren, childPlanItem],
          };
        }
        return item;
      }
      if (item.children) {
        return {
          ...item,
          children: addToTree(item.children),
        };
      }
      return item;
    });
  };

  return addToTree(items);
};

/**
 * PlanItem 트리에서 특정 아이템을 다른 부모로 이동
 */
export const movePlanItem = (
  items: PlanItem[],
  itemIdToMove: string,
  targetParentId: string | null,
): PlanItem[] => {
  // 1. 먼저 이동할 아이템을 찾아서 제거
  let itemToMove: PlanItem | null = null;

  const findAndRemove = (itemList: PlanItem[]): PlanItem[] => {
    return itemList
      .map(item => {
        if (item.id === itemIdToMove) {
          itemToMove = item;
          return null; // 제거
        }
        if (item.children) {
          const updatedChildren = findAndRemove(item.children);
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
      .filter((i): i is PlanItem => i !== null);
  };

  let updatedItems = findAndRemove(items);

  // 2. 타겟 부모에 추가 (또는 루트에 추가)
  if (itemToMove) {
    const itemToMoveCopy: PlanItem = itemToMove;
    if (targetParentId) {
      updatedItems = addChildPlanItem(updatedItems, targetParentId, {
        ...itemToMoveCopy,
        parentId: targetParentId,
      });
    } else {
      // 루트에 추가
      updatedItems.push({...itemToMoveCopy, parentId: undefined});
    }
  }

  return updatedItems;
};

/**
 * 모든 PlanItem을 1차원 배열로 펼치기 (검색/필터링용)
 */
export const flattenPlanItems = (items: PlanItem[]): PlanItem[] => {
  const result: PlanItem[] = [];

  const traverse = (itemList: PlanItem[]) => {
    itemList.forEach(item => {
      result.push(item);
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    });
  };

  traverse(items);
  return result;
};

/**
 * 특정 ID의 PlanItem 찾기
 */
export const findPlanItemById = (
  items: PlanItem[],
  itemId: string,
): PlanItem | undefined => {
  const allItems = flattenPlanItems(items);
  return allItems.find(i => i.id === itemId);
};

/**
 * PlanItem 계층에서 특정 아이템의 모든 자식 ID 수집
 */
export const getAllChildPlanItemIds = (item: PlanItem): string[] => {
  const childIds: string[] = [];

  const collectIds = (planItem: PlanItem) => {
    if (planItem.children && planItem.children.length > 0) {
      planItem.children.forEach(child => {
        childIds.push(child.id);
        collectIds(child);
      });
    }
  };

  collectIds(item);
  return childIds;
};
