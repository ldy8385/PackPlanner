import React, { useState, useMemo } from 'react';
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
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Gear, GearTemplate, GearCategory } from '../types';
import { getManufacturerName } from '../data/mockData';

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
  const theme = useTheme();
  const { i18n } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GearTemplate | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<GearTemplate | null>(
    null,
  );

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedGearIds: [] as string[],
  });

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

    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [templates, searchQuery]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
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
            gearIds: formData.selectedGearIds,
            updatedAt: now,
            createdAt: t.createdAt,
          }
          : t,
      );
      onUpdateTemplates(updatedTemplates);
    } else {
      const newTemplate: GearTemplate = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
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

  const renderTemplateItem = ({ item }: { item: GearTemplate }) => {
    const stats = getTemplateStats(item);

    return (
      <Card style={[styles.templateCard, { backgroundColor: theme.colors.surface }]} mode="elevated" elevation={1}>
        <Card.Content>
          <View style={styles.templateHeader}>
            <Surface style={[styles.templateIcon, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
              <Icon
                name="file-document-outline"
                size={28}
                color={theme.colors.primary}
              />
            </Surface>
            <View style={styles.templateInfo}>
              <Text variant="titleMedium" style={[styles.templateName, { color: theme.colors.onSurface }]}>
                {item.name}
              </Text>
              <View style={styles.templateMeta}>
                <View style={styles.statItem}>
                  <Icon name="package-variant" size={14} color={theme.colors.outline} />
                  <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                    {stats.count} items
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="weight-kilogram" size={14} color={theme.colors.tertiary} />
                  <Text variant="bodySmall" style={{ color: theme.colors.tertiary, fontWeight: '600' }}>
                    {Math.round(stats.weight)}g
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {item.description && (
            <Text variant="bodySmall" style={[styles.templateDescription, { color: theme.colors.onSurfaceVariant }]}>
              {item.description}
            </Text>
          )}
          <View style={[styles.templateActions, { borderTopColor: theme.colors.outlineVariant }]}>
            <Button
              mode="text"
              onPress={() => openEditModal(item)}
              icon="pencil"
              textColor={theme.colors.primary}
              compact>
              Edit
            </Button>
            <Button
              mode="text"
              onPress={() => confirmDelete(item)}
              icon="delete"
              textColor={theme.colors.error}
              compact>
              Delete
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const selectedGearsCount = formData.selectedGearIds.length;
  const selectedGearsWeight = useMemo(() => {
    return gears
      .filter(g => formData.selectedGearIds.includes(g.id))
      .reduce((sum, g) => sum + g.weight, 0);
  }, [gears, formData.selectedGearIds]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Gear Templates
        </Text>
      </Surface>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search templates..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          placeholderTextColor={theme.colors.outline}
          left={<TextInput.Icon icon="magnify" color={theme.colors.outline} />}
          right={
            searchQuery ? (
              <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} color={theme.colors.outline} />
            ) : undefined
          }
        />
      </View>

      <View style={[styles.statsContainer, { backgroundColor: theme.colors.background }]}>
        <Surface style={[styles.statBox, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <Text variant="displaySmall" style={[styles.statNumber, { color: theme.colors.primary }]}>
            {filteredTemplates.length}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
            Templates
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
            <Icon name="folder-open-outline" size={64} color={theme.colors.outlineVariant} />
            <Text variant="titleMedium" style={[styles.emptyStateText, { color: theme.colors.onSurface }]}>
              No templates found
            </Text>
            <Text variant="bodyMedium" style={[styles.emptyStateSubtext, { color: theme.colors.onSurfaceVariant }]}>
              Tap the + button to create a new template.
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={openAddModal}
        color={theme.colors.onPrimary}
      />

      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => {
            resetForm();
            setIsModalVisible(false);
          }}
          contentContainerStyle={[styles.modalContainer, { maxHeight: '90%' }]}>
          <Surface style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: 16 }]} elevation={5}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                {isEditMode ? 'Edit Template' : 'New Template'}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => {
                  resetForm();
                  setIsModalVisible(false);
                }}
                iconColor={theme.colors.onSurface}
              />
            </View>

            <ScrollView style={styles.modalScroll}>
              <TextInput
                label="Template Name *"
                placeholder="e.g., Backpacking Essentials"
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                mode="outlined"
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
              />

              <TextInput
                label="Description"
                placeholder="Describe this template..."
                value={formData.description}
                onChangeText={text =>
                  setFormData({ ...formData, description: text })
                }
                multiline
                numberOfLines={2}
                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                mode="outlined"
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
              />

              <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Select Gear
              </Text>
              <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Select items to include ({selectedGearsCount} items, {Math.round(selectedGearsWeight)}g)
              </Text>

              {gears.length === 0 ? (
                <View style={[styles.noGearWarning, { backgroundColor: theme.colors.errorContainer }]}>
                  <Icon name="alert-circle-outline" size={24} color={theme.colors.error} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer, flex: 1 }}>
                    No gears found. Please add gears first.
                  </Text>
                </View>
              ) : (
                <View style={styles.gearListContainer}>
                  {gears.map(gear => {
                    const isSelected = formData.selectedGearIds.includes(
                      gear.id,
                    );
                    return (
                      <Surface
                        key={gear.id}
                        style={[
                          styles.gearSelectionItem,
                          { backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surface },
                          isSelected ? { borderColor: theme.colors.primary, borderWidth: 1 } : { borderColor: theme.colors.outlineVariant, borderWidth: 1 }
                        ]}
                        elevation={0}>
                        <List.Item
                          title={gear.name}
                          titleStyle={{ color: theme.colors.onSurface, fontWeight: isSelected ? '600' : '400' }}
                          description={`${getManufacturerName(gear.manufacturer, i18n.language) || 'No Brand'} · ${gear.weight}g`}
                          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                          left={() => (
                            <View style={styles.gearSelectionLeft}>
                              <Checkbox
                                status={isSelected ? 'checked' : 'unchecked'}
                                onPress={() => toggleGearSelection(gear.id)}
                                color={theme.colors.primary}
                                uncheckedColor={theme.colors.outline}
                              />
                              <View style={[styles.gearIconSmall, { backgroundColor: theme.colors.surfaceVariant }]}>
                                <Icon
                                  name={getGearCategoryIcon(gear.category)}
                                  size={18}
                                  color={theme.colors.onSurfaceVariant}
                                />
                              </View>
                            </View>
                          )}
                          onPress={() => toggleGearSelection(gear.id)}
                        />
                      </Surface>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
              <Surface style={[styles.selectionSummary, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
                <Icon name="package-variant" size={18} color={theme.colors.onSecondaryContainer} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                  {selectedGearsCount} items
                </Text>
                <Text variant="bodyMedium" style={[styles.summaryDivider, { color: theme.colors.onSecondaryContainer }]}>
                  ·
                </Text>
                <Icon name="weight-kilogram" size={18} color={theme.colors.onSecondaryContainer} />
                <Text variant="bodyMedium" style={[styles.summaryWeightText, { color: theme.colors.onSecondaryContainer }]}>
                  {Math.round(selectedGearsWeight)}g
                </Text>
              </Surface>
              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    resetForm();
                    setIsModalVisible(false);
                  }}
                  style={[styles.modalButton, { borderColor: theme.colors.outline }]}
                  contentStyle={{ height: 56 }}
                  textColor={theme.colors.onSurface}>
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={saveTemplate}
                  style={styles.modalButton}
                  contentStyle={{ height: 56 }}
                  disabled={!formData.name.trim()}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}>
                  {isEditMode ? 'Update' : 'Create'}
                </Button>
              </View>
            </View>
          </Surface>
        </Modal>

        <Modal
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          contentContainerStyle={styles.deleteModalContainer}>
          <Surface style={[styles.deleteModalContent, { backgroundColor: theme.colors.surface }]} elevation={5}>
            <Icon name="alert-circle-outline" size={48} color={theme.colors.error} />
            <Text variant="titleMedium" style={[styles.deleteModalTitle, { color: theme.colors.onSurface }]}>
              Delete Template
            </Text>
            <Text variant="bodyMedium" style={[styles.deleteModalText, { color: theme.colors.onSurfaceVariant }]}>
              Are you sure you want to delete '{templateToDelete?.name}'?
            </Text>
            <Text variant="bodySmall" style={[styles.deleteModalSubtext, { color: theme.colors.onSurfaceVariant }]}>
              This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <Button
                mode="outlined"
                onPress={() => setDeleteConfirmVisible(false)}
                style={styles.deleteModalButton}
                contentStyle={{ height: 56 }}
                textColor={theme.colors.onSurface}
                theme={{ colors: { primary: theme.colors.outline } }}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={deleteTemplate}
                buttonColor={theme.colors.error}
                style={styles.deleteModalButton}
                contentStyle={{ height: 56 }}>
                Delete
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  searchContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchInput: {
    borderRadius: 8,
  },
  categoryFilter: {
    maxHeight: 60,
    borderBottomWidth: 1,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    marginRight: 0,
    height: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    opacity: 0.8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  templateCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
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
    height: 24,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statWeightText: {
    fontWeight: '600',
  },
  templateDescription: {
    marginBottom: 12,
    lineHeight: 20,
  },
  templateActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
  },
  emptyStateText: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  modalContainer: {
    margin: 20,
    justifyContent: 'center',
  },
  modalContent: {
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    marginTop: 8,
    marginBottom: 8,
  },
  existingCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  existingCategoryChip: {
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 4,
    fontWeight: '600',
  },
  sectionSubtitle: {
    marginBottom: 16,
  },
  noGearWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  gearListContainer: {
    marginTop: 8,
    gap: 8,
  },
  gearSelectionItem: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gearSelectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gearIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  summaryDivider: {
    marginHorizontal: 4,
  },
  summaryWeightText: {
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
  },
  deleteModalContainer: {
    padding: 24,
  },
  deleteModalContent: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  deleteModalTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  deleteModalText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  deleteModalSubtext: {
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    borderRadius: 12,
  },
});

export default GearTemplateScreen;
