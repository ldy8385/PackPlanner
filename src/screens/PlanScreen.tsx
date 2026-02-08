import React, {useState, useEffect} from 'react';
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
import {Card, Text, Button, ProgressBar, Surface} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Plan, Gear, PlanItem, PlanType} from '../types';
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
            <View style={[styles.itemRow, {paddingLeft: depth * 24}]}>
              {/* 확장/접힘 버튼 (컨테이너이고 자식이 있을 때만) */}
              {isContainer && hasChildren ? (
                <TouchableOpacity
                  onPress={() => toggleExpand(item.id)}
                  style={styles.expandButton}>
                  <Icon
                    name={isExpanded ? 'chevron-down' : 'chevron-right'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.expandButtonPlaceholder} />
              )}

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => onToggleCheck(planId, item.id)}
                activeOpacity={0.6}>
                <Icon
                  name={
                    item.isChecked
                      ? 'check-circle'
                      : 'checkbox-blank-circle-outline'
                  }
                  size={32}
                  color={item.isChecked ? '#2E7D32' : '#CAC4D0'}
                />
              </TouchableOpacity>
              <View style={styles.itemInfo}>
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.itemName,
                    item.isChecked && styles.itemNameChecked,
                  ]}>
                  {item.gear.name}
                </Text>
                <Text variant="bodySmall" style={styles.itemCategory}>
                  {item.gear.category} · {item.gear.weight}kg
                  {hasChildren ? ` · ${item.children?.length}개 포함` : ''}
                </Text>
              </View>
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
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showGearSelect, setShowGearSelect] = useState(false);

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
    Alert.alert('삭제 확인', `"${plan.name}" 계획을 삭제하시겠습니까?`, [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
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
              return {...item, isChecked: !item.isChecked};
            }
            if (item.children) {
              return {...item, children: toggleInTree(item.children)};
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

  const removeItemFromPlan = (planId: string, itemId: string) => {
    const updatedPlans = plans.map(plan => {
      if (plan.id === planId) {
        // 재귀적으로 모든 레벨의 아이템에서 제거
        const removeFromTree = (items: PlanItem[]): PlanItem[] => {
          return items
            .map(item => {
              if (item.id === itemId) {
                // 자식들을 승격시키거나 삭제
                return null;
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
            .filter((i): i is PlanItem => i !== null);
        };

        return {
          ...plan,
          items: removeFromTree(plan.items),
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
    const iconMap: {[key: string]: string} = {
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

  const renderPlanItem = ({item}: {item: Plan}) => {
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
                준비
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="titleMedium" style={styles.statValue}>
                {totalWeight.toFixed(1)}kg
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                무게
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="titleMedium" style={styles.statValue}>
                {item.items.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                장비
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
      <SafeAreaView style={styles.container}>
        <Surface style={styles.detailHeader} elevation={1}>
          <Button
            mode="text"
            onPress={() => setSelectedPlan(null)}
            icon="arrow-left"
            textColor="#2E7D32">
            뒤로
          </Button>
          <Text
            variant="titleMedium"
            style={styles.detailTitle}
            numberOfLines={1}>
            {selectedPlan.name}
          </Text>
          <Button
            mode="text"
            onPress={() => handleEditPress(selectedPlan)}
            textColor="#2E7D32">
            수정
          </Button>
        </Surface>

        <ScrollView
          style={styles.detailContent}
          showsVerticalScrollIndicator={false}>
          <Card style={styles.detailInfoCard} mode="elevated">
            <Card.Content>
              <Surface style={styles.detailTypeBadge} elevation={0}>
                <Icon
                  name={getPlanTypeIcon(selectedPlan.type)}
                  size={16}
                  color="#2E7D32"
                  style={styles.detailTypeIcon}
                />
                <Text variant="labelMedium" style={styles.detailTypeText}>
                  {selectedPlan.type}
                </Text>
              </Surface>
              <View style={styles.detailInfoRow}>
                <Icon name="map-marker" size={18} color="#49454F" />
                <Text variant="bodyLarge" style={styles.detailInfoText}>
                  {selectedPlan.destination}
                </Text>
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

              <View style={styles.detailInfoRow}>
                <Icon name="calendar" size={18} color="#49454F" />
                <Text variant="bodyLarge" style={styles.detailInfoText}>
                  {formatDateRange(
                    selectedPlan.startDate,
                    selectedPlan.endDate,
                  )}
                </Text>
              </View>
              <View style={styles.detailInfoRow}>
                <Icon name="weight-kilogram" size={18} color="#49454F" />
                <Text variant="bodyLarge" style={styles.detailInfoText}>
                  총 무게: {totalWeight.toFixed(1)}kg
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.itemsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.itemsSectionTitle}>
                장비 목록
              </Text>
              {selectedPlan.items.length === 0 ? (
                <Surface style={styles.emptyItems} elevation={0}>
                  <Icon
                    name="clipboard-text-outline"
                    size={48}
                    color="#79747E"
                  />
                  <Text variant="bodyLarge" style={styles.emptyItemsText}>
                    아직 장비가 없습니다.
                  </Text>
                  <Text variant="bodySmall" style={styles.emptyItemsSubtext}>
                    아래에서 장비를 추가하세요.
                  </Text>
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
            mode="contained"
            icon="plus"
            onPress={() => setShowGearSelect(true)}
            style={styles.addGearButton}
            buttonColor="#2E7D32">
            장비 변경
          </Button>
        </ScrollView>

        <Button
          mode="outlined"
          textColor="#B3261E"
          style={styles.deletePlanButton}
          onPress={() => deletePlan(selectedPlan)}>
          계획 삭제
        </Button>
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
    <SafeAreaView style={styles.container}>
      <Surface style={styles.header} elevation={1}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          캠핑 계획
        </Text>
      </Surface>

      <FlatList
        data={plans}
        keyExtractor={item => item.id}
        renderItem={renderPlanItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Surface style={styles.emptyState} elevation={1}>
            <Icon name="clipboard-text-outline" size={64} color="#79747E" />
            <Text variant="titleMedium" style={styles.emptyStateText}>
              계획이 없습니다.
            </Text>
            <Text variant="bodyMedium" style={styles.emptyStateSubtext}>
              새 캠핑 계획을 만들어보세요.
            </Text>
          </Surface>
        }
      />

      {/* FAB - 새 계획 추가 */}
      {onCreateNewPlan && (
        <TouchableOpacity
          style={styles.fab}
          onPress={onCreateNewPlan}
          activeOpacity={0.7}>
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FEF7FF',
  },
  headerTitle: {
    fontWeight: '600',
    color: '#1C1B1F',
  },
  listContainer: {
    padding: 16,
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  planTypeIcon: {
    marginRight: 0,
  },
  planTypeText: {
    color: '#1B5E20',
    fontWeight: '600',
  },
  ddayBadge: {
    backgroundColor: '#F9DEDC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ddayText: {
    color: '#B3261E',
    fontWeight: '600',
  },
  planName: {
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 8,
  },
  planDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  destinationText: {
    color: '#49454F',
  },
  planDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  planDate: {
    color: '#79747E',
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '600',
    color: '#1C1B1F',
  },
  statLabel: {
    color: '#49454F',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E7E0EC',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    margin: 16,
  },
  emptyStateText: {
    fontWeight: '500',
    color: '#1C1B1F',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#49454F',
    textAlign: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FEF7FF',
  },
  detailTitle: {
    fontWeight: '600',
    color: '#1C1B1F',
    flex: 1,
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailInfoCard: {
    margin: 16,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  detailTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  detailTypeIcon: {
    marginRight: 0,
  },
  detailTypeText: {
    color: '#1B5E20',
    fontWeight: '600',
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  detailInfoText: {
    color: '#1C1B1F',
  },
  itemsSection: {
    margin: 16,
    marginTop: 0,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  itemsSectionTitle: {
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#1C1B1F',
    marginBottom: 2,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#79747E',
  },
  itemCategory: {
    color: '#49454F',
  },
  checkboxContainer: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  expandButton: {
    padding: 4,
    marginRight: 4,
  },
  expandButtonPlaceholder: {
    width: 32,
    marginRight: 4,
  },
  emptyItems: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  emptyItemsText: {
    color: '#49454F',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyItemsSubtext: {
    color: '#79747E',
  },
  addGearButton: {
    margin: 16,
    marginTop: 0,
    paddingVertical: 8,
    borderRadius: 20,
  },
  deletePlanButton: {
    margin: 16,
    borderRadius: 20,
    borderColor: '#B3261E',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  mapContainer: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});

export default PlanScreen;
