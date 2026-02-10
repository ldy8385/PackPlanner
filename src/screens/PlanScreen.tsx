import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
  ScrollView,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import { Card, Text, Button, ProgressBar, Surface, useTheme, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Plan, Gear, PlanItem, PlanType } from '../types';
import GearSelectScreen from './GearSelectScreen';
import KakaoMap from '../components/KakaoMap';

interface PlanScreenProps {
  plans: Plan[];
  gears: Gear[];
  onUpdatePlans: (plans: Plan[]) => void;
  initialPlanId?: string | null;
  onEditPlan?: (plan: Plan) => void;
  onCreateNewPlan?: () => void;
}

// 계층적 PlanItem 렌더링 컴포넌트
interface PlanItemListProps {
  items: PlanItem[];
  planId: string;
  onToggleCheck: (planId: string, itemId: string) => void;
  depth?: number;
}

const PlanItemList: React.FC<PlanItemListProps> = ({
  items,
  planId,
  onToggleCheck,
  depth = 0,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // 초기에 자식이 있는 모든 아이템을 펼친 상태로 설정
  const getInitialExpandedIds = (itemList: PlanItem[]): Set<string> => {
    const ids = new Set<string>();
    const traverse = (list: PlanItem[]) => {
      list.forEach(item => {
        if (item.children && item.children.length > 0) {
          ids.add(item.id);
          traverse(item.children);
        }
      });
    };
    traverse(itemList);
    return ids;
  };

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    getInitialExpandedIds(items),
  );

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

  return (
    <>
      {items.map(item => {
        const isExpanded = expandedIds.has(item.id);
        const hasChildren = item.children && item.children.length > 0;
        const isContainer = item.gear.container;

        return (
          <View key={item.id}>
            <View
              style={[
                styles.itemRow,
                {
                  paddingLeft: depth * 16, // Reduced indentation step
                  backgroundColor: depth > 0 ? theme.colors.background : 'transparent', // Subtle distinction
                  paddingVertical: 8,
                }
              ]}>
              {/* Depth Indicator Line */}
              {depth > 0 && <View style={[styles.depthLine, { left: (depth * 16) - 10, backgroundColor: theme.colors.outlineVariant }]} />}

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => onToggleCheck(planId, item.id)}
                activeOpacity={0.6}>
                <Icon
                  name={
                    item.isChecked
                      ? 'checkbox-marked-circle'
                      : 'checkbox-blank-circle-outline'
                  }
                  size={24}
                  color={item.isChecked ? theme.colors.secondary : theme.colors.outline}
                />
              </TouchableOpacity>

              <View style={styles.itemInfo}>
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.itemName,
                    item.isChecked && { color: theme.colors.outline, textDecorationLine: 'line-through' },
                    !item.isChecked && { color: theme.colors.onSurface }
                  ]}>
                  {item.gear.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                  {item.gear.category} · {item.gear.weight}kg
                  {hasChildren ? ` · ${item.children?.length} ${t('plan.gearCount')}` : ''}
                </Text>
              </View>

              {/* 확장/접힘 버튼 */}
              {isContainer && hasChildren && (
                <TouchableOpacity
                  onPress={() => toggleExpand(item.id)}
                  style={styles.expandButton}>
                  <Icon
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* 자식 아이템 렌더링 */}
            {isExpanded && hasChildren && (
              <PlanItemList
                items={item.children!}
                planId={planId}
                onToggleCheck={onToggleCheck}
                depth={depth + 1}
              />
            )}
            {/* Divider for top level items */}
            {depth === 0 && <View style={[styles.itemDivider, { backgroundColor: theme.colors.surfaceVariant }]} />}
          </View>
        );
      })}
    </>
  );
};

