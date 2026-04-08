import React, {useState, useEffect} from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import ViewShot from 'react-native-view-shot';
import {useTranslation} from 'react-i18next';
import {Plan, PlanItem, PlanType} from '../types';
import {countAllItems} from '../utils/gearHierarchy';
import {KAKAO_API_KEY} from '../config/apiKeys';

// Instagram Story: 1080x1920 (9:16)
const STORY_WIDTH = 360;
const STORY_HEIGHT = 640;

const C = {
  bg: '#1a1145',
  bgGrad: '#2d1b69',
  card: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.12)',
  accent: '#818CF8',
  accentLight: '#C7D2FE',
  white: '#FFFFFF',
  whiteAlpha: 'rgba(255,255,255,0.7)',
  whiteAlpha2: 'rgba(255,255,255,0.5)',
};

const getPlanTypeLabel = (type: PlanType, t: (key: string) => string) =>
  t(`planType.${type}`);

const formatDateRange = (start: Date, end: Date): string => {
  const fmt = (d: Date) =>
    d.toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'});
  return `${fmt(start)} ~ ${fmt(end)}`;
};

const getStaticMapUrl = (lat: number, lng: number, width: number, height: number) =>
  `https://dapi.kakao.com/v2/maps/open/staticmap?appkey=${KAKAO_API_KEY}&center=${lng},${lat}&level=7&width=${width}&height=${height}&marker=type:default|position:${lng},${lat}`;

interface GearItemRowProps {
  item: PlanItem;
  depth: number;
}

const GearItemRow: React.FC<GearItemRowProps> = ({item, depth}) => {
  const hasChildren = item.children && item.children.length > 0;
  return (
    <View style={{marginLeft: depth * 12}}>
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
    paddingVertical: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.accent,
    marginRight: 8,
  },
  name: {
    flex: 1,
    fontSize: 11,
    color: C.white,
    marginRight: 6,
  },
  weight: {
    fontSize: 10,
    color: C.whiteAlpha,
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
  const [mapBase64, setMapBase64] = useState<string | null>(null);

  useEffect(() => {
    if (!plan.location) return;
    const {latitude, longitude} = plan.location;
    const url = getStaticMapUrl(latitude, longitude, 600, 300);
    fetch(url, {headers: {Authorization: `KakaoAK ${KAKAO_API_KEY}`}})
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => setMapBase64(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => setMapBase64(null));
  }, [plan.location]);

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <ViewShot
        ref={viewShotRef}
        options={{format: 'png', quality: 1, result: 'tmpfile'}}>
        <View style={styles.container}>
          <View style={styles.bgTop} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>PackPlanner</Text>
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {getPlanTypeLabel(plan.type, t)}
              </Text>
              {plan.destination ? (
                <Text style={styles.metaText}> · {plan.destination}</Text>
              ) : null}
            </View>
            <View style={styles.subRow}>
              <Text style={styles.dateText}>
                {formatDateRange(plan.startDate, plan.endDate)}
              </Text>
              <View style={styles.statsInline}>
                <Text style={styles.statInlineText}>{stats.total} {t('plan.gearCount')}</Text>
                <Text style={styles.statInlineDot}> · </Text>
                <Text style={styles.statInlineText}>{totalKg}kg</Text>
              </View>
            </View>
          </View>

          {/* Map */}
          {hasLocation && mapBase64 && (
            <View style={styles.mapSection}>
              <Image
                source={{uri: mapBase64}}
                style={styles.mapImage}
              />
              <View style={styles.mapOverlay}>
                <Text style={styles.mapLabel}>{plan.destination}</Text>
              </View>
            </View>
          )}

          {/* Photos */}
          {hasPhotos && (
            <View style={styles.photoSection}>
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
            </View>
          )}

          {/* Memo */}
          {plan.description ? (
            <View style={styles.memoCard}>
              <Text style={styles.memoText} numberOfLines={3}>
                {plan.description}
              </Text>
            </View>
          ) : null}

          {/* Gear List */}
          {plan.items.length > 0 && (
            <View style={styles.gearSection}>
              <Text style={styles.sectionTitle}>{t('plan.gearList')}</Text>
              <View style={styles.gearCard}>
                {plan.items.slice(0, 15).map(item => (
                  <GearItemRow key={item.id} item={item} depth={0} />
                ))}
                {plan.items.length > 15 && (
                  <Text style={styles.moreText}>
                    +{plan.items.length - 15} more
                  </Text>
                )}
              </View>
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
    minHeight: STORY_HEIGHT,
    backgroundColor: C.bg,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: C.bgGrad,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  header: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: C.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  planName: {
    fontSize: 26,
    fontWeight: '800',
    color: C.white,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
    color: C.whiteAlpha,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dateText: {
    fontSize: 13,
    color: C.accentLight,
    fontWeight: '600',
  },
  statsInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statInlineText: {
    fontSize: 12,
    color: C.whiteAlpha,
    fontWeight: '600',
  },
  statInlineDot: {
    fontSize: 12,
    color: C.whiteAlpha2,
  },
  mapSection: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mapLabel: {
    fontSize: 11,
    color: C.white,
    fontWeight: '600',
  },
  photoSection: {
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 6,
    height: 120,
  },
  photoLarge: {
    flex: 2,
  },
  photoSmall: {
    flex: 1,
  },
  photoItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  memoCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 14,
    marginBottom: 16,
  },
  memoText: {
    fontSize: 12,
    color: C.whiteAlpha,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  gearSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.accentLight,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  gearCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 12,
  },
  moreText: {
    fontSize: 10,
    color: C.whiteAlpha2,
    textAlign: 'center',
    marginTop: 6,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 10,
    color: C.whiteAlpha2,
    letterSpacing: 0.5,
  },
});

export default PlanShareImage;
