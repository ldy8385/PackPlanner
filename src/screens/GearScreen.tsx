import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Text, Chip, Surface, IconButton, Divider, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Gear, GearCategory, GearTemplate } from '../types';
import { gearCategories, getManufacturerName } from '../data/mockData';
import CreateTemplateScreen from './CreateTemplateScreen';

interface GearScreenProps {
  gears: Gear[];
  onUpdateGears: (gears: Gear[]) => void;
  templates: GearTemplate[];
  onUpdateTemplates: (templates: GearTemplate[]) => void;
  onCreateGear: () => void;
  onEditGear: (gear: Gear) => void;
  onDeleteGear?: (gearId: string, affectedPlans: string[]) => void;
  initialSelectedTags?: string[];
  plans?: { id: string; name: string; items: { gearId: string }[] }[];
}

const GearScreen: React.FC<GearScreenProps> = ({
  gears,
  onUpdateGears: _onUpdateGears,
  templates,
  onUpdateTemplates,
  onCreateGear,
  onEditGear,
  onDeleteGear,
  initialSelectedTags = [],
  plans = [],
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'gears' | 'templates'>('gears');
  const [selectedCategory, setSelectedCategory] = useState<GearCategory | null>(
    null,
  );
  const [selectedTags, setSelectedTags] =
    useState<string[]>(initialSelectedTags);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>(
    [],
  );
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GearTemplate | null>(
    null,
  );

  // initialSelectedTags가 변경되면 selectedTags 업데이트
  useEffect(() => {
    setSelectedTags(initialSelectedTags);
  }, [initialSelectedTags]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    gears.forEach(gear => {
      (gear.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [gears]);

  const allManufacturers = useMemo(() => {
    const manufacturerSet = new Set<string>();
    gears.forEach(gear => {
      if (gear.manufacturer) {
        manufacturerSet.add(gear.manufacturer);
      }
    });
    return Array.from(manufacturerSet).sort((a, b) =>
      getManufacturerName(a, i18n.language).localeCompare(getManufacturerName(b, i18n.language)),
    );
  }, [gears, i18n.language]);

  const filteredGears = useMemo(() => {
    let result = gears;
    if (selectedCategory) {
      result = result.filter(g => g.category === selectedCategory);
    }
    if (selectedTags.length > 0) {
      result = result.filter(g =>
        selectedTags.some(tag => (g.tags || []).includes(tag)),
      );
    }
    if (selectedManufacturers.length > 0) {
      result = result.filter(g =>
        selectedManufacturers.some(m => g.manufacturer === m),
      );
    }
    return result;
  }, [gears, selectedCategory, selectedTags, selectedManufacturers]);

  const totalWeight = filteredGears.reduce((sum, gear) => sum + gear.weight, 0);

  const getCategoryIcon = (category: GearCategory): string => {
    const iconMap: { [key: string]: string } = {
      [GearCategory.TENT]: 'tent',
      [GearCategory.TARP]: 'texture',
      [GearCategory.SLEEPING_BAG]: 'sleep',
      [GearCategory.PILLOW]: 'panorama-wide-angle-outline',
      [GearCategory.MAT]: 'bed',
      [GearCategory.COOKING]: 'silverware-fork-knife',
      [GearCategory.LIGHTING]: 'lamp',
      [GearCategory.BATTERY]: 'battery',
      [GearCategory.CAMERA]: 'camera',
      [GearCategory.POUCH]: 'package-variant-closed',
      [GearCategory.CHAIR]: 'chair-rolling',
      [GearCategory.TABLE]: 'table-furniture',
      [GearCategory.SOUND]: 'speaker',
      [GearCategory.FURNITURE]: 'sofa',
      [GearCategory.CLOTHING]: 'tshirt-v',
      [GearCategory.ACCESSORIES]: 'toolbox',
      [GearCategory.TOOLS]: 'wrench',
      [GearCategory.CARE]: 'shower',
      [GearCategory.DOWN]: 'feather',
      [GearCategory.BOOTY]: 'shoe-cleat',
      [GearCategory.FOOD]: 'food-apple',
      [GearCategory.BOTTLE]: 'bottle-tonic-outline',
      [GearCategory.TABLEWARE]: 'silverware-fork-knife',
      [GearCategory.HIKING_STICK]: 'hiking',
      [GearCategory.BAG]: 'bag-personal',
      [GearCategory.ETC]: 'package-variant',
    };
    return iconMap[category] || 'package-variant';
  };

  const handleDeleteGear = (gear: Gear) => {
    // 연결된 계획 확인
    const affectedPlans = plans.filter(plan =>
      plan.items.some(planItem => planItem.gearId === gear.id),
    );

    const planNames = affectedPlans.map(plan => plan.name).join(', ');
    const planCount = affectedPlans.length;

    let alertMessage = t('gear.deleteGearMessage', { name: gear.name });
    if (planCount > 0) {
      alertMessage += t('gear.deleteGearWarning', { count: planCount });
      alertMessage += t('gear.deleteGearPlans', { plans: planNames });
      alertMessage += t('gear.deleteGearAffected');
    }

    Alert.alert(
      t('gear.deleteGearTitle'),
      alertMessage,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            const affectedPlanIds = affectedPlans.map(plan => plan.id);
            onDeleteGear?.(gear.id, affectedPlanIds);
          },
        },
      ],
      { cancelable: true },
    );
  };

  const renderGearItem = ({ item }: { item: Gear }) => (
    <View style={[styles.gearCard, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity
        style={styles.gearContent}
        onPress={() => onEditGear(item)}
        activeOpacity={0.7}>
        <View style={styles.gearHeader}>
          <Surface style={[styles.gearIcon, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.gearImage} />
            ) : (
              <Icon
                name={getCategoryIcon(item.category)}
                size={24}
                color={theme.colors.onSecondaryContainer}
              />
            )}
          </Surface>
          <View style={styles.gearInfo}>
            <Text variant="titleMedium" style={[styles.gearName, { color: theme.colors.onSurface }]}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
              {t(`gearCategory.${item.category}`)}
            </Text>
            {item.manufacturer && (
              <View style={styles.manufacturerRow}>
                <Icon name="factory" size={12} color={theme.colors.outline} />
                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                  {getManufacturerName(item.manufacturer, i18n.language)}
                </Text>
              </View>
            )}
            {(item.tags || []).length > 0 && (
              <View style={styles.tagsRow}>
                {(item.tags || []).slice(0, 3).map((tag, index) => (
                  <Surface key={index} style={[styles.tagBadge, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {tag}
                    </Text>
                  </Surface>
                ))}
                {(item.tags || []).length > 3 && (
                  <Text variant="labelSmall" style={{ color: theme.colors.outline, paddingVertical: 4 }}>
                    +{(item.tags || []).length - 3}
                  </Text>
                )}
              </View>
            )}
            {/* Badges Row */}
            <View style={styles.badgesRow}>
              {item.container && (
                <View style={[styles.badgeContainer, { backgroundColor: theme.colors.tertiaryContainer }]}>
                  <Icon
                    name="package-variant-closed"
                    size={12}
                    color={theme.colors.onTertiaryContainer}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onTertiaryContainer, fontWeight: '500' }}>
                    {t('gear.packed')}
                  </Text>
                </View>
              )}
              {item.quantity && item.quantity > 1 && (
                <View style={[styles.badgeContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Icon name="numeric" size={12} color={theme.colors.onPrimaryContainer} />
                  <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '500' }}>
                    x{item.quantity}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.weightContainer}>
            <Icon name="weight-kilogram" size={16} color={theme.colors.secondary} />
            <Text variant="titleSmall" style={{ color: theme.colors.secondary, fontWeight: '600' }}>
              {item.weight}kg
            </Text>
          </View>
        </View>
        {item.description && <Divider style={styles.descriptionDivider} />}
      </TouchableOpacity>

      {/* Delete Action */}
      <TouchableOpacity
        style={[styles.deleteGearButton, { borderTopColor: theme.colors.outlineVariant }]}
        onPress={() => handleDeleteGear(item)}
        activeOpacity={0.7}>
        <Icon name="delete-outline" size={20} color={theme.colors.error} />
        <Text variant="bodySmall" style={{ color: theme.colors.error, fontWeight: '500' }}>
          {t('gear.remove')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (

    <SafeView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Tabs */}
      <Surface style={[styles.tabHeader, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'gears' && { borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('gears')}>
          <Text
            variant="titleSmall"
            style={{
              color: activeTab === 'gears' ? theme.colors.primary : theme.colors.onSurfaceVariant,
              fontWeight: activeTab === 'gears' ? '600' : '500',
            }}>
            {t('gear.gearList')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'templates' && { borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('templates')}>
          <Text
            variant="titleSmall"
            style={{
              color: activeTab === 'templates' ? theme.colors.primary : theme.colors.onSurfaceVariant,
              fontWeight: activeTab === 'templates' ? '600' : '500',
            }}>
            {t('gear.templates')}
          </Text>
        </TouchableOpacity>
      </Surface>

      {activeTab === 'gears' ? (
        <>
          {/* Filters */}
          <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.filterSection, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}
              contentContainerStyle={styles.filterContent}>
              <Chip
                onPress={() => setSelectedCategory(null)}
                style={{ backgroundColor: !selectedCategory ? theme.colors.secondaryContainer : theme.colors.surfaceVariant }}
                textStyle={{ color: !selectedCategory ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant }}
                showSelectedOverlay>
                {t('common.all')}
              </Chip>
              {gearCategories.map(category => (
                <Chip
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={{ backgroundColor: selectedCategory === category ? theme.colors.secondaryContainer : theme.colors.surfaceVariant }}
                  textStyle={{ color: selectedCategory === category ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant }}
                  icon={getCategoryIcon(category)}
                  showSelectedOverlay>
                  {t(`gearCategory.${category}`)}
                </Chip>
              ))}
            </ScrollView>

            {allTags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.tagFilterSection, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}
                contentContainerStyle={styles.filterContent}>
                <Chip
                  onPress={() => setSelectedTags([])}
                  style={{ backgroundColor: selectedTags.length === 0 ? theme.colors.tertiaryContainer : theme.colors.surfaceVariant }}
                  textStyle={{ color: selectedTags.length === 0 ? theme.colors.onTertiaryContainer : theme.colors.onSurfaceVariant }}>
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
                    style={{ backgroundColor: selectedTags.includes(tag) ? theme.colors.tertiaryContainer : theme.colors.surfaceVariant }}
                    textStyle={{ color: selectedTags.includes(tag) ? theme.colors.onTertiaryContainer : theme.colors.onSurfaceVariant }}
                    showSelectedOverlay>
                    #{tag}
                  </Chip>
                ))}
              </ScrollView>
            )}

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
              <Surface style={[styles.statBox, { backgroundColor: theme.colors.surface }]} elevation={0}>
                <View style={[styles.statIconCircle, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <Icon name="briefcase-outline" size={20} color={theme.colors.secondary} />
                </View>
                <View>
                  <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
                    {filteredGears.length}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                    {t('gear.items')}
                  </Text>
                </View>
              </Surface>

              <Surface style={[styles.statBox, { backgroundColor: theme.colors.surface }]} elevation={0}>
                <View style={[styles.statIconCircle, { backgroundColor: theme.colors.tertiaryContainer }]}>
                  <Icon name="tag-outline" size={20} color={theme.colors.tertiary} />
                </View>
                <View>
                  <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
                    {allTags.length}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                    {t('gear.tags')}
                  </Text>
                </View>
              </Surface>

              <Surface style={[styles.statBox, { backgroundColor: theme.colors.surface }]} elevation={0}>
                <View style={[styles.statIconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Icon name="weight" size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
                    {totalWeight.toFixed(1)}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                    {t('gear.totalKg')}
                  </Text>
                </View>
              </Surface>
            </View>
          </View>

          {/* Gear List */}
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}>
            {filteredGears.map(gear => (
              <View key={gear.id}>{renderGearItem({ item: gear })}</View>
            ))}
            {filteredGears.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="bag-personal-off-outline" size={48} color={theme.colors.outlineVariant} />
                <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.onSurface }}>{t('gear.noItemsFound')}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>{t('gear.adjustFilters')}</Text>
              </View>
            )}
          </ScrollView>

          {/* FAB */}
          <Surface style={[styles.fab, { backgroundColor: theme.colors.primary, borderRadius: 16 }]} elevation={4}>
            <TouchableOpacity
              style={styles.fabTouchable}
              onPress={onCreateGear}
              activeOpacity={0.8}>
              <Icon name="plus" size={28} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </Surface>
        </>
      ) : showCreateTemplate ? (
        <CreateTemplateScreen
          gears={gears}
          editingTemplate={editingTemplate}
          onSave={template => {
            if (editingTemplate) {
              const updatedTemplates = templates.map(t =>
                t.id === template.id ? template : t,
              );
              onUpdateTemplates(updatedTemplates);
            } else {
              onUpdateTemplates([...templates, template]);
            }
            setShowCreateTemplate(false);
            setEditingTemplate(null);
          }}
          onCancel={() => {
            setShowCreateTemplate(false);
            setEditingTemplate(null);
          }}
        />
      ) : (
        <View style={styles.container}>
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}>
            {templates.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="playlist-plus" size={48} color={theme.colors.outlineVariant} />
                <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.onSurface }}>{t('gear.noTemplates')}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>{t('gear.createTemplatesHint')}</Text>
              </View>
            ) : (
              templates.map(template => {
                const templateGears = gears.filter(g =>
                  template.gearIds.includes(g.id),
                );
                const tWeight = templateGears.reduce(
                  (sum, g) => sum + g.weight,
                  0,
                );

                return (
                  <Surface key={template.id} style={[styles.templateCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
                    <TouchableOpacity
                      style={{ padding: 16 }}
                      onPress={() => {
                        setEditingTemplate(template);
                        setShowCreateTemplate(true);
                      }}
                      activeOpacity={0.7}>
                      <View style={styles.templateHeader}>
                        <Surface style={[styles.templateIcon, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
                          <Icon name="playlist-check" size={24} color={theme.colors.onSecondaryContainer} />
                        </Surface>
                        <View style={styles.templateInfo}>
                          <Text variant="titleMedium" style={[styles.templateName, { color: theme.colors.onSurface }]}>
                            {template.name}
                          </Text>
                          <View style={styles.templateMeta}>
                            <View style={styles.templateStat}>
                              <Icon
                                name="format-list-bulleted"
                                size={14}
                                color={theme.colors.outline}
                              />
                              <Text
                                variant="bodySmall"
                                style={{ color: theme.colors.outline }}>
                                {t('gear.itemsCount', { count: template.gearIds.length })}
                              </Text>
                            </View>
                            <View style={styles.templateStat}>
                              <Icon
                                name="weight-kilogram"
                                size={14}
                                color={theme.colors.outline}
                              />
                              <Text
                                variant="bodySmall"
                                style={{ color: theme.colors.outline }}>
                                {tWeight.toFixed(1)}kg
                              </Text>
                            </View>
                          </View>
                        </View>
                        <IconButton
                          icon="delete-outline"
                          size={20}
                          iconColor={theme.colors.error}
                          onPress={() => {
                            Alert.alert(
                              t('gear.deleteTemplateTitle'),
                              t('gear.deleteTemplateMessage', { name: template.name }),
                              [
                                { text: t('common.cancel'), style: 'cancel' },
                                {
                                  text: t('common.delete'),
                                  style: 'destructive',
                                  onPress: () => {
                                    onUpdateTemplates(
                                      templates.filter(t => t.id !== template.id),
                                    );
                                  },
                                },
                              ],
                            );
                          }}
                        />
                      </View>
                      {template.description && (
                        <>
                          <Divider style={styles.templateDivider} />
                          <Text
                            variant="bodySmall"
                            style={{ color: theme.colors.onSurfaceVariant }}>
                            {template.description}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </Surface>
                );
              })
            )}
          </ScrollView>

          <Surface style={[styles.fab, { backgroundColor: theme.colors.primary, borderRadius: 16 }]} elevation={4}>
            <TouchableOpacity
              style={styles.fabTouchable}
              onPress={() => {
                setEditingTemplate(null);
                setShowCreateTemplate(true);
              }}
              activeOpacity={0.8}>
              <Icon name="plus" size={28} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </Surface>
        </View>
      )}
    </SafeView>
  );
};

const SafeView = SafeAreaView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  fixedHeader: {
    zIndex: 1,
  },
  filterSection: {
    maxHeight: 70,
    borderBottomWidth: 1,
  },
  tagFilterSection: {
    maxHeight: 60,
    borderBottomWidth: 1,
  },
  manufacturerFilterSection: {
    maxHeight: 60,
    borderBottomWidth: 1,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listFooter: {
    height: 80,
  },
  gearCard: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gearContent: {
    padding: 16,
  },
  gearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  gearImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gearInfo: {
    flex: 1,
  },
  gearName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  manufacturerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weightContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
    gap: 2,
  },
  descriptionDivider: {
    marginVertical: 12,
  },
  deleteGearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  // Template Styles
  templateCard: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontWeight: '600',
    marginBottom: 6,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  templateCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  templateStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateDivider: {
    marginVertical: 12,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabTouchable: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GearScreen;
