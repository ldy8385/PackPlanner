import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import ViewShot from 'react-native-view-shot';
import {useTranslation} from 'react-i18next';
import {Plan, PlanItem, PlanType} from '../types';
import {countAllItems} from '../utils/gearHierarchy';
import {GOOGLE_MAPS_API_KEY} from '@env';

const STORY_WIDTH = 360;

const C = {
  bg: '#F3F4F6',
  card: '#FFFFFF',
  accent: '#4F46E5',
  accentBg: '#EEF2FF',
  text: '#111827',
  textSub: '#4B5563',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
};

const getPlanTypeLabel = (type: PlanType, t: (key: string) => string) =>
  t(`planType.${type}`);

const formatDateRange = (start: Date, end: Date): string => {
  const fmt = (d: Date) =>
    d.toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'});
  return `${fmt(start)} ~ ${fmt(end)}`;
};

const getStaticMapUrl = (lat: number, lng: number, width: number, height: number) =>
  `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=${width}x${height}&scale=2&markers=color:0x4F46E5|${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;

interface GearItemRowProps {
  item: PlanItem;
  depth: number;
}

const GearItemRow: React.FC<GearItemRowProps> = ({item, depth}) => {
  const hasChildren = item.children && item.children.length > 0;
  return (
    <View style={{marginLeft: depth * 14}}>
      <View style={rowStyles.row}>
        <View style={rowStyles.dot} />
        <Text style={rowStyles.name} numberOfLines={1}>{item.gear.name}</Text>
        <Text style={rowStyles.weight}>{item.gear.weight}g</Text>
      </View>
      {hasChildren && item.children!.map(child => (
        <GearItemRow key={child.id} item={child} depth={depth + 1} />
      ))}
    </View>
  );
};

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.accent,
    marginRight: 8,
  },
  name: {
    flex: 1,
    fontSize: 12,
    color: C.text,
    marginRight: 6,
  },
  weight: {
    fontSize: 11,
    color: C.textMuted,
  },
});

interface PlanShareImageProps {
  plan: Plan;
  viewShotRef: React.RefObject<any>;
}

const PlanShareImage: React.FC<PlanShareImageProps> = ({plan, viewShotRef}) => {
  const {t} = useTranslation();
  const stats = countAllItems(plan.items);
  const totalKg = (stats.weight / 1000).toFixed(1);
  const photos = plan.photos || [];
  const hasPhotos = photos.length > 0;
  const hasLocation = !!plan.location;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <ViewShot
        ref={viewShotRef}
        options={{format: 'png', quality: 1, result: 'tmpfile'}}>
        <View style={styles.container}>

          {/* Header Card */}
          <View style={styles.headerCard}>
            <Text style={styles.appName}>PACKPLANNER</Text>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.metaText}>
              {getPlanTypeLabel(plan.type, t)}{plan.destination ? ` · ${plan.destination}` : ''}
            </Text>
            <View style={styles.headerBottom}>
              <Text style={styles.dateText}>
                {formatDateRange(plan.startDate, plan.endDate)}
              </Text>
              <View style={styles.statBadges}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.total} {t('plan.gearCount')}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalKg}kg</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Map */}
          {hasLocation && (
            <View style={styles.mapCard}>
              <Image
                source={{uri: getStaticMapUrl(plan.location!.latitude, plan.location!.longitude, 600, 280)}}
                style={styles.mapImage}
              />
              {plan.destination ? (
                <View style={styles.mapLabelRow}>
                  <Text style={styles.mapLabel}>{plan.destination}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Photos */}
          {hasPhotos && (
            <View style={styles.photoGrid}>
              {photos.slice(0, 3).map((url, i) => (
                <View key={i} style={[
                  styles.photoItem,
                  i === 0 && photos.length >= 2 ? styles.photoLarge : styles.photoSmall,
                ]}>
                  <Image source={{uri: url}} style={styles.photoImage} />
                </View>
              ))}
            </View>
          )}

          {/* Memo */}
          {plan.description ? (
            <View style={styles.memoCard}>
              <Text style={styles.memoLabel}>{t('plan.memo')}</Text>
              <Text style={styles.memoText} numberOfLines={3}>
                {plan.description}
              </Text>
            </View>
          ) : null}

          {/* Gear List */}
          {plan.items.length > 0 && (
            <View style={styles.gearCard}>
              <Text style={styles.sectionTitle}>{t('plan.gearList')}</Text>
              {plan.items.slice(0, 15).map(item => (
                <GearItemRow key={item.id} item={item} depth={0} />
              ))}
              {plan.items.length > 15 && (
                <Text style={styles.moreText}>+{plan.items.length - 15} more</Text>
              )}
            </View>
          )}

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
    width: STORY_WIDTH,
    backgroundColor: C.bg,
    padding: 16,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 12,
  },
  headerCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
  },
  appName: {
    fontSize: 11,
    fontWeight: '700',
    color: C.accent,
    letterSpacing: 2,
    marginBottom: 10,
  },
  planName: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: C.textSub,
    marginBottom: 12,
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: C.accent,
    fontWeight: '700',
  },
  statBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: C.accentBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.accent,
  },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.card,
  },
  mapImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  mapLabelRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  mapLabel: {
    fontSize: 12,
    color: C.textSub,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 6,
    height: 130,
  },
  photoLarge: {
    flex: 2,
  },
  photoSmall: {
    flex: 1,
  },
  photoItem: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  memoCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
  },
  memoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  memoText: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 20,
  },
  gearCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  moreText: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 0.5,
  },
});

export default PlanShareImage;
