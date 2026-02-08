import React, {useMemo} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  ProgressBar,
  Surface,
  IconButton,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Plan, Gear, PlanType} from '../types';

interface HomeScreenProps {
  plans: Plan[];
  gears: Gear[];
  onNavigateToPlans: () => void;
  onNavigateToGears: () => void;
  onCreateNewPlan: () => void;
  onNavigateToPlanDetail: (planId: string) => void;
  onNavigateToGearsWithTag?: (tag: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  plans,
  gears,
  onNavigateToPlans,
  onNavigateToGears,
  onCreateNewPlan,
  onNavigateToPlanDetail,
  onNavigateToGearsWithTag,
}) => {
  const activePlans = plans.filter(p => !p.isCompleted);

  const recentPlan = useMemo(() => {
    const now = new Date();
    const futurePlans = activePlans
      .filter(p => p.startDate >= now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return futurePlans[0] || activePlans[activePlans.length - 1];
  }, [activePlans]);

  const topTags = useMemo(() => {
    const tagCount: {[key: string]: number} = {};
    gears.forEach(gear => {
      gear.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [gears]);

  const stats = useMemo(() => {
    const totalWeight = gears.reduce((sum, g) => sum + g.weight, 0);
    const checkedItems = plans.reduce(
      (sum, p) => sum + p.items.filter(i => i.isChecked).length,
      0,
    );
    const totalItems = plans.reduce((sum, p) => sum + p.items.length, 0);
    return {totalWeight, checkedItems, totalItems};
  }, [gears, plans]);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* 헤더 영역 - Material Design 3 Hero Section */}
        <Surface style={styles.heroSection} elevation={0}>
          <View style={styles.heroContent}>
            <Text variant="displaySmall" style={styles.heroTitle}>
              PackPlanner
            </Text>
            <Text variant="bodyLarge" style={styles.heroSubtitle}>
              캠핑 준비를 더 스마트하게
            </Text>
          </View>

          {/* 통계 카드 */}
          <View style={styles.statsRow}>
            <Surface style={styles.statCard} elevation={1}>
              <MaterialCommunityIcons
                name="briefcase"
                size={24}
                color="#2E7D32"
              />
              <Text variant="titleLarge" style={styles.statValue}>
                {gears.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                장비
              </Text>
            </Surface>
            <Surface style={styles.statCard} elevation={1}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={24}
                color="#558B2F"
              />
              <Text variant="titleLarge" style={styles.statValue}>
                {plans.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                계획
              </Text>
            </Surface>
            <Surface style={styles.statCard} elevation={1}>
              <MaterialCommunityIcons
                name="weight-kilogram"
                size={24}
                color="#00695C"
              />
              <Text variant="titleLarge" style={styles.statValue}>
                {stats.totalWeight.toFixed(1)}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                kg
              </Text>
            </Surface>
          </View>
        </Surface>

        {/* 최근 계획 카드 */}
        {recentPlan && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                다가오는 캠핑
              </Text>
              <Button
                mode="text"
                onPress={onNavigateToPlans}
                textColor="#2E7D32"
                compact>
                전체 보기
              </Button>
            </View>
            <Card
              style={styles.featuredCard}
              onPress={() =>
                recentPlan && onNavigateToPlanDetail(recentPlan.id)
              }
              mode="elevated">
              <Card.Content style={styles.featuredCardContent}>
                <View style={styles.featuredHeader}>
                  <Surface style={styles.planTypeContainer} elevation={0}>
                    <MaterialCommunityIcons
                      name={getPlanTypeIcon(recentPlan.type)}
                      size={20}
                      color="#2E7D32"
                    />
                    <Text variant="labelLarge" style={styles.planTypeText}>
                      {recentPlan.type}
                    </Text>
                  </Surface>
                  <Surface style={styles.ddayContainer} elevation={0}>
                    <Text variant="labelLarge" style={styles.ddayText}>
                      {getDday(recentPlan.startDate)}
                    </Text>
                  </Surface>
                </View>

                <Text variant="headlineSmall" style={styles.featuredPlanName}>
                  {recentPlan.name}
                </Text>

                <View style={styles.featuredDetails}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={18}
                      color="#49454F"
                    />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      {recentPlan.destination}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={18}
                      color="#49454F"
                    />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      {formatDateRange(
                        recentPlan.startDate,
                        recentPlan.endDate,
                      )}
                    </Text>
                  </View>
                </View>

                {recentPlan.items.length > 0 && (
                  <View style={styles.progressContainer}>
                    <ProgressBar
                      progress={
                        recentPlan.items.filter(i => i.isChecked).length /
                        recentPlan.items.length
                      }
                      color="#2E7D32"
                      style={styles.progressBar}
                    />
                    <View style={styles.progressInfo}>
                      <Text variant="bodySmall" style={styles.progressText}>
                        준비 완료
                      </Text>
                      <Text variant="bodySmall" style={styles.progressCount}>
                        {recentPlan.items.filter(i => i.isChecked).length}/
                        {recentPlan.items.length}
                      </Text>
                    </View>
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        )}

        {/* 빠른 액션 */}
        <View style={styles.sectionContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            빠른 액션
          </Text>
          <View style={styles.quickActionsGrid}>
            <Surface style={styles.actionCard} elevation={1}>
              <IconButton
                icon="plus-circle"
                size={32}
                iconColor="#2E7D32"
                onPress={onCreateNewPlan}
                style={styles.actionIcon}
              />
              <Text variant="titleSmall" style={styles.actionTitle}>
                새 계획
              </Text>
              <Text variant="bodySmall" style={styles.actionSubtitle}>
                캠핑 계획 만들기
              </Text>
            </Surface>
            <Surface style={styles.actionCard} elevation={1}>
              <IconButton
                icon="briefcase"
                size={32}
                iconColor="#558B2F"
                onPress={onNavigateToGears}
                style={styles.actionIcon}
              />
              <Text variant="titleSmall" style={styles.actionTitle}>
                장비 관리
              </Text>
              <Text variant="bodySmall" style={styles.actionSubtitle}>
                장비 목록 보기
              </Text>
            </Surface>
          </View>
        </View>

        {/* 나의 계획 */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              나의 계획
            </Text>
            <Button
              mode="text"
              onPress={onNavigateToPlans}
              textColor="#2E7D32"
              compact>
              전체 보기
            </Button>
          </View>
          {activePlans.length === 0 ? (
            <Surface style={styles.emptyCard} elevation={1}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={48}
                color="#79747E"
              />
              <Text variant="bodyLarge" style={styles.emptyTitle}>
                계획이 없습니다
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                새로운 캠핑 계획을 만들어보세요
              </Text>
            </Surface>
          ) : (
            <View style={styles.plansList}>
              {activePlans.slice(0, 3).map((plan, index) => (
                <Card
                  key={plan.id}
                  style={[
                    styles.planCard,
                    index === activePlans.slice(0, 3).length - 1 &&
                      styles.planCardLast,
                  ]}
                  onPress={() => onNavigateToPlanDetail(plan.id)}
                  mode="elevated">
                  <Card.Content style={styles.planCardContent}>
                    <Surface style={styles.planIconContainer} elevation={0}>
                      <MaterialCommunityIcons
                        name={getPlanTypeIcon(plan.type)}
                        size={24}
                        color="#2E7D32"
                      />
                    </Surface>
                    <View style={styles.planInfo}>
                      <Text variant="titleMedium" style={styles.planName}>
                        {plan.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.planDestination}>
                        {plan.destination}
                      </Text>
                      <Text variant="bodySmall" style={styles.planDate}>
                        {formatDateRange(plan.startDate, plan.endDate)}
                      </Text>
                    </View>
                    <Surface style={styles.progressChip} elevation={0}>
                      <Text
                        variant="labelMedium"
                        style={styles.progressChipText}>
                        {plan.items.filter(i => i.isChecked).length}/
                        {plan.items.length}
                      </Text>
                    </Surface>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* 인기 태그 */}
        <View style={[styles.sectionContainer, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              인기 태그
            </Text>
            <Button
              mode="text"
              onPress={onNavigateToGears}
              textColor="#2E7D32"
              compact>
              전체 보기
            </Button>
          </View>
          {topTags.length === 0 ? (
            <Surface style={styles.emptyCard} elevation={1}>
              <MaterialCommunityIcons name="tag" size={32} color="#79747E" />
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                등록된 태그가 없습니다
              </Text>
            </Surface>
          ) : (
            <View style={styles.tagsGrid}>
              {topTags.map(([tag, count]) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => onNavigateToGearsWithTag?.(tag)}
                  activeOpacity={0.7}>
                  <Surface style={styles.tagCard} elevation={1}>
                    <MaterialCommunityIcons
                      name="tag"
                      size={20}
                      color="#2E7D32"
                    />
                    <Text variant="titleMedium" style={styles.tagName}>
                      #{tag}
                    </Text>
                    <Text variant="bodySmall" style={styles.tagCount}>
                      {count}개 장비
                    </Text>
                  </Surface>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#C8E6C9',
    padding: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  heroContent: {
    marginBottom: 24,
  },
  heroTitle: {
    color: '#1B5E20',
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#33691E',
    marginTop: 4,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#1C1B1F',
    fontWeight: '600',
    marginTop: 8,
  },
  statLabel: {
    color: '#49454F',
    marginTop: 2,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#1C1B1F',
    fontWeight: '600',
  },
  featuredCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  featuredCardContent: {
    padding: 20,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  planTypeText: {
    color: '#1B5E20',
    fontWeight: '500',
  },
  ddayContainer: {
    backgroundColor: '#F9DEDC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ddayText: {
    color: '#B3261E',
    fontWeight: '600',
  },
  featuredPlanName: {
    color: '#1C1B1F',
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  featuredDetails: {
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    color: '#49454F',
  },
  progressContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E7E0EC',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    color: '#49454F',
  },
  progressCount: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    margin: 0,
    marginBottom: 8,
  },
  actionTitle: {
    color: '#1C1B1F',
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    color: '#49454F',
  },
  plansList: {
    gap: 12,
  },
  planCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  planCardLast: {
    marginBottom: 0,
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    color: '#1C1B1F',
    fontWeight: '500',
    marginBottom: 2,
  },
  planDestination: {
    color: '#49454F',
    marginBottom: 2,
  },
  planDate: {
    color: '#79747E',
  },
  progressChip: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 48,
    alignItems: 'center',
  },
  progressChipText: {
    color: '#1B5E20',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#1C1B1F',
    marginTop: 16,
    marginBottom: 4,
    fontWeight: '500',
  },
  emptySubtitle: {
    color: '#49454F',
    textAlign: 'center',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tagCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  tagName: {
    color: '#1C1B1F',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2,
  },
  tagCount: {
    color: '#49454F',
  },
});

export default HomeScreen;
