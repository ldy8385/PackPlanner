import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { Text, Button, Chip, IconButton, Surface, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Gear, GearCategory, GearTemplate, PlanItem } from '../types';
import { gearCategories } from '../data/mockData';
import { deepClonePlanItems, getCategoryIcon, formatNumber } from '../utils/gearHierarchy';
import { t } from 'i18next';

interface GearSelectScreenProps {
  gears: Gear[];
  selectedGearIds?: string[];
  selectedItems?: PlanItem[];
  onSave: (selectedGearIds: string[], updatedItems?: PlanItem[]) => void;
  onCancel: () => void;
  templates?: GearTemplate[];
}

const { height } = Dimensions.get('window');

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
  templates,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<GearCategory | null>(
    null,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [isBottomExpanded, setIsBottomExpanded] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // 초기 선택된 장비들을 PlanItem으로 변환
  React.useEffect(() => {
    // selectedItems가 있으면 계층 구조 유지 (깊은 복사), 없으면 flat IDs에서 변환
    if (selectedItems && selectedItems.length > 0) {
      // 깊은 복사 + gear hydrate (DB에서 로드된 items에는 gear가 없을 수 있음)
      const hydrateGear = (items: PlanItem[]): PlanItem[] =>
        items.map(item => {
          const gear = item.gear || gears.find(g => g.id === item.gearId);
          if (!gear) return null;
          return {
            ...item,
            gear,
            children: item.children ? hydrateGear(item.children) : undefined,
          };
        }).filter((i): i is PlanItem => i !== null);
      setPlanItems(hydrateGear(deepClonePlanItems(selectedItems)));
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
      (gear.tags || []).forEach(tag => tagSet.add(tag));
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
        selectedTags.some(tag => (g.tags || []).includes(tag)),
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

  // 템플릿에서 장비 불러오기
  const loadFromTemplate = (template: GearTemplate) => {
    // 계층 구조가 있으면 그대로 사용, 없으면 flat으로 변환
    if (template.items && template.items.length > 0) {
      const hydrateItems = (items: PlanItem[]): PlanItem[] =>
        items.map(item => {
          const gear = gears.find(g => g.id === item.gearId);
          if (!gear) return null;
          return {
            ...item,
            id: `${Date.now()}_${item.gearId}_${Math.random().toString(36).substr(2, 9)}`,
            gear,
            isChecked: false,
            children: item.children ? hydrateItems(item.children) : undefined,
          };
        }).filter((i): i is PlanItem => i !== null);
      setPlanItems(prev => [...prev, ...hydrateItems(template.items!)]);
    } else {
      const newItems: PlanItem[] = [];
      template.gearIds.forEach(gearId => {
        const gear = gears.find(g => g.id === gearId);
        if (gear) {
          newItems.push({
            id: `${Date.now()}_${gear.id}_${Math.random().toString(36).substr(2, 9)}`,
            gearId: gear.id,
            gear: gear,
            isChecked: false,
            quantity: 1,
          });
        }
      });
      setPlanItems(prev => [...prev, ...newItems]);
    }
    setShowTemplateModal(false);
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
                const { children: _, ...rest } = item;
                return rest;
              }
              return { ...item, children: filtered };
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
              return { ...item, children: addToTarget(item.children) };
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
                const { children: _, ...rest } = item;
                return rest;
              }
              return { ...item, children: filtered };
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
                const { children: _, ...rest } = item;
                return rest;
              }
              return { ...item, children: filtered };
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
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.container}>
        {/* Top Drop Zone */}
        <Surface style={[styles.dropZoneContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.primary }]} elevation={2}>
          <View style={[styles.dropZoneHeader, { backgroundColor: theme.colors.primaryContainer, borderBottomColor: theme.colors.primary }]}>
            <IconButton icon="arrow-left" size={24} onPress={onCancel} iconColor={theme.colors.onPrimaryContainer} />
            <View style={styles.headerCenter}>
              <Text variant="titleMedium" style={[styles.dropZoneTitle, { color: theme.colors.onPrimaryContainer }]}>
                {t('gearSelect.packingList')}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                {t('gearSelect.itemsWeight', { count: planItems.length, weight: Math.round(totalSelectedWeight) })}
              </Text>
            </View>
            {templates && templates.length > 0 && (
              <IconButton
                icon="file-document-outline"
                size={22}
                onPress={() => setShowTemplateModal(true)}
                iconColor={theme.colors.onPrimaryContainer}
              />
            )}
            <Button
              mode="contained"
              onPress={handleSave}
              buttonColor={theme.colors.primary}
              compact
              style={styles.saveBtn}>
              {t('common.save')}
            </Button>
          </View>

          <ScrollView
            style={styles.dropZoneScroll}
            contentContainerStyle={movingId ? { paddingBottom: 140 } : undefined}>
            {planItems.length === 0 ? (
              <View style={styles.emptyDropZone}>
                <Icon name="package-variant" size={48} color={theme.colors.outlineVariant} />
                <Text variant="titleSmall" style={[styles.emptyTitle, { color: theme.colors.primary }]}>
                  {t('gearSelect.addGearBelow')}
                </Text>
                <Text variant="bodySmall" style={[styles.emptySubtext, { color: theme.colors.secondary }]}>
                  {t('gearSelect.selectOrDrag')}
                </Text>
                {templates && templates.length > 0 && (
                  <Button
                    mode="contained-tonal"
                    icon="file-document-outline"
                    onPress={() => setShowTemplateModal(true)}
                    style={{marginTop: 16, borderRadius: 12}}
                    contentStyle={{height: 56}}>
                    {t('gearSelect.loadTemplate')}
                  </Button>
                )}
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

          {/* Moving Mode UI */}
          {movingId && movingItem && (
            <View style={styles.moveModeUI}>
              <Surface style={[styles.moveInfo, { backgroundColor: theme.colors.inverseSurface }]} elevation={5}>
                <Icon name="arrow-all" size={24} color={theme.colors.inverseOnSurface} />
                <Text variant="bodyMedium" style={{ color: theme.colors.inverseOnSurface, marginLeft: 8 }}>
                  {t('gearSelect.moving', { name: movingItem.gear.name })}
                </Text>
              </Surface>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.rootBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    moveItemToRoot(movingId);
                    setMovingId(null);
                  }}>
                  <Icon name="arrow-up" size={20} color={theme.colors.onPrimary} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onPrimary, marginTop: 4 }}>
                    {t('gearSelect.toRoot')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: theme.colors.secondary }]}
                  onPress={() => setMovingId(null)}>
                  <Icon name="close" size={20} color={theme.colors.onSecondary} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSecondary, marginTop: 4 }}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: theme.colors.error }]}
                  onPress={() => {
                    removePlanItem(movingId);
                    setMovingId(null);
                  }}>
                  <Icon name="delete" size={20} color={theme.colors.onError} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onError, marginTop: 4 }}>
                    {t('common.remove')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Surface>

        {/* Bottom Toggle */}
        <TouchableOpacity
          style={[styles.bottomToggle, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}
          onPress={() => setIsBottomExpanded(!isBottomExpanded)}>
          <Icon
            name={isBottomExpanded ? 'chevron-down' : 'chevron-up'}
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 8 }}>
            {isBottomExpanded ? t('gearSelect.collapseGearList') : t('gearSelect.expandGearList')}
          </Text>
          <View style={styles.badgeContainer}>
            <Surface style={[styles.countBadge, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer }}>
                {filteredGears.length}
              </Text>
            </Surface>
          </View>
        </TouchableOpacity>

        {/* Bottom: Filter + Gear List */}
        {isBottomExpanded && (
          <View style={[styles.sourceContainer, { backgroundColor: theme.colors.background }]}>
            <View style={styles.filterSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}>
                <Chip
                  onPress={() => setSelectedCategory(null)}
                  style={[
                    styles.filterChip,
                    !selectedCategory ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface },
                  ]}
                  textStyle={{
                    color: !selectedCategory ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant
                  }}
                  showSelectedOverlay={true}
                  selected={!selectedCategory}>
                  {t('common.all')}
                </Chip>
                {gearCategories.map(category => (
                  <Chip
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                      styles.filterChip,
                      selectedCategory === category ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface },
                    ]}
                    textStyle={{
                      color: selectedCategory === category ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant
                    }}
                    showSelectedOverlay={true}
                    selected={selectedCategory === category}>
                    {t(`gearCategory.${category}`)}
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
                      selectedTags.length === 0 ? { backgroundColor: theme.colors.secondaryContainer } : { backgroundColor: theme.colors.surface },
                    ]}
                    textStyle={{
                      color: selectedTags.length === 0 ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant
                    }}
                    showSelectedOverlay={true}
                    selected={selectedTags.length === 0}>
                    {t('common.allTags')}
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
                        selectedTags.includes(tag) ? { backgroundColor: theme.colors.secondaryContainer } : { backgroundColor: theme.colors.surface },
                      ]}
                      textStyle={{
                        color: selectedTags.includes(tag) ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant
                      }}
                      showSelectedOverlay={true}
                      selected={selectedTags.includes(tag)}>
                      #{tag}
                    </Chip>
                  ))}
                </ScrollView>
              )}
            </View>

            <ScrollView style={styles.gearList}>
              <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                {t('gearSelect.availableGear', { count: filteredGears.length })}
              </Text>

              {filteredGears.map(gear => {
                const usedQuantity = calculateGearQuantity(planItems, gear.id);
                const maxQuantity = getGearMaxQuantity(gear);
                const remaining = maxQuantity - usedQuantity;

                return (
                  <Surface key={gear.id} style={[styles.gearCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <View style={styles.gearCardContent}>
                      <View style={styles.gearInfo}>
                        <Text variant="bodyMedium" style={[styles.gearName, { color: theme.colors.onSurface }]}>
                          {gear.name}
                        </Text>
                        <Text variant="bodySmall" style={[styles.gearMeta, { color: theme.colors.onSurfaceVariant }]}>
                          {formatNumber(gear.weight)}g · {t(`gearCategory.${gear.category}`)}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                          {t('gearSelect.used', { used: usedQuantity, max: maxQuantity, remaining: remaining })}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => addGearToRoot(gear)}>
                        <Icon name="plus-circle" size={32} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </Surface>
                );
              })}

              {filteredGears.length === 0 && (
                <View style={styles.noGearsMessage}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                    {t('gearSelect.noGearFound')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>

      {/* Template Selection Modal */}
      <Modal
        visible={showTemplateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemplateModal(false)}>
        <View style={styles.modalOverlay}>
          <Surface style={[styles.modalContent, { backgroundColor: theme.colors.surface }]} elevation={5}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                {t('gearSelect.selectTemplate')}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowTemplateModal(false)}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>
            <ScrollView style={styles.modalScroll}>
              {templates && templates.length > 0 ? (
                templates.map(template => {
                  const templateGears = template.gearIds
                    .map(id => gears.find(g => g.id === id))
                    .filter((g): g is Gear => g !== undefined);
                  const totalWeight = templateGears.reduce((sum, g) => sum + g.weight, 0);
                  return (
                    <TouchableOpacity
                      key={template.id}
                      style={[styles.templateItem, { borderBottomColor: theme.colors.outlineVariant }]}
                      onPress={() => loadFromTemplate(template)}>
                      <View style={styles.templateInfo}>
                        <Text variant="bodyLarge" style={[styles.templateName, { color: theme.colors.onSurface }]}>
                          {template.name}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {templateGears.length} {t('plan.gearCount')} · {formatNumber(Math.round(totalWeight))}g
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.noTemplates}>
                  <Icon name="file-document-outline" size={48} color={theme.colors.outlineVariant} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
                    {t('gearSelect.noTemplates')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </Surface>
        </View>
      </Modal>
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
    const theme = useTheme();
    const isExpanded = expandedIds.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isContainer = item.gear.container;
    const isMoving = movingId === item.id;
    const isDropTarget = movingId && isContainer && movingId !== item.id;

    // 직계 자식 수 계산 (하위의 하위는 제외)
    const directChildCount = item.children?.length || 0;

    return (
      <View style={{ marginLeft: depth * 24 }}>
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
                  <View style={{ width: 22 }} />
                )}

                <View style={styles.planItemIcon}>
                  <Icon name={getCategoryIcon(item.gear.category)} size={20} color={theme.colors.primary} />
                </View>

                <View style={styles.planItemInfo}>
                  <Text variant="bodyMedium" style={styles.planItemName}>
                    {item.gear.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.planItemMeta}>
                    {formatNumber(item.gear.weight)}g × {item.quantity} ={' '}
                    {formatNumber(Math.round(item.gear.weight * item.quantity))}g
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
                  {t('gearSelect.putHere')}
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
  },
  dropZoneContainer: {
    flex: 1,
    borderBottomWidth: 1,
  },
  dropZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dropZoneTitle: {
    fontWeight: '700',
  },
  saveBtn: {
    minWidth: 60,
    borderRadius: 8,
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
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 4,
    textAlign: 'center',
  },
  planItemsContainer: {
    flex: 1,
  },
  planItemCard: {
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
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
    borderWidth: 2,
  },
  planItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planItemInfo: {
    flex: 1,
  },
  planItemName: {
    fontWeight: '500',
  },
  planItemMeta: {
    marginTop: 2,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  containerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  childCountText: {
    fontWeight: '700',
    fontSize: 12,
  },
  dropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  dropButtonText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  childrenContainer: {
    borderLeftWidth: 1,
    marginLeft: 10,
    paddingLeft: 10,
  },
  moveModeUI: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    alignItems: 'center',
  },
  moveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rootBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  deleteBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionBtnText: {
    marginTop: 4,
    fontWeight: '600',
  },
  bottomToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sourceContainer: {
    height: 300,
  },
  filterSection: {
    paddingVertical: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tagFilterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    height: 32,
  },
  tagFilterChip: {
    height: 32,
    marginBottom: 4,
  },
  gearList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  gearCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gearCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  gearInfo: {
    flex: 1,
  },
  gearName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  gearMeta: {
    marginBottom: 2,
  },
  quantityText: {
    marginTop: 2,
  },
  addBtn: {
    padding: 4,
  },
  noGearsMessage: {
    padding: 32,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalTitle: {
    fontWeight: '700',
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  noTemplates: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});

export default GearSelectScreen;