const PlanScreen: React.FC<PlanScreenProps> = ({
  plans,
  gears,
  onUpdatePlans,
  initialPlanId,
  onEditPlan,
  onCreateNewPlan,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showGearSelect, setShowGearSelect] = useState(false);
  const [showPastPlans, setShowPastPlans] = useState(false);

  // 계획 필터링: 지난 계획 표시 여부에 따라
  const filteredPlans = useMemo(() => {
    if (showPastPlans) {
      return plans;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return plans.filter(plan => {
      const planEnd = new Date(plan.endDate);
      planEnd.setHours(0, 0, 0, 0);
      return planEnd >= today;
    });
  }, [plans, showPastPlans]);

  useEffect(() => {
    if (initialPlanId) {
      const plan = plans.find(p => p.id === initialPlanId);
      if (plan) {
        setSelectedPlan(plan);
      }
    } else if (initialPlanId === null) {
      setSelectedPlan(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlanId]);

  useEffect(() => {
    const backAction = () => {
      if (showGearSelect) {
        setShowGearSelect(false);
        return true;
      } else if (selectedPlan) {
        setSelectedPlan(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [selectedPlan, showGearSelect]);

  const deletePlan = (plan: Plan) => {
    Alert.alert(t('plan.deleteConfirmTitle'), t('plan.deleteConfirmMessage', { name: plan.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          onUpdatePlans(plans.filter(p => p.id !== plan.id));
          if (selectedPlan?.id === plan.id) {
            setSelectedPlan(null);
          }
        },
      },
    ]);
  };

  const toggleItemCheck = (planId: string, itemId: string) => {
    const updatedPlans = plans.map(plan => {
      if (plan.id === planId) {
        // 재귀적으로 모든 레벨의 아이템에서 체크 상태 토글
        const toggleInTree = (items: PlanItem[]): PlanItem[] => {
          return items.map(item => {
            if (item.id === itemId) {
              return { ...item, isChecked: !item.isChecked };
            }
            if (item.children) {
              return { ...item, children: toggleInTree(item.children) };
            }
            return item;
          });
        };

        return {
          ...plan,
          items: toggleInTree(plan.items),
        };
      }
      return plan;
    });
    onUpdatePlans(updatedPlans);

    if (selectedPlan && selectedPlan.id === planId) {
      const updatedPlan = updatedPlans.find(p => p.id === planId);
      if (updatedPlan) {
        setSelectedPlan(updatedPlan);
      }
    }
  };

  // 삭제 기능은 체크박스로 대첵되었으므로 현재 미사용
  // const removeItemFromPlan = (planId: string, itemId: string) => {
  //   const updatedPlans = plans.map(plan => {
  //     if (plan.id === planId) {
  //       const removeFromTree = (items: PlanItem[]): PlanItem[] => {
  //         return items
  //           .map(item => {
  //             if (item.id === itemId) {
  //               return null;
  //             }
  //             if (item.children) {
  //               const updatedChildren = removeFromTree(item.children);
  //               const filtered = updatedChildren.filter(
  //                 (i): i is PlanItem => i !== null,
  //               );
  //               if (filtered.length === 0) {
  //                 // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //                 const {children: _, ...rest} = item;
  //                 return rest;
  //               }
  //               return {...item, children: filtered};
  //             }
  //             return item;
  //           })
  //           .filter((i): i is PlanItem => i !== null);
  //       };
  //
  //       return {
  //         ...plan,
  //         items: removeFromTree(plan.items),
  //       };
  //     }
  //     return plan;
  //   });
  //   onUpdatePlans(updatedPlans);
  //
  //   if (selectedPlan && selectedPlan.id === planId) {
  //     const updatedPlan = updatedPlans.find(p => p.id === planId);
  //     if (updatedPlan) {
  //       setSelectedPlan(updatedPlan);
  //     }
  //   }
  // };

  // gear를 PlanItem으로 변환 (flat 구조로 - 계층은 사용자가 나중에 설정)
  const convertGearToPlanItem = (gear: Gear): PlanItem => {
    return {
      id: `${Date.now()}_${gear.id}_${Math.random().toString(36).substr(2, 9)}`,
      gearId: gear.id,
      gear: gear,
      isChecked: false,
      quantity: 1,
    };
  };

  const handleAddGears = (
    selectedGearIds: string[],
    updatedItems?: PlanItem[],
  ) => {
    if (!selectedPlan) return;

    // updatedItems가 있으면 계층 구조를 유지한 채 사용
    if (updatedItems && updatedItems.length > 0) {
      const updatedPlans = plans.map(plan => {
        if (plan.id === selectedPlan.id) {
          return {
            ...plan,
            items: updatedItems,
          };
        }
        return plan;
      });
      onUpdatePlans(updatedPlans);

      const updatedPlan = updatedPlans.find(p => p.id === selectedPlan.id);
      if (updatedPlan) {
        setSelectedPlan(updatedPlan);
      }

      setShowGearSelect(false);
      return;
    }

    // Fallback: 기존 로직 (계층 구조 없이 IDs만 받은 경우)
    const selectedGears = gears.filter(g => selectedGearIds.includes(g.id));
    const existingItemIds = new Set(
      selectedPlan.items.map(item => item.gearId),
    );
    const newGears = selectedGears.filter(g => !existingItemIds.has(g.id));

    const updatedPlans = plans.map(plan => {
      if (plan.id === selectedPlan.id) {
        const newItems = newGears.map(gear => convertGearToPlanItem(gear));
        return {
          ...plan,
          items: [...plan.items, ...newItems],
        };
      }
      return plan;
    });
    onUpdatePlans(updatedPlans);

    const updatedPlan = updatedPlans.find(p => p.id === selectedPlan.id);
    if (updatedPlan) {
      setSelectedPlan(updatedPlan);
    }

    setShowGearSelect(false);
  };

  const getPlanTypeIcon = (type: PlanType): string => {
    const iconMap: { [key: string]: string } = {
      [PlanType.AUTO_CAMPING]: 'car',
      [PlanType.MOTO_CAMPING]: 'motorbike',
      [PlanType.BACKPACKING]: 'bag-personal',
    };
    return iconMap[type] || 'tent';
  };

  const formatDateRange = (start: Date, end: Date): string => {
    const startStr = start.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
    const endStr = end.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
    return `${startStr} ~ ${endStr}`;
  };

  const getDday = (startDate: Date): string => {
    const now = new Date();
    const diff = Math.ceil(
      (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff === 0) return 'D-Day';
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  const handleEditPress = (plan: Plan) => {
    if (onEditPlan) {
      onEditPlan(plan);
    }
  };

  const renderPlanItem = ({ item }: { item: Plan }) => {
    const checkedCount = item.items.filter(i => i.isChecked).length;
    const progress =
      item.items.length > 0 ? checkedCount / item.items.length : 0;
    const totalWeight = item.items.reduce(
      (sum, i) => sum + i.gear.weight * i.quantity,
      0,
    );

    return (
      <Card
        style={styles.planCard}
        onPress={() => setSelectedPlan(item)}
        mode="elevated">
        <Card.Content>
          <View style={styles.planHeader}>
            <Surface style={styles.planTypeBadge} elevation={0}>
              <Icon
                name={getPlanTypeIcon(item.type)}
                size={16}
                color="#2E7D32"
                style={styles.planTypeIcon}
              />
              <Text variant="labelMedium" style={styles.planTypeText}>
                {item.type}
              </Text>
            </Surface>
            <Surface style={styles.ddayBadge} elevation={0}>
              <Text variant="labelLarge" style={styles.ddayText}>
                {getDday(item.startDate)}
              </Text>
            </Surface>
          </View>

          <Text variant="titleLarge" style={styles.planName}>
            {item.name}
          </Text>
          <View style={styles.planDestination}>
            <Icon name="map-marker" size={16} color="#49454F" />
            <Text variant="bodyMedium" style={styles.destinationText}>
              {item.destination}
            </Text>
          </View>
          <View style={styles.planDateRow}>
            <Icon name="calendar" size={14} color="#79747E" />
            <Text variant="bodySmall" style={styles.planDate}>
              {formatDateRange(item.startDate, item.endDate)}
            </Text>
          </View>

          <View style={styles.planStats}>
            <View style={styles.statItem}>
              <Text variant="titleMedium" style={styles.statValue}>
                {checkedCount}/{item.items.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                {t('plan.ready')}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="titleMedium" style={styles.statValue}>
                {totalWeight.toFixed(1)}kg
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                {t('plan.weight')}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="titleMedium" style={styles.statValue}>
                {item.items.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                {t('plan.gearCount')}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              color="#2E7D32"
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderDetailView = () => {
    if (!selectedPlan) return null;

    const totalWeight = selectedPlan.items.reduce(
      (sum, i) => sum + i.gear.weight * i.quantity,
      0,
    );

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Surface style={[styles.detailHeader, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.detailHeaderTop}>
            <IconButton
              icon="arrow-left"
              iconColor={theme.colors.onSurface}
              onPress={() => setSelectedPlan(null)}
            />
            <Text
              variant="titleLarge"
              style={[styles.detailTitle, { color: theme.colors.onSurface }]}
              numberOfLines={1}>
              {selectedPlan.name}
            </Text>
            <Button
              mode="text"
              onPress={() => handleEditPress(selectedPlan)}
              textColor={theme.colors.primary}>
              {t('common.edit')}
            </Button>
          </View>
        </Surface>

        <ScrollView
          style={styles.detailContent}
          showsVerticalScrollIndicator={false}>

          {/* Main Info Card */}
          <Card style={[styles.detailInfoCard, { backgroundColor: theme.colors.surface }]} mode="contained">
            <Card.Content>
              <View style={styles.detailInfoGrid}>
                <View style={styles.detailInfoRow}>
                  <Icon name={getPlanTypeIcon(selectedPlan.type)} size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    {selectedPlan.type}
                  </Text>
                </View>
                <View style={styles.detailInfoRow}>
                  <Icon name="map-marker-outline" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    {selectedPlan.destination}
                  </Text>
                </View>
                <View style={styles.detailInfoRow}>
                  <Icon name="calendar-range-outline" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    {formatDateRange(selectedPlan.startDate, selectedPlan.endDate)}
                  </Text>
                </View>
                <View style={styles.detailInfoRow}>
                  <Icon name="weight-kilogram" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    {t('plan.total')}: {totalWeight.toFixed(1)}kg
                  </Text>
                </View>
              </View>

              {/* 지도 표시 - 위치 정보가 있을 때만 */}
              {selectedPlan.location && (
                <View style={styles.mapContainer}>
                  <KakaoMap
                    latitude={selectedPlan.location.latitude}
                    longitude={selectedPlan.location.longitude}
                    height={180}
                  />
                </View>
              )}
            </Card.Content>
          </Card>

          <Card style={[styles.itemsSection, { backgroundColor: theme.colors.surface }]} mode="contained">
            <Card.Content>
              <View style={styles.itemsSectionHeader}>
                <Text variant="titleMedium" style={[styles.itemsSectionTitle, { color: theme.colors.onSurface }]}>
                  {t('plan.gearList')}
                </Text>
                <Button
                  mode="text"
                  icon="plus"
                  textColor={theme.colors.primary}
                  onPress={() => setShowGearSelect(true)}>
                  {t('plan.manageGears')}
                </Button>
              </View>

              {selectedPlan.items.length === 0 ? (
                <Surface style={styles.emptyItems} elevation={0}>
                  <Icon
                    name="bag-personal-outline"
                    size={48}
                    color={theme.colors.outline} // Using theme outline
                  />
                  <Text variant="bodyLarge" style={[styles.emptyItemsText, { color: theme.colors.onSurface }]}>
                    {t('plan.noGearsAdded')}
                  </Text>
                  <Button mode="contained-tonal" style={{ marginTop: 16 }} onPress={() => setShowGearSelect(true)}>
                    {t('plan.addGears')}
                  </Button>
                </Surface>
              ) : (
                <PlanItemList
                  items={selectedPlan.items}
                  planId={selectedPlan.id}
                  onToggleCheck={toggleItemCheck}
                />
              )}
            </Card.Content>
          </Card>

          <Button
            mode="outlined"
            textColor={theme.colors.error}
            style={[styles.deletePlanButton, { borderColor: theme.colors.errorContainer }]}
            onPress={() => deletePlan(selectedPlan)}>
            {t('plan.deletePlan')}
          </Button>
          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    );
  };

  if (showGearSelect && selectedPlan) {
    return (
      <GearSelectScreen
        gears={gears}
        selectedItems={selectedPlan.items}
        onSave={handleAddGears}
        onCancel={() => setShowGearSelect(false)}
      />
    );
  }

  if (selectedPlan) {
    return renderDetailView();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            {t('plan.title')}
          </Text>
          <TouchableOpacity
            style={styles.pastPlansToggle}
            onPress={() => setShowPastPlans(!showPastPlans)}
            activeOpacity={0.7}>
            <Icon
              name={
                showPastPlans ? 'checkbox-marked' : 'checkbox-blank-outline'
              }
              size={24}
              color={theme.colors.primary}
            />
            <Text variant="bodyMedium" style={[styles.pastPlansToggleText, { color: theme.colors.primary }]}>
              {t('plan.showPastPlans')}
            </Text>
          </TouchableOpacity>
        </View>
      </Surface>

      <FlatList
        data={filteredPlans}
        keyExtractor={item => item.id}
        renderItem={renderPlanItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="tent" size={64} color={theme.colors.outlineVariant} />
            <Text variant="titleMedium" style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>
              {showPastPlans ? t('plan.noPlansFound') : t('plan.noUpcomingPlans')}
            </Text>
            <Text variant="bodyMedium" style={[styles.emptyStateSubtext, { color: theme.colors.outline }]}>
              {t('plan.createPlanToStart')}
            </Text>
            {onCreateNewPlan && (
              <Button mode="contained" onPress={onCreateNewPlan} style={{ marginTop: 16 }}>
                {t('plan.createPlan')}
              </Button>
            )}
          </View>
        }
      />

      {/* FAB - 새 계획 추가 */}
      {onCreateNewPlan && filteredPlans.length > 0 && (
        <Surface style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]} elevation={4}>
          <TouchableOpacity
            style={styles.fabTouchable}
            onPress={onCreateNewPlan}
            activeOpacity={0.8}>
            <Icon name="plus" size={28} color={theme.colors.onPrimaryContainer} />
          </TouchableOpacity>
        </Surface>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  planCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeaderStrip: {
    height: 6,
    width: '100%',
  },
  cardContent: {
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planHeaderLeft: {
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  planTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  planTypeIcon: {
    marginRight: 0,
  },
  planTypeText: {
    fontWeight: '600',
  },
  ddayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ddayText: {
    fontWeight: '700',
  },
  planName: {
    fontWeight: '700',
    marginBottom: 8,
  },
  planMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#ccc',
    marginHorizontal: 8,
  },
  planDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  destinationText: {
    // color: '#49454F',
  },
  planDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  planDate: {
    // color: '#79747E',
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  planStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statItemCompact: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: '600',
    // color: '#1C1B1F',
  },
  statLabel: {
    // color: '#49454F',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
    // backgroundColor: '#E7E0EC',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  // Item List Styles
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 48,
  },
  depthLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  itemDivider: {
    height: 1,
    marginLeft: 56,
  },
  expandButton: {
    padding: 8,
  },
  expandButtonPlaceholder: {
    width: 40,
  },
  checkboxContainer: {
    padding: 8,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 4,
  },
  itemName: {
    fontWeight: '500',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  itemCategory: {
    marginTop: 2,
  },
  // Detail View Styles
  detailHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  detailContent: {
    flex: 1,
    padding: 20,
  },
  detailInfoCard: {
    marginBottom: 20,
    borderRadius: 16,
  },
  detailInfoGrid: {
    gap: 12,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemsSection: {
    marginBottom: 80,
    borderRadius: 16,
  },
  itemsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemsSectionTitle: {
    fontWeight: '700',
  },
  emptyItems: {
    alignItems: 'center',
    padding: 32,
    justifyContent: 'center',
  },
  emptyItemsText: {
    marginTop: 12,
    fontWeight: '600',
  },
  emptyItemsSubtext: {
    marginTop: 4,
  },
  addGearButton: {
    marginVertical: 16,
    borderRadius: 8,
  },
  deletePlanButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontWeight: '700',
  },
  emptyStateSubtext: {
    marginTop: 8,
    textAlign: 'center',
  },
  // FAB
  fab: {
    position: 'absolute',
    margin: 24,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabTouchable: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastPlansToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  pastPlansToggleText: {
    fontWeight: '500',
  },
  detailTypeBadge: {
    // Legacy support if needed
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTypeIcon: {},
  detailTypeText: {},
  detailInfoText: {},
  mapContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});

export default PlanScreen;
