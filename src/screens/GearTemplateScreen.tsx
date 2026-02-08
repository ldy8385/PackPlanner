import React, {useState, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  Chip,
  IconButton,
  Modal,
  Portal,
  FAB,
  List,
  Surface,
  Divider,
  Checkbox,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Gear, GearTemplate, GearCategory} from '../types';

interface GearTemplateScreenProps {
  templates: GearTemplate[];
  gears: Gear[];
  onUpdateTemplates: (templates: GearTemplate[]) => void;
}

const GearTemplateScreen: React.FC<GearTemplateScreenProps> = ({
  templates,
  gears,
  onUpdateTemplates,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GearTemplate | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<GearTemplate | null>(
    null,
  );

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    selectedGearIds: [] as string[],
  });

  const templateCategories = useMemo(() => {
    const categories = new Set<string>();
    templates.forEach(t => {
      if (t.category) {
        categories.add(t.category);
      }
    });
    return Array.from(categories).sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query)),
      );
    }

    if (selectedCategory) {
      result = result.filter(t => t.category === selectedCategory);
    }

    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [templates, searchQuery, selectedCategory]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      selectedGearIds: [],
    });
    setIsEditMode(false);
    setEditingTemplate(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalVisible(true);
  };

  const openEditModal = (template: GearTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      selectedGearIds: [...template.gearIds],
    });
    setIsEditMode(true);
    setIsModalVisible(true);
  };

  const saveTemplate = () => {
    if (!formData.name.trim()) {
      return;
    }

    const now = new Date();

    if (isEditMode && editingTemplate) {
      const updatedTemplates = templates.map(t =>
        t.id === editingTemplate.id
          ? {
              ...t,
              name: formData.name.trim(),
              description: formData.description.trim() || undefined,
              category: formData.category.trim() || '기타',
              gearIds: formData.selectedGearIds,
              updatedAt: now,
            }
          : t,
      );
      onUpdateTemplates(updatedTemplates);
    } else {
      const newTemplate: GearTemplate = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || '기타',
        gearIds: formData.selectedGearIds,
        createdAt: now,
        updatedAt: now,
      };
      onUpdateTemplates([...templates, newTemplate]);
    }

    resetForm();
    setIsModalVisible(false);
  };

  const confirmDelete = (template: GearTemplate) => {
    setTemplateToDelete(template);
    setDeleteConfirmVisible(true);
  };

  const deleteTemplate = () => {
    if (templateToDelete) {
      onUpdateTemplates(templates.filter(t => t.id !== templateToDelete.id));
      setTemplateToDelete(null);
      setDeleteConfirmVisible(false);
    }
  };

  const toggleGearSelection = (gearId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGearIds: prev.selectedGearIds.includes(gearId)
        ? prev.selectedGearIds.filter(id => id !== gearId)
        : [...prev.selectedGearIds, gearId],
    }));
  };

  const getTemplateStats = (template: GearTemplate) => {
    const templateGears = gears.filter(g => template.gearIds.includes(g.id));
    const totalWeight = templateGears.reduce((sum, g) => sum + g.weight, 0);
    return {
      count: templateGears.length,
      weight: totalWeight,
    };
  };

  const getGearCategoryIcon = (category: GearCategory): string => {
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

  const getTemplateCategoryIcon = (category: string): string => {
    const iconMap: {[key: string]: string} = {
      백패킹: 'hiking',
      오토캠핑: 'car',
      모토캠핑: 'motorbike',
      가족캠핑: 'account-group',
      솔로캠핑: 'account',
      '2인캠핑': 'account-multiple',
      겨울캠핑: 'snowflake',
      여름캠핑: 'weather-sunny',
      기타: 'dots-horizontal',
    };
    return iconMap[category] || 'folder-outline';
  };

  const renderTemplateItem = ({item}: {item: GearTemplate}) => {
    const stats = getTemplateStats(item);

    return (
      <Card style={styles.templateCard}>
        <Card.Content>
          <View style={styles.templateHeader}>
            <Surface style={styles.templateIcon} elevation={1}>
              <Icon
                name={getTemplateCategoryIcon(item.category)}
                size={28}
                color="#666"
              />
            </Surface>
            <View style={styles.templateInfo}>
              <Text variant="titleMedium" style={styles.templateName}>
                {item.name}
              </Text>
              <View style={styles.templateMeta}>
                <Chip
                  style={styles.categoryChip}
                  textStyle={styles.categoryChipText}>
                  {item.category}
                </Chip>
                <View style={styles.statItem}>
                  <Icon name="package-variant" size={14} color="#666" />
                  <Text variant="bodySmall" style={styles.statText}>
                    {stats.count}개
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="weight-kilogram" size={14} color="#4CAF50" />
                  <Text variant="bodySmall" style={styles.statWeightText}>
                    {stats.weight.toFixed(1)}kg
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {item.description && (
            <Text variant="bodySmall" style={styles.templateDescription}>
              {item.description}
            </Text>
          )}
          <View style={styles.templateActions}>
            <Button
              mode="text"
              onPress={() => openEditModal(item)}
              icon="pencil"
              compact>
              수정
            </Button>
            <Button
              mode="text"
              onPress={() => confirmDelete(item)}
              icon="delete"
              textColor="#F44336"
              compact>
              삭제
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderGearSelectionItem = ({item}: {item: Gear}) => {
    const isSelected = formData.selectedGearIds.includes(item.id);

    return (
      <List.Item
        title={item.name}
        description={`${item.manufacturer || '제조사 없음'} · ${
          item.weight
        }kg · ${item.category}`}
        left={props => (
          <View style={styles.gearSelectionLeft}>
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => toggleGearSelection(item.id)}
            />
            <Surface style={styles.gearIcon} elevation={1}>
              <Icon
                name={getGearCategoryIcon(item.category)}
                size={20}
                color="#666"
              />
            </Surface>
          </View>
        )}
        onPress={() => toggleGearSelection(item.id)}
        style={[
          styles.gearSelectionItem,
          isSelected && styles.gearSelectionItemSelected,
        ]}
      />
    );
  };

  const selectedGearsCount = formData.selectedGearIds.length;
  const selectedGearsWeight = useMemo(() => {
    return gears
      .filter(g => formData.selectedGearIds.includes(g.id))
      .reduce((sum, g) => sum + g.weight, 0);
  }, [gears, formData.selectedGearIds]);

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          장비 템플릿
        </Text>
      </Surface>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="템플릿 검색..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
          right={
            searchQuery ? (
              <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} />
            ) : undefined
          }
        />
      </View>

      {templateCategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}>
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
          {templateCategories.map(category => (
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
              icon={getTemplateCategoryIcon(category)}>
              {category}
            </Chip>
          ))}
        </ScrollView>
      )}

      <View style={styles.statsContainer}>
        <Surface style={styles.statBox} elevation={1}>
          <Text variant="titleLarge" style={styles.statNumber}>
            {filteredTemplates.length}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            템플릿 수
          </Text>
        </Surface>
        <Surface style={styles.statBox} elevation={1}>
          <Text variant="titleLarge" style={styles.statNumber}>
            {templateCategories.length}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            카테고리
          </Text>
        </Surface>
      </View>

      <FlatList
        data={filteredTemplates}
        keyExtractor={item => item.id}
        renderItem={renderTemplateItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="folder-open-outline" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyStateText}>
              등록된 템플릿이 없습니다.
            </Text>
            <Text variant="bodyMedium" style={styles.emptyStateSubtext}>
              + 버튼을 눌러 새 템플릿을 추가해보세요.
            </Text>
          </View>
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={openAddModal} color="#fff" />

      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => {
            resetForm();
            setIsModalVisible(false);
          }}
          contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge">
                {isEditMode ? '템플릿 수정' : '새 템플릿 추가'}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => {
                  resetForm();
                  setIsModalVisible(false);
                }}
              />
            </View>

            <ScrollView style={styles.modalScroll}>
              <TextInput
                label="템플릿 이름 *"
                placeholder="예: 백패킹 필수 장비 세트"
                value={formData.name}
                onChangeText={text => setFormData({...formData, name: text})}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="설명"
                placeholder="템플릿에 대한 설명을 입력하세요"
                value={formData.description}
                onChangeText={text =>
                  setFormData({...formData, description: text})
                }
                multiline
                numberOfLines={2}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="카테고리"
                placeholder="예: 백패킹, 오토캠핑, 가족캠핑"
                value={formData.category}
                onChangeText={text =>
                  setFormData({...formData, category: text})
                }
                style={styles.input}
                mode="outlined"
                left={<TextInput.Icon icon="folder-outline" />}
              />

              {templateCategories.length > 0 && (
                <>
                  <Text variant="bodyMedium" style={styles.inputLabel}>
                    기존 카테고리
                  </Text>
                  <View style={styles.existingCategoriesContainer}>
                    {templateCategories
                      .filter(c => c !== formData.category)
                      .map((category, index) => (
                        <Chip
                          key={index}
                          onPress={() => setFormData({...formData, category})}
                          style={styles.existingCategoryChip}
                          icon={getTemplateCategoryIcon(category)}>
                          {category}
                        </Chip>
                      ))}
                  </View>
                </>
              )}

              <Divider style={styles.divider} />

              <Text variant="titleMedium" style={styles.sectionTitle}>
                장비 선택
              </Text>
              <Text variant="bodySmall" style={styles.sectionSubtitle}>
                템플릿에 포함할 장비를 선택하세요 ({selectedGearsCount}개
                선택됨, {selectedGearsWeight.toFixed(1)}kg)
              </Text>

              {gears.length === 0 ? (
                <View style={styles.noGearWarning}>
                  <Icon name="alert-circle-outline" size={24} color="#FF9800" />
                  <Text variant="bodyMedium" style={styles.noGearText}>
                    등록된 장비가 없습니다. 먼저 장비를 등록해주세요.
                  </Text>
                </View>
              ) : (
                <View style={styles.gearListContainer}>
                  {gears.map(gear => {
                    const isSelected = formData.selectedGearIds.includes(
                      gear.id,
                    );
                    return (
                      <List.Item
                        key={gear.id}
                        title={gear.name}
                        description={`${gear.manufacturer || '제조사 없음'} · ${
                          gear.weight
                        }kg`}
                        left={() => (
                          <View style={styles.gearSelectionLeft}>
                            <Checkbox
                              status={isSelected ? 'checked' : 'unchecked'}
                              onPress={() => toggleGearSelection(gear.id)}
                            />
                            <Surface style={styles.gearIconSmall} elevation={1}>
                              <Icon
                                name={getGearCategoryIcon(gear.category)}
                                size={18}
                                color="#666"
                              />
                            </Surface>
                          </View>
                        )}
                        onPress={() => toggleGearSelection(gear.id)}
                        style={[
                          styles.gearSelectionItem,
                          isSelected && styles.gearSelectionItemSelected,
                        ]}
                      />
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.selectionSummary}>
                <Icon name="package-variant" size={18} color="#666" />
                <Text variant="bodyMedium" style={styles.summaryText}>
                  {selectedGearsCount}개 장비
                </Text>
                <Text variant="bodyMedium" style={styles.summaryDivider}>
                  ·
                </Text>
                <Icon name="weight-kilogram" size={18} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.summaryWeightText}>
                  {selectedGearsWeight.toFixed(1)}kg
                </Text>
              </View>
              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    resetForm();
                    setIsModalVisible(false);
                  }}
                  style={styles.modalButton}>
                  취소
                </Button>
                <Button
                  mode="contained"
                  onPress={saveTemplate}
                  style={styles.modalButton}
                  disabled={!formData.name.trim()}
                  buttonColor="#4CAF50">
                  {isEditMode ? '수정' : '추가'}
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          contentContainerStyle={styles.deleteModalContainer}>
          <View style={styles.deleteModalContent}>
            <Icon name="alert-circle-outline" size={48} color="#F44336" />
            <Text variant="titleMedium" style={styles.deleteModalTitle}>
              템플릿 삭제
            </Text>
            <Text variant="bodyMedium" style={styles.deleteModalText}>
              '{templateToDelete?.name}' 템플릿을 삭제하시겠습니까?
            </Text>
            <Text variant="bodySmall" style={styles.deleteModalSubtext}>
              이 작업은 되돌릴 수 없습니다.
            </Text>
            <View style={styles.deleteModalButtons}>
              <Button
                mode="outlined"
                onPress={() => setDeleteConfirmVisible(false)}
                style={styles.deleteModalButton}>
                취소
              </Button>
              <Button
                mode="contained"
                onPress={deleteTemplate}
                buttonColor="#F44336"
                style={styles.deleteModalButton}>
                삭제
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
  },
  categoryFilter: {
    maxHeight: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryFilterContent: {
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  templateCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    color: '#333',
    marginBottom: 6,
    fontWeight: '600',
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  categoryChipText: {
    fontSize: 12,
    color: '#4CAF50',
    lineHeight: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#666',
  },
  statWeightText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  templateDescription: {
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  templateActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
  },
  emptyStateText: {
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  modalContainer: {
    flex: 1,
    margin: 20,
    maxHeight: '90%',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  inputLabel: {
    marginTop: 8,
    marginBottom: 8,
    color: '#666',
  },
  existingCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  existingCategoryChip: {
    backgroundColor: '#f5f5f5',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 4,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: '#666',
    marginBottom: 12,
  },
  noGearWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  noGearText: {
    color: '#E65100',
    flex: 1,
  },
  gearListContainer: {
    marginTop: 8,
  },
  gearSelectionItem: {
    paddingLeft: 0,
    borderRadius: 8,
    marginBottom: 4,
  },
  gearSelectionItemSelected: {
    backgroundColor: '#E8F5E9',
  },
  gearSelectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gearIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  summaryText: {
    color: '#666',
  },
  summaryDivider: {
    color: '#999',
    marginHorizontal: 4,
  },
  summaryWeightText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  deleteModalContainer: {
    margin: 40,
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  deleteModalTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
  },
  deleteModalText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  deleteModalSubtext: {
    color: '#999',
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
  },
});

export default GearTemplateScreen;
