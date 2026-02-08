import React, {useState, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {Text, Button, Chip, IconButton, Surface} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Gear, GearCategory, PlanItem} from '../types';
import {gearCategories} from '../data/mockData';
import {deepClonePlanItems} from '../utils/gearHierarchy';

interface GearSelectScreenProps {
  gears: Gear[];
  selectedGearIds?: string[];
  selectedItems?: PlanItem[];
  onSave: (selectedGearIds: string[], updatedItems?: PlanItem[]) => void;
  onCancel: () => void;
}

const {height} = Dimensions.get('window');

// 계층 구조 전체에서 특정 gearId의 총 수량 계산
const calculateGearQuantity = (items: PlanItem[], gearId: string): number => {
  let count = 0;
  const traverse = (itemList: PlanItem[]) => {
    itemList.forEach(item => {
      if (item.gearId === gearId) {
        count += item.quantity;
      }
      if (item.children) {
        traverse(item.children);
      }
    });
  };
  traverse(items);
  return count;
};

const GearSelectScreen: React.FC<GearSelectScreenProps> = ({
  gears,
  selectedGearIds: initialSelectedIds,
  selectedItems,
  onSave,
  onCancel,
}) => {
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<GearCategory | null>(
    null,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [isBottomExpanded, setIsBottomExpanded] = useState(true);

  // 초기 선택된 장비들을 PlanItem으로 변환
  React.useEffect(() => {
    // selectedItems가 있으면 계층 구조 유지 (깊은 복사), 없으면 flat IDs에서 변환
    if (selectedItems && selectedItems.length > 0) {
      // 깊은 복사로 원본 데이터 보호
      setPlanItems(deepClonePlanItems(selectedItems));
    } else if (initialSelectedIds && initialSelectedIds.length > 0) {
      const initialItems: PlanItem[] = gears
        .filter(g => initialSelectedIds.includes(g.id))
        .map((gear, index) => ({
          id: `initial_${index}_${gear.id}`,
          gearId: gear.id,
          gear: gear,
          isChecked: false,
          quantity: 1,
        }));
      setPlanItems(initialItems);
    } else {
      setPlanItems([]);
    }
  }, [initialSelectedIds, selectedItems, gears]);

  // 자식이 있는 아이템들을 초기에 펼친 상태로 설정
  React.useEffect(() => {
    const getIdsWithChildren = (items: PlanItem[]): Set<string> => {
      const ids = new Set<string>();
      const traverse = (list: PlanItem[]) => {
        list.forEach(item => {
          if (item.children && item.children.length > 0) {
            ids.add(item.id);
            traverse(item.children);
          }
        });
      };
      traverse(items);
      return ids;
    };

    setExpandedIds(getIdsWithChildren(planItems));
  }, [planItems]);

  // 모든 태그 추출
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    gears.forEach(gear => {
      gear.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [gears]);

  // Gear별 최대 수량
  const getGearMaxQuantity = (gear: Gear): number => {
    return gear.quantity || 1;
  };

  // 필터링된 장비 목록
  const filteredGears = useMemo(() => {
    let result = gears.filter(g => {
      const usedQuantity = calculateGearQuantity(planItems, g.id);
      const maxQuantity = getGearMaxQuantity(g);
      return usedQuantity < maxQuantity;
    });

    if (selectedCategory) {
      result = result.filter(g => g.category === selectedCategory);
    }
    if (selectedTags.length > 0) {
      result = result.filter(g =>
        selectedTags.some(tag => g.tags.includes(tag)),
      );
    }
    return result;
  }, [gears, planItems, selectedCategory, selectedTags]);

  // 총 무게 계산
  const totalSelectedWeight = useMemo(() => {
    let total = 0;
    const calculateWeight = (items: PlanItem[]) => {
      items.forEach(item => {
        total += item.gear.weight * item.quantity;
        if (item.children) {
          calculateWeight(item.children);
        }
      });
    };
    calculateWeight(planItems);
    return total;
  }, [planItems]);

  const toggleExpand = (itemId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // 루트에 Gear 추가
  const addGearToRoot = (gear: Gear) => {
    const newItem: PlanItem = {
      id: `${Date.now()}_${gear.id}`,
      gearId: gear.id,
      gear: gear,
      isChecked: false,
      quantity: 1,
    };
    setPlanItems(prev => [...prev, newItem]);
  };

  // PlanItem을 다른 컨테이너로 이동
  const moveItemToContainer = (itemId: string, targetContainerId: string) => {
    setPlanItems(prev => {
      let itemToMove: PlanItem | null = null;

      const findAndRemove = (items: PlanItem[]): PlanItem[] => {
        return items
          .map(item => {
            if (item.id === itemId) {
              // 부모와 자식들을 함께 이동 (자식 승격 없음)
              itemToMove = item;
              return null;
            }
            if (item.children) {
              const updatedChildren = findAndRemove(item.children);
              const filtered = updatedChildren.filter(
                (i): i is PlanItem => i !== null,
              );
              if (filtered.length === 0) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {children: _, ...rest} = item;
                return rest;
              }
              return {...item, children: filtered};
            }
            return item;
          })
          .filter((i): i is PlanItem => i !== null);
      };

      let updatedItems = findAndRemove(prev);

      if (itemToMove) {
        const addToTarget = (items: PlanItem[]): PlanItem[] => {
          return items.map(item => {
            if (item.id === targetContainerId && item.gear.container) {
              const children = item.children || [];
              return {
                ...item,
                children: [...children, itemToMove!],
              };
            }
            if (item.children) {
              return {...item, children: addToTarget(item.children)};
            }
            return item;
          });
        };
        updatedItems = addToTarget(updatedItems);
      }

      return updatedItems;
    });
  };

  // PlanItem을 루트로 이동
  const moveItemToRoot = (itemId: string) => {
    setPlanItems(prev => {
      let itemToMove: PlanItem | null = null;

      const findAndRemove = (items: PlanItem[]): PlanItem[] => {
        return items
          .map(item => {
            if (item.id === itemId) {
              // 부모와 자식들을 함께 이동 (자식 승격 없음)
              itemToMove = item;
              return null;
            }
            if (item.children) {
              const updatedChildren = findAndRemove(item.children);
              const filtered = updatedChildren.filter(
                (i): i is PlanItem => i !== null,
              );
              if (filtered.length === 0) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {children: _, ...rest} = item;
                return rest;
              }
              return {...item, children: filtered};
            }
            return item;
          })
          .filter((i): i is PlanItem => i !== null);
      };

      let updatedItems = findAndRemove(prev);

      if (itemToMove) {
        updatedItems = [...updatedItems, itemToMove];
      }

      return updatedItems;
    });
  };

  // PlanItem 삭제
  const removePlanItem = (itemId: string) => {
    setPlanItems(prev => {
      const removeFromTree = (items: PlanItem[]): PlanItem[] => {
        return items
          .map(item => {
            if (item.id === itemId) {
              return item.children || null;
            }
            if (item.children) {
              const updatedChildren = removeFromTree(item.children);
              const filtered = updatedChildren.filter(
                (i): i is PlanItem => i !== null,
              );
              if (filtered.length === 0) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {children: _, ...rest} = item;
                return rest;
              }
              return {...item, children: filtered};
            }
            return item;
          })
          .flat()
          .filter((i): i is PlanItem => i !== null);
      };
      return removeFromTree(prev);
    });
  };

  const handleSave = () => {
    const getAllGearIds = (items: PlanItem[]): string[] => {
      const ids: string[] = [];
      items.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          ids.push(item.gearId);
        }
        if (item.children) {
          ids.push(...getAllGearIds(item.children));
        }
      });
      return ids;
    };
    // 계층 구조와 함께 저장
    onSave(getAllGearIds(planItems), planItems);
  };

  const findItem = (items: PlanItem[], id: string): PlanItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItem(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const movingItem = movingId ? findItem(planItems, movingId) : null;

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* 상단: 드롭 영역 */}
        <Surface style={styles.dropZoneContainer} elevation={4}>
          <View style={styles.dropZoneHeader}>
            <IconButton icon="arrow-left" size={24} onPress={onCancel} />
            <View style={styles.headerCenter}>
              <Text variant="titleMedium" style={styles.dropZoneTitle}>
                패킹 리스트
              </Text>
              <Text variant="bodySmall" style={styles.statsText}>
                {planItems.length}개 항목 · {totalSelectedWeight.toFixed(1)}kg
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={handleSave}
              buttonColor="#2E7D32"
              compact
              style={styles.saveBtn}>
              저장
            </Button>
          </View>

          <ScrollView
            style={styles.dropZoneScroll}
            contentContainerStyle={movingId ? {paddingBottom: 140} : undefined}>
            {planItems.length === 0 ? (
              <View style={styles.emptyDropZone}>
                <Icon name="package-variant" size={48} color="#C8E6C9" />
                <Text variant="titleSmall" style={styles.emptyTitle}>
                  장비를 추가하세요
                </Text>
                <Text variant="bodySmall" style={styles.emptySubtext}>
                  아래에서 장비를 추가하거나 터치하여 이동하세요
                </Text>
              </View>
            ) : (
              <View style={styles.planItemsContainer}>
                {planItems.map(item => (
                  <PlanItemView
                    key={item.id}
                    item={item}
                    depth={0}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                    onMoveToContainer={moveItemToContainer}
                    onMoveToRoot={moveItemToRoot}
                    onDelete={removePlanItem}
                    movingId={movingId}
                    setMovingId={setMovingId}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* 이동 모드 UI */}
          {movingId && movingItem && (
            <View style={styles.moveModeUI}>
              <Surface style={styles.moveInfo} elevation={5}>
                <Icon name="arrow-all" size={24} color="#fff" />
                <Text variant="bodyMedium" style={styles.moveInfoText}>
                  {movingItem.gear.name} 이동 중...
                </Text>
              </Surface>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.rootBtn}
                  onPress={() => {
                    moveItemToRoot(movingId);
                    setMovingId(null);
                  }}>
                  <Icon name="arrow-up" size={20} color="#fff" />
                  <Text variant="bodyMedium" style={styles.actionBtnText}>
                    루트로
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setMovingId(null)}>
                  <Icon name="close" size={20} color="#fff" />
                  <Text variant="bodyMedium" style={styles.actionBtnText}>
                    취소
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    removePlanItem(movingId);
                    setMovingId(null);
                  }}>
                  <Icon name="delete" size={20} color="#fff" />
                  <Text variant="bodyMedium" style={styles.actionBtnText}>
                    삭제
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Surface>

        {/* 하단 토글 버튼 */}
        <TouchableOpacity
          style={styles.bottomToggle}
          onPress={() => setIsBottomExpanded(!isBottomExpanded)}>
          <Icon
            name={isBottomExpanded ? 'chevron-down' : 'chevron-up'}
            size={24}
            color="#666"
          />
          <Text variant="bodySmall" style={styles.bottomToggleText}>
            {isBottomExpanded ? '장비 목록 접기' : '장비 목록 펼치기'}
          </Text>
          <View style={styles.badgeContainer}>
            <Surface style={styles.countBadge} elevation={1}>
              <Text variant="labelSmall" style={styles.countBadgeText}>
                {filteredGears.length}
              </Text>
            </Surface>
          </View>
        </TouchableOpacity>

        {/* 하단: 필터 + 장비 목록 (접을 수 있음) */}
        {isBottomExpanded && (
          <View style={styles.sourceContainer}>
            <View style={styles.filterSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}>
                <Chip
                  onPress={() => setSelectedCategory(null)}
                  style={[
                    styles.filterChip,
                    !selectedCategory && styles.filterChipSelected,
                  ]}
                  textStyle={
                    !selectedCategory
                      ? styles.filterChipTextSelected
                      : undefined
                  }>
                  전체
                </Chip>
                {gearCategories.map(category => (
                  <Chip
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                      styles.filterChip,
                      selectedCategory === category &&
                        styles.filterChipSelected,
                    ]}
                    textStyle={
                      selectedCategory === category
                        ? styles.filterChipTextSelected
                        : undefined
                    }>
                    {category}
                  </Chip>
                ))}
              </ScrollView>

              {allTags.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tagFilterScrollContent}>
                  <Chip
                    onPress={() => setSelectedTags([])}
                    style={[
                      styles.tagFilterChip,
                      selectedTags.length === 0 && styles.tagFilterChipSelected,
                    ]}
                    textStyle={
                      selectedTags.length === 0
                        ? styles.tagFilterChipTextSelected
                        : undefined
                    }>
                    모든 태그
                  </Chip>
                  {allTags.map(tag => (
                    <Chip
                      key={tag}
                      onPress={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      style={[
                        styles.tagFilterChip,
                        selectedTags.includes(tag) &&
                          styles.tagFilterChipSelected,
                      ]}
                      textStyle={
                        selectedTags.includes(tag)
                          ? styles.tagFilterChipTextSelected
                          : undefined
                      }>
                      #{tag}
                    </Chip>
                  ))}
                </ScrollView>
              )}
            </View>

            <ScrollView style={styles.gearList}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                추가할 장비 ({filteredGears.length}개)
              </Text>

              {filteredGears.map(gear => {
                const usedQuantity = calculateGearQuantity(planItems, gear.id);
                const maxQuantity = getGearMaxQuantity(gear);
                const remaining = maxQuantity - usedQuantity;

                return (
                  <Surface key={gear.id} style={styles.gearCard} elevation={2}>
                    <View style={styles.gearCardContent}>
                      <View style={styles.gearInfo}>
                        <Text variant="bodyMedium" style={styles.gearName}>
                          {gear.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.gearMeta}>
                          {gear.weight}kg · {gear.category}
                        </Text>
                        <Text variant="bodySmall" style={styles.quantityText}>
                          사용: {usedQuantity} / {maxQuantity} · 남은:{' '}
                          {remaining}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => addGearToRoot(gear)}>
                        <Icon name="plus-circle" size={36} color="#2E7D32" />
                      </TouchableOpacity>
                    </View>
                  </Surface>
                );
              })}

              {filteredGears.length === 0 && (
                <View style={styles.noGearsMessage}>
                  <Text variant="bodyMedium" style={styles.noGearsText}>
                    추가할 장비가 없습니다
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// PlanItem 재귀 컴포넌트
const PlanItemView: React.FC<{
  item: PlanItem;
  depth: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onMoveToContainer: (itemId: string, containerId: string) => void;
  onMoveToRoot: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  movingId: string | null;
  setMovingId: (id: string | null) => void;
}> = ({
  item,
  depth,
  expandedIds,
  onToggleExpand,
  onMoveToContainer,
  onMoveToRoot,
  onDelete,
  movingId,
  setMovingId,
}) => {
  const isExpanded = expandedIds.has(item.id);
  const hasChildren = item.children && item.children.length > 0;
  const isContainer = item.gear.container;
  const isMoving = movingId === item.id;
  const isDropTarget = movingId && isContainer && movingId !== item.id;

  // 직계 자식 수 계산 (하위의 하위는 제외)
  const directChildCount = item.children?.length || 0;

  return (
    <View style={{marginLeft: depth * 24}}>
      {/* 메인 아이템 (이동 중이면 숨김) */}
      {!isMoving && (
        <Surface
          style={[styles.planItemCard, isDropTarget && styles.dropTargetCard]}
          elevation={isDropTarget ? 3 : 1}>
          <TouchableOpacity
            style={styles.planItemHeader}
            onPress={() => onToggleExpand(item.id)}
            onLongPress={() => setMovingId(item.id)}
            delayLongPress={300}
            activeOpacity={0.7}>
            <View style={styles.planItemRow}>
              {isContainer ? (
                <Icon
                  name={isExpanded ? 'chevron-down' : 'chevron-right'}
                  size={22}
                  color="#666"
                />
              ) : (
                <View style={{width: 22}} />
              )}

              <View style={styles.planItemIcon}>
                <Icon name="cube" size={20} color="#2E7D32" />
              </View>

              <View style={styles.planItemInfo}>
                <Text variant="bodyMedium" style={styles.planItemName}>
                  {item.gear.name}
                </Text>
                <Text variant="bodySmall" style={styles.planItemMeta}>
                  {item.gear.weight}kg × {item.quantity} ={' '}
                  {(item.gear.weight * item.quantity).toFixed(1)}kg
                </Text>
              </View>

              {/* 컨테이너 아이콘과 자식 수 표시 */}
              <View style={styles.rightIcons}>
                {isContainer && (
                  <View style={styles.containerBadge}>
                    <Icon
                      name="package-variant-closed"
                      size={14}
                      color="#fff"
                    />
                  </View>
                )}

                {/* 직계 자식 수 표시 (+1, +2 등) */}
                {directChildCount > 0 && (
                  <Surface style={styles.childCountBadge} elevation={1}>
                    <Text variant="labelSmall" style={styles.childCountText}>
                      +{directChildCount}
                    </Text>
                  </Surface>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* 드롭 버튼 (이동 모드일 때만 표시) */}
          {isDropTarget && (
            <TouchableOpacity
              style={styles.dropButton}
              onPress={() => {
                onMoveToContainer(movingId, item.id);
                setMovingId(null);
              }}>
              <Icon name="arrow-down-circle" size={20} color="#fff" />
              <Text variant="bodyMedium" style={styles.dropButtonText}>
                여기에 넣기
              </Text>
            </TouchableOpacity>
          )}
        </Surface>
      )}

      {/* 자식 아이템들 */}
      {isExpanded && hasChildren && (
        <View style={styles.childrenContainer}>
          {item.children!.map(child => (
            <PlanItemView
              key={child.id}
              item={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onMoveToContainer={onMoveToContainer}
              onMoveToRoot={onMoveToRoot}
              onDelete={onDelete}
              movingId={movingId}
              setMovingId={setMovingId}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dropZoneContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderBottomWidth: 3,
    borderBottomColor: '#2E7D32',
  },
  dropZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#C8E6C9',
    borderBottomWidth: 1,
    borderBottomColor: '#A5D6A7',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dropZoneTitle: {
    fontWeight: '700',
    color: '#1B5E20',
  },
  statsText: {
    color: '#2E7D32',
    marginTop: 2,
  },
  saveBtn: {
    minWidth: 60,
  },
  dropZoneScroll: {
    flex: 1,
    padding: 12,
  },
  emptyDropZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#2E7D32',
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#81C784',
    marginTop: 4,
    textAlign: 'center',
  },
  planItemsContainer: {
    flex: 1,
  },
  planItemCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  planItemHeader: {
    padding: 12,
  },
  planItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropTargetCard: {
    borderColor: '#2E7D32',
    borderWidth: 2,
    backgroundColor: '#E8F5E9',
  },
  planItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planItemInfo: {
    flex: 1,
  },
  planItemName: {
    color: '#333',
    fontWeight: '500',
  },
  planItemMeta: {
    color: '#666',
    marginTop: 2,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  containerBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childCountBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  childCountText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  dropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#2E7D32',
    margin: 8,
    marginTop: 0,
    borderRadius: 6,
  },
  dropButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  childrenContainer: {
    marginTop: 4,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#C8E6C9',
  },
  moveModeUI: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderTopColor: '#2E7D32',
  },
  moveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#2E7D32',
  },
  moveInfoText: {
    color: '#fff',
    fontWeight: '600',
  },
  moveInfoSubtext: {
    color: '#C8E6C9',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    gap: 8,
  },
  rootBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#757575',
    borderRadius: 8,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#B3261E',
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  bottomToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#E0E0E0',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    gap: 8,
  },
  bottomToggleText: {
    color: '#666',
  },
  badgeContainer: {
    position: 'absolute',
    right: 16,
  },
  countBadge: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  sourceContainer: {
    height: height * 0.35,
    backgroundColor: '#f5f5f5',
  },
  filterSection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagFilterScrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#E0E0E0',
  },
  filterChipSelected: {
    backgroundColor: '#4CAF50',
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  tagFilterChip: {
    backgroundColor: '#E0E0E0',
  },
  tagFilterChipSelected: {
    backgroundColor: '#2196F3',
  },
  tagFilterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  gearList: {
    flex: 1,
    padding: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
    fontSize: 16,
  },
  gearCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  gearCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  gearInfo: {
    flex: 1,
  },
  gearName: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
  gearMeta: {
    color: '#666',
    marginTop: 2,
  },
  quantityText: {
    color: '#999',
    marginTop: 2,
  },
  addBtn: {
    padding: 4,
  },
  noGearsMessage: {
    padding: 40,
    alignItems: 'center',
  },
  noGearsText: {
    color: '#666',
    textAlign: 'center',
  },
});

export default GearSelectScreen;
