import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  useTheme,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Logo from '../components/Logo';
import AdBanner from '../components/AdBanner';
import { Plan, Gear, PlanItem, PlanType } from '../types';

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
  const { t } = useTranslation();
  const activePlans = plans.filter(p => !p.isCompleted);

  const recentPlan = useMemo(() => {
    const now = new Date();
    const futurePlans = activePlans
      .filter(p => p.startDate >= now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return futurePlans[0] || activePlans[activePlans.length - 1];
  }, [activePlans]);

  const topTags = useMemo(() => {
    const tagCount: { [key: string]: number } = {};
    gears.forEach(gear => {
      (gear.tags || []).forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [gears]);

  const countAllPlanItems = (items: PlanItem[]): { total: number; checked: number } => {
    let total = 0, checked = 0;
    const traverse = (list: PlanItem[]) => {
      list.forEach(i => {
        total++;
        if (i.isChecked) checked++;
        if (i.children) traverse(i.children);
      });
    };
    traverse(items);
    return { total, checked };
  };

  const stats = useMemo(() => {
    const totalWeight = gears.reduce((sum, g) => sum + g.weight, 0);
    let checkedItems = 0, totalItems = 0;
    plans.forEach(p => {
      const counts = countAllPlanItems(p.items);
      checkedItems += counts.checked;
      totalItems += counts.total;
    });
    return { totalWeight, checkedItems, totalItems };
  }, [gears, plans]);

  const getPlanTypeIcon = (type: PlanType): string => {
    const iconMap: { [key: string]: string } = {
      [PlanType.AUTO_CAMPING]: 'car',
      [PlanType.MOTO_CAMPING]: 'motorbike',
      [PlanType.BIKE_CAMPING]: 'bicycle',
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

  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* 헤더 영역 - Modern Clean Header */}
        <View style={styles.header}>
          <View>
            <Logo size={32} />
            <Text variant="bodyLarge" style={[styles.headerSubtitle, { color: theme.colors.primary, marginTop: 4 }]}>
              {t('home.subtitle')}
            </Text>
          </View>
          <Surface style={[styles.profileButton, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
            <MaterialCommunityIcons name="account" size={24} color={theme.colors.primary} />
          </Surface>
        </View>

        {/* 통계 카드 - Bento Grid Style */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {/* 장비 Stats */}
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={onNavigateToGears}
              activeOpacity={0.7}>
              <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <MaterialCommunityIcons
                    name="briefcase-outline"
                    size={24}
                    color={theme.colors.secondary}
                  />
                </View>
                <View>
                  <Text variant="displaySmall" style={[styles.statValue, { color: theme.colors.onSurface }]}>
                    {gears.length}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                    {t('home.totalGears')}
                  </Text>
                </View>
              </Surface>
            </TouchableOpacity>

            {/* 무게 Stats */}
            <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.tertiaryContainer }]}>
                <MaterialCommunityIcons
                  name="weight-kilogram"
                  size={24}
                  color={theme.colors.tertiary} // Amber/Orange
                />
              </View>
              <View>
                <Text variant="displaySmall" style={[styles.statValue, { color: theme.colors.onSurface }]}>
                  {(stats.totalWeight / 1000).toFixed(1)}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                  {t('home.totalKg')}
                </Text>
              </View>
            </Surface>
          </View>

          {/* 계획 Stats (Wide) */}
          <TouchableOpacity
            onPress={onNavigateToPlans}
            activeOpacity={0.7}>
            <Surface style={[styles.statCardWide, { backgroundColor: theme.colors.surface }]} elevation={0}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons
                  name="calendar-check-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.statContentWide}>
                <Text variant="displaySmall" style={[styles.statValue, { color: theme.colors.onSurface }]}>
                  {plans.length}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                  {t('home.activePlans')}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.outlineVariant}
                style={{ marginLeft: 'auto' }}
              />
            </Surface>
          </TouchableOpacity>
        </View>

        {/* 최근 계획 카드 - Glass/Clean Look */}
        {recentPlan && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                {t('home.upcomingTrip')}
              </Text>
              <Button
                mode="text"
                onPress={onNavigateToPlans}
                textColor={theme.colors.primary}
                compact>
                {t('home.viewAll')}
              </Button>
            </View>
            <Card
              style={[styles.featuredCard, { backgroundColor: theme.colors.primary }]}
              onPress={() =>
                recentPlan && onNavigateToPlanDetail(recentPlan.id)
              }
              mode="contained">
              <Card.Content style={styles.featuredCardContent}>
                <View style={styles.featuredHeader}>
                  <View style={[styles.planBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <MaterialCommunityIcons
                      name={getPlanTypeIcon(recentPlan.type)}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text variant="labelMedium" style={{ color: '#FFFFFF' }}>
                      {t(`planType.${recentPlan.type}`)}
                    </Text>
                  </View>
                  <View style={[styles.ddayBadge, { backgroundColor: '#FFFFFF' }]}>
                    <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                      {getDday(recentPlan.startDate)}
                    </Text>
                  </View>
                </View>

                <Text variant="headlineMedium" style={styles.featuredPlanName}>
                  {recentPlan.name}
                </Text>

                <View style={styles.featuredDetails}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={18}
                      color="rgba(255,255,255,0.8)"
                    />
                    <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {recentPlan.destination}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={18}
                      color="rgba(255,255,255,0.8)"
                    />
                    <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {formatDateRange(
                        recentPlan.startDate,
                        recentPlan.endDate,
                      )}
                    </Text>
                  </View>
                </View>

                {(() => {
                  const rc = countAllPlanItems(recentPlan.items);
                  if (rc.total === 0) return null;
                  const pct = Math.round((rc.checked / rc.total) * 100);
                  return (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressInfo}>
                        <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
                          {t('home.packingProgress')}
                        </Text>
                        <Text variant="bodySmall" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                          {pct}%
                        </Text>
                      </View>
                      <ProgressBar
                        progress={rc.checked / rc.total}
                        color="#FFFFFF"
                        style={styles.progressBar}
                      />
                    </View>
                  );
                })()}
              </Card.Content>
            </Card>
          </View>
        )}

        {/* 빠른 액션 - Minimal Buttons */}
        <View style={styles.sectionContainer}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            {t('home.quickActions')}
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}
              onPress={onCreateNewPlan}
              activeOpacity={0.8}>
              <View style={[styles.actionIconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons
                  name="plus"
                  size={28}
                  color={theme.colors.primary}
                />
              </View>
              <Text variant="titleMedium" style={[styles.actionBtnLabel, { color: theme.colors.onSurface }]}>
                {t('home.addPlan')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}
              onPress={onNavigateToGears}
              activeOpacity={0.8}>
              <View style={[styles.actionIconCircle, { backgroundColor: theme.colors.secondaryContainer }]}>
                <MaterialCommunityIcons
                  name="format-list-bulleted"
                  size={28}
                  color={theme.colors.secondary}
                />
              </View>
              <Text variant="titleMedium" style={[styles.actionBtnLabel, { color: theme.colors.onSurface }]}>
                {t('home.myGears')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Tags - Chips style */}
        <View style={[styles.sectionContainer, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              {t('home.popularTags')}
            </Text>
          </View>
          <View style={styles.tagsWrapper}>
            {topTags.map(([tag, count]) => (
              <TouchableOpacity
                key={tag}
                onPress={() => onNavigateToGearsWithTag?.(tag)}
                activeOpacity={0.7}>
                <Surface style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant, borderRadius: 20 }]} elevation={0}>
                  <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                    #{tag} <Text style={{ opacity: 0.5 }}>({count})</Text>
                  </Text>
                </Surface>
              </TouchableOpacity>
            ))}
            {topTags.length === 0 && (
              <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>{t('home.noTags')}</Text>
            )}
          </View>
        </View>

      </ScrollView>
      <AdBanner />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '800', // Extra bold
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 4,
    fontWeight: '500',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  statCardWide: {
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statContentWide: {
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    letterSpacing: -1,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  lastSection: {
    marginBottom: 48,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  featuredCard: {
    borderRadius: 28,
    // Shadow removed for cleaner look, relying on color
  },
  featuredCardContent: {
    padding: 24,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  ddayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featuredPlanName: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  featuredDetails: {
    gap: 8,
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressContainer: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnLabel: {
    fontWeight: '600',
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  }
});

export default HomeScreen;
