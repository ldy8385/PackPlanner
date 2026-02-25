import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import ViewShot from 'react-native-view-shot';
import {useTranslation} from 'react-i18next';
import {Plan, PlanItem, PlanType} from '../types';
import {countAllItems} from '../utils/gearHierarchy';

const IMAGE_COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  primary: '#4F46E5',
  onSurface: '#1F2937',
  onSurfaceVariant: '#4B5563',
  outline: '#9CA3AF',
  outlineVariant: '#E5E7EB',
};

const getPlanTypeLabel = (type: PlanType, t: (key: string) => string) =>
  t(`planType.${type}`);

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

interface GearItemBoxProps {
  item: PlanItem;
  depth: number;
  t: (key: string) => string;
}

const GearItemBox: React.FC<GearItemBoxProps> = ({item, depth, t}) => {
  const hasChildren = item.children && item.children.length > 0;
  const bgColor = depth % 2 === 0 ? IMAGE_COLORS.surface : IMAGE_COLORS.background;

  return (
    <View
      style={[
        styles.gearBox,
        {
          backgroundColor: bgColor,
          borderColor: hasChildren
            ? IMAGE_COLORS.outline
            : IMAGE_COLORS.outlineVariant,
        },
      ]}>
      <View style={styles.gearBoxHeader}>
        <Text style={styles.gearName} numberOfLines={1}>
          {item.gear.name}
        </Text>
        <Text style={styles.gearWeight}>{item.gear.weight}kg</Text>
      </View>
      {hasChildren && (
        <View style={styles.gearChildren}>
          {item.children!.map(child => (
            <GearItemBox
              key={child.id}
              item={child}
              depth={depth + 1}
              t={t}
            />
          ))}
        </View>
      )}
    </View>
  );
};

interface PlanShareImageProps {
  plan: Plan;
  viewShotRef: React.RefObject<any>;
}

const PlanShareImage: React.FC<PlanShareImageProps> = ({
  plan,
  viewShotRef,
}) => {
  const {t} = useTranslation();
  const stats = countAllItems(plan.items);

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <ViewShot
        ref={viewShotRef}
        options={{format: 'png', quality: 1, result: 'tmpfile'}}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planMeta}>
              {getPlanTypeLabel(plan.type, t)} · {plan.destination}
            </Text>
            <Text style={styles.planMeta}>
              {formatDateRange(plan.startDate, plan.endDate)}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>
                  {stats.total} {t('plan.gearCount')}
                </Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>
                  {stats.weight.toFixed(1)}kg
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Gear Tree */}
          <View style={styles.gearTree}>
            {plan.items.map(item => (
              <GearItemBox key={item.id} item={item} depth={0} t={t} />
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('plan.poweredBy')}</Text>
          </View>
        </View>
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
  container: {
    width: 375,
    backgroundColor: IMAGE_COLORS.background,
    padding: 20,
  },
  header: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: IMAGE_COLORS.onSurface,
    marginBottom: 6,
  },
  planMeta: {
    fontSize: 14,
    color: IMAGE_COLORS.onSurfaceVariant,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  statBadge: {
    backgroundColor: IMAGE_COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: IMAGE_COLORS.outlineVariant,
    marginBottom: 16,
  },
  gearTree: {
    gap: 8,
  },
  gearBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  gearBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gearName: {
    fontSize: 14,
    fontWeight: '500',
    color: IMAGE_COLORS.onSurface,
    flex: 1,
    marginRight: 8,
  },
  gearWeight: {
    fontSize: 12,
    color: IMAGE_COLORS.onSurfaceVariant,
  },
  gearChildren: {
    marginTop: 8,
    gap: 6,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IMAGE_COLORS.outlineVariant,
  },
  footerText: {
    fontSize: 12,
    color: IMAGE_COLORS.outline,
  },
});

export default PlanShareImage;
