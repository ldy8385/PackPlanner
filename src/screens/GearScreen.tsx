import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  Chip,
  Surface,
  IconButton,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Gear, GearCategory, GearTemplate} from '../types';
import {gearCategories} from '../data/mockData';
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
  plans?: {id: string; name: string; items: {gearId: string}[]}[];
}

const GearScreen: React.FC<GearScreenProps> = ({
  gears,
  onUpdateGears,
  templates,
  onUpdateTemplates,
  onCreateGear,
  onEditGear,
  onDeleteGear,
  initialSelectedTags = [],
  plans = [],
}) => {
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
      gear.tags.forEach(tag => tagSet.add(tag));
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
    return Array.from(manufacturerSet).sort();
  }, [gears]);

  const filteredGears = useMemo(() => {
    let result = gears;
    if (selectedCategory) {
      result = result.filter(g => g.category === selectedCategory);
    }
    if (selectedTags.length > 0) {
      result = result.filter(g =>
        selectedTags.some(tag => g.tags.includes(tag)),
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

  const templateCategories = useMemo(() => {
    const categories = new Set<string>();
    templates.forEach(t => {
      if (t.category) categories.add(t.category);
    });
    return Array.from(categories).sort();
  }, [templates]);

  const getCategoryIcon = (category: GearCategory): string => {
    const iconMap: {[key: string]: string} = {
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

    let alertMessage = `"${gear.name}" 장비를 삭제하시겠습니까?`;
    if (planCount > 0) {
      alertMessage += `\n\n⚠️ 주의: 이 장비는 ${planCount}개의 계획에서 사용 중입니다.\n`;
      alertMessage += `(${planNames})\n\n`;
      alertMessage += `삭제 시 해당 계획에서도 제거됩니다.`;
    }

    Alert.alert(
      '장비 삭제',
      alertMessage,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            const affectedPlanIds = affectedPlans.map(plan => plan.id);
            onDeleteGear?.(gear.id, affectedPlanIds);
          },
        },
      ],
      {cancelable: true},
    );
  };

  const renderGearItem = ({item}: {item: Gear}) => (
    <View style={styles.gearCard}>
      <TouchableOpacity
        style={styles.gearContent}
        onPress={() => onEditGear(item)}
        activeOpacity={0.7}>
        <View style={styles.gearHeader}>
          <Surface style={styles.gearIcon} elevation={0}>
            {item.imageUrl ? (
              <Image source={{uri: item.imageUrl}} style={styles.gearImage} />
            ) : (
              <Icon
                name={getCategoryIcon(item.category)}
                size={24}
                color="#2E7D32"
              />
            )}
          </Surface>
          <View style={styles.gearInfo}>
            <Text variant="titleMedium" style={styles.gearName}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={styles.gearCategory}>
              {item.category}
            </Text>
            {item.manufacturer && (
              <View style={styles.manufacturerRow}>
                <Icon name="factory" size={12} color="#79747E" />
                <Text variant="bodySmall" style={styles.gearManufacturer}>
                  {item.manufacturer}
                </Text>
              </View>
            )}
            {item.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {item.tags.slice(0, 3).map((tag, index) => (
                  <Surface key={index} style={styles.tagBadge} elevation={0}>
                    <Text variant="labelSmall" style={styles.tagText}>
                      {tag}
                    </Text>
                  </Surface>
                ))}
                {item.tags.length > 3 && (
                  <Text variant="labelSmall" style={styles.moreTags}>
                    +{item.tags.length - 3}
                  </Text>
                )}
              </View>
            )}
          </View>
          <View style={styles.weightContainer}>
            <Icon name="weight-kilogram" size={16} color="#2E7D32" />
            <Text variant="titleSmall" style={styles.gearWeight}>
              {item.weight}kg
            </Text>
          </View>
        </View>
        {item.description && <Divider style={styles.descriptionDivider} />}
      </TouchableOpacity>

      {/* 삭제 버튼 */}
      <TouchableOpacity
        style={styles.deleteGearButton}
        onPress={() => handleDeleteGear(item)}
        activeOpacity={0.7}>
        <Icon name="delete" size={20} color="#B3261E" />
        <Text variant="bodySmall" style={styles.deleteGearText}>
          삭제
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeView style={styles.container}>
      {/* 상단 탭 */}
      <Surface style={styles.tabHeader} elevation={1}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gears' && styles.tabActive]}
          onPress={() => setActiveTab('gears')}>
          <Text
            variant="titleSmall"
            style={[
              styles.tabText,
              activeTab === 'gears' && styles.tabTextActive,
            ]}>
            장비 목록
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
          onPress={() => setActiveTab('templates')}>
          <Text
            variant="titleSmall"
            style={[
              styles.tabText,
              activeTab === 'templates' && styles.tabTextActive,
            ]}>
            구성 관리
          </Text>
        </TouchableOpacity>
      </Surface>

      {activeTab === 'gears' ? (
        <>
          {/* 필터 헤더 */}
          <View style={styles.fixedHeader}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterSection}
              contentContainerStyle={styles.filterContent}>
              <Chip
                onPress={() => setSelectedCategory(null)}
                style={[
                  styles.filterChip,
                  !selectedCategory && styles.filterChipSelected,
                ]}
                textStyle={
                  !selectedCategory ? styles.filterChipTextSelected : undefined
                }>
                전체
              </Chip>
              {gearCategories.map(category => (
                <Chip
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.filterChip,
                    selectedCategory === category && styles.filterChipSelected,
                  ]}
                  textStyle={
                    selectedCategory === category
                      ? styles.filterChipTextSelected
                      : undefined
                  }
                  icon={getCategoryIcon(category)}>
                  {category}
                </Chip>
              ))}
            </ScrollView>

            {allTags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tagFilterSection}
                contentContainerStyle={styles.filterContent}>
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

            {allManufacturers.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.manufacturerFilterSection}
                contentContainerStyle={styles.filterContent}>
                <Chip
                  onPress={() => setSelectedManufacturers([])}
                  style={[
                    styles.manufacturerFilterChip,
                    selectedManufacturers.length === 0 &&
                      styles.manufacturerFilterChipSelected,
                  ]}
                  textStyle={
                    selectedManufacturers.length === 0
                      ? styles.manufacturerFilterChipTextSelected
                      : undefined
                  }
                  icon="factory">
                  모든 제조사
                </Chip>
                {allManufacturers.map(manufacturer => (
                  <Chip
                    key={manufacturer}
                    onPress={() => {
                      if (selectedManufacturers.includes(manufacturer)) {
                        setSelectedManufacturers(
                          selectedManufacturers.filter(m => m !== manufacturer),
                        );
                      } else {
                        setSelectedManufacturers([
                          ...selectedManufacturers,
                          manufacturer,
                        ]);
                      }
                    }}
                    style={[
                      styles.manufacturerFilterChip,
                      selectedManufacturers.includes(manufacturer) &&
                        styles.manufacturerFilterChipSelected,
                    ]}
                    textStyle={
                      selectedManufacturers.includes(manufacturer)
                        ? styles.manufacturerFilterChipTextSelected
                        : undefined
                    }>
                    {manufacturer}
                  </Chip>
                ))}
              </ScrollView>
            )}

            {/* 통계 요약 */}
            <View style={styles.statsContainer}>
              <Surface style={styles.statBox} elevation={1}>
                <Icon name="briefcase" size={24} color="#2E7D32" />
                <Text variant="titleLarge" style={styles.statNumber}>
                  {filteredGears.length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  장비
                </Text>
              </Surface>
              <Surface style={styles.statBox} elevation={1}>
                <Icon name="tag" size={24} color="#558B2F" />
                <Text variant="titleLarge" style={styles.statNumber}>
                  {allTags.length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  태그
                </Text>
              </Surface>
              <Surface style={styles.statBox} elevation={1}>
                <Icon name="weight-kilogram" size={24} color="#00695C" />
                <Text variant="titleLarge" style={styles.statNumber}>
                  {totalWeight.toFixed(1)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  kg
                </Text>
              </Surface>
            </View>
          </View>

          {/* 장비 목록 */}
          <ScrollView
            style={styles.listContainer}
            showsVerticalScrollIndicator={false}>
            {filteredGears.map(gear => (
              <View key={gear.id}>{renderGearItem({item: gear})}</View>
            ))}
            <View style={styles.listFooter} />
          </ScrollView>

          {/* FAB */}
          <TouchableOpacity style={styles.fab} onPress={onCreateGear}>
            <Icon name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      ) : showCreateTemplate ? (
        <CreateTemplateScreen
          gears={gears}
          existingCategories={templateCategories}
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
            showsVerticalScrollIndicator={false}>
            {templates.length === 0 ? (
              <Surface style={styles.emptyCard} elevation={1}>
                <Icon name="playlist-plus" size={64} color="#79747E" />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  등록된 템플릿이 없습니다
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  자주 사용하는 장비 조합을 템플릿으로 저장하세요
                </Text>
              </Surface>
            ) : (
              templates.map(template => {
                const templateGears = gears.filter(g =>
                  template.gearIds.includes(g.id),
                );
                const totalWeight = templateGears.reduce(
                  (sum, g) => sum + g.weight,
                  0,
                );

                return (
                  <TouchableOpacity
                    key={template.id}
                    style={styles.templateCard}
                    onPress={() => {
                      setEditingTemplate(template);
                      setShowCreateTemplate(true);
                    }}
                    activeOpacity={0.7}>
                    <View style={styles.templateHeader}>
                      <Surface style={styles.templateIcon} elevation={0}>
                        <Icon name="playlist-check" size={28} color="#2E7D32" />
                      </Surface>
                      <View style={styles.templateInfo}>
                        <Text variant="titleMedium" style={styles.templateName}>
                          {template.name}
                        </Text>
                        <View style={styles.templateMeta}>
                          {template.category && (
                            <Surface
                              style={styles.templateCategoryBadge}
                              elevation={0}>
                              <Text
                                variant="labelSmall"
                                style={styles.templateCategoryText}>
                                {template.category}
                              </Text>
                            </Surface>
                          )}
                          <View style={styles.templateStat}>
                            <Icon
                              name="package-variant"
                              size={14}
                              color="#49454F"
                            />
                            <Text
                              variant="bodySmall"
                              style={styles.templateStatText}>
                              {template.gearIds.length}개
                            </Text>
                          </View>
                          <View style={styles.templateStat}>
                            <Icon
                              name="weight-kilogram"
                              size={14}
                              color="#2E7D32"
                            />
                            <Text
                              variant="bodySmall"
                              style={styles.templateStatWeight}>
                              {totalWeight.toFixed(1)}kg
                            </Text>
                          </View>
                        </View>
                      </View>
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#B3261E"
                        onPress={() => {
                          Alert.alert(
                            '템플릿 삭제',
                            `'${template.name}' 템플릿을 삭제하시겠습니까?`,
                            [
                              {text: '취소', style: 'cancel'},
                              {
                                text: '삭제',
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
                          style={styles.templateDescription}>
                          {template.description}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
            <View style={styles.listFooter} />
          </ScrollView>

          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              setEditingTemplate(null);
              setShowCreateTemplate(true);
            }}>
            <Icon name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeView>
  );
};

const SafeView = SafeAreaView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#FEF7FF',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    color: '#49454F',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  fixedHeader: {
    backgroundColor: '#F5F5F5',
  },
  filterSection: {
    maxHeight: 70,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0EC',
  },
  tagFilterSection: {
    maxHeight: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0EC',
  },
  manufacturerFilterSection: {
    maxHeight: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0EC',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F5F5F5',
  },
  filterChipSelected: {
    backgroundColor: '#C8E6C9',
  },
  filterChipTextSelected: {
    color: '#1B5E20',
    fontWeight: '600',
  },
  tagFilterChip: {
    backgroundColor: '#F5F5F5',
  },
  tagFilterChipSelected: {
    backgroundColor: '#DCEDC8',
  },
  tagFilterChipTextSelected: {
    color: '#33691E',
    fontWeight: '600',
  },
  manufacturerFilterChip: {
    backgroundColor: '#F5F5F5',
  },
  manufacturerFilterChipSelected: {
    backgroundColor: '#B2DFDB',
  },
  manufacturerFilterChipTextSelected: {
    color: '#004D40',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    color: '#1C1B1F',
    fontWeight: '600',
    marginTop: 8,
  },
  statLabel: {
    color: '#49454F',
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listFooter: {
    height: 80,
  },
  gearCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  gearContent: {
    flex: 1,
  },
  deleteGearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E7E0EC',
    gap: 6,
  },
  deleteGearText: {
    color: '#B3261E',
    fontWeight: '500',
  },
  gearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#C8E6C9',
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
    color: '#1C1B1F',
    fontWeight: '500',
    marginBottom: 2,
  },
  gearCategory: {
    color: '#49454F',
    marginBottom: 4,
  },
  manufacturerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  gearManufacturer: {
    color: '#79747E',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    color: '#1976D2',
  },
  moreTags: {
    color: '#79747E',
    paddingVertical: 4,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  gearWeight: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  descriptionDivider: {
    marginVertical: 12,
  },
  gearDescription: {
    color: '#49454F',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 60,
    alignItems: 'center',
    margin: 16,
  },
  emptyTitle: {
    color: '#1C1B1F',
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#49454F',
    marginTop: 8,
    textAlign: 'center',
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    color: '#1C1B1F',
    fontWeight: '500',
    marginBottom: 6,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  templateCategoryBadge: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  templateCategoryText: {
    color: '#1B5E20',
    fontWeight: '500',
  },
  templateStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateStatText: {
    color: '#49454F',
  },
  templateStatWeight: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  templateDivider: {
    marginVertical: 12,
  },
  templateDescription: {
    color: '#49454F',
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
});

export default GearScreen;
