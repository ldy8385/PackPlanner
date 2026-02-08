import React, {useState, useMemo} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {
  Text,
  Button,
  Chip,
  IconButton,
  Checkbox,
  Surface,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Gear, GearCategory} from '../types';
import {gearCategories} from '../data/mockData';

interface GearSelectScreenProps {
  gears: Gear[];
  selectedGearIds: string[];
  onSave: (selectedGearIds: string[]) => void;
  onCancel: () => void;
}

const GearSelectScreen: React.FC<GearSelectScreenProps> = ({
  gears,
  selectedGearIds: initialSelectedIds,
  onSave,
  onCancel,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [selectedCategory, setSelectedCategory] = useState<GearCategory | null>(
    null,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>(
    [],
  );

  // 모든 태그 추출
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    gears.forEach(gear => {
      gear.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [gears]);

  // 모든 제조사 추출
  const allManufacturers = useMemo(() => {
    const manufacturerSet = new Set<string>();
    gears.forEach(gear => {
      if (gear.manufacturer) {
        manufacturerSet.add(gear.manufacturer);
      }
    });
    return Array.from(manufacturerSet).sort();
  }, [gears]);

  // 필터링된 장비 목록
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

  // 선택된 장비들
  const selectedGears = gears.filter(g => selectedIds.includes(g.id));
  const totalSelectedWeight = selectedGears.reduce(
    (sum, gear) => sum + gear.weight,
    0,
  );

  const toggleGearSelection = (gearId: string) => {
    if (selectedIds.includes(gearId)) {
      setSelectedIds(selectedIds.filter(id => id !== gearId));
    } else {
      setSelectedIds([...selectedIds, gearId]);
    }
  };

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

  const renderGearItem = ({item}: {item: Gear}) => {
    const isSelected = selectedIds.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.gearCard, isSelected && styles.gearCardSelected]}
        onPress={() => toggleGearSelection(item.id)}>
        <View style={styles.gearHeader}>
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => toggleGearSelection(item.id)}
            color="#4CAF50"
          />
          <View style={styles.gearIcon}>
            <Icon
              name={getCategoryIcon(item.category)}
              size={24}
              color="#666"
            />
          </View>
          <View style={styles.gearInfo}>
            <Text variant="titleMedium" style={styles.gearName}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={styles.gearCategory}>
              {item.category}
            </Text>
            {item.manufacturer && (
              <View style={styles.manufacturerRow}>
                <Icon name="factory" size={12} color="#999" />
                <Text variant="bodySmall" style={styles.gearManufacturer}>
                  {item.manufacturer}
                </Text>
              </View>
            )}
            {item.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {item.tags.slice(0, 3).map((tag, index) => (
                  <Chip
                    key={index}
                    style={styles.tagChip}
                    textStyle={styles.tagText}>
                    {tag}
                  </Chip>
                ))}
                {item.tags.length > 3 && (
                  <Text variant="bodySmall" style={styles.moreTags}>
                    +{item.tags.length - 3}
                  </Text>
                )}
              </View>
            )}
          </View>
          <View style={styles.weightContainer}>
            <Icon name="weight-kilogram" size={16} color="#4CAF50" />
            <Text variant="bodyMedium" style={styles.gearWeight}>
              {item.weight}kg
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <IconButton icon="arrow-left" size={24} onPress={onCancel} />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          장비 선택
        </Text>
        <Button
          mode="contained"
          onPress={() => onSave(selectedIds)}
          style={styles.saveButton}
          buttonColor="#4CAF50">
          저장
        </Button>
      </Surface>

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
                  selectedTags.includes(tag) && styles.tagFilterChipSelected,
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

        <Surface style={styles.selectionInfo} elevation={1}>
          <View style={styles.selectionStat}>
            <Text variant="titleLarge" style={styles.selectionNumber}>
              {selectedIds.length}
            </Text>
            <Text variant="bodySmall" style={styles.selectionLabel}>
              선택된 장비
            </Text>
          </View>
          <View style={styles.selectionStat}>
            <Text variant="titleLarge" style={styles.selectionNumber}>
              {totalSelectedWeight.toFixed(1)}kg
            </Text>
            <Text variant="bodySmall" style={styles.selectionLabel}>
              총 무게
            </Text>
          </View>
        </Surface>
      </View>

      <ScrollView style={styles.listContainer}>
        {filteredGears.map(gear => (
          <View key={gear.id}>{renderGearItem({item: gear})}</View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    marginRight: 8,
  },
  fixedHeader: {
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  filterSection: {
    maxHeight: 70,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tagFilterSection: {
    maxHeight: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  manufacturerFilterSection: {
    maxHeight: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#E0E0E0',
  },
  filterChipSelected: {
    backgroundColor: '#4CAF50',
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  tagFilterChip: {
    marginRight: 8,
    backgroundColor: '#E0E0E0',
  },
  tagFilterChipSelected: {
    backgroundColor: '#2196F3',
  },
  tagFilterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  manufacturerFilterChip: {
    marginRight: 8,
    backgroundColor: '#E0E0E0',
  },
  manufacturerFilterChipSelected: {
    backgroundColor: '#FF9800',
  },
  manufacturerFilterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  selectionInfo: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectionStat: {
    alignItems: 'center',
    flex: 1,
  },
  selectionNumber: {
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  selectionLabel: {
    color: '#666',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  gearCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gearCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  gearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  gearIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gearInfo: {
    flex: 1,
  },
  gearName: {
    color: '#333',
    marginBottom: 4,
  },
  gearCategory: {
    color: '#666',
    marginBottom: 6,
  },
  manufacturerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  gearManufacturer: {
    color: '#999',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagChip: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#1976D2',
    lineHeight: 14,
  },
  moreTags: {
    color: '#999',
    marginLeft: 4,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  gearWeight: {
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
});

export default GearSelectScreen;
