import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Text,
  Button,
  TextInput,
  IconButton,
  Surface,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gear, GearTemplate, PlanItem } from '../types';
import { useDialog } from '../contexts/DialogContext';
import { getCategoryIcon } from '../utils/gearHierarchy';
import GearSelectScreen from './GearSelectScreen';

interface CreateTemplateScreenProps {
  gears: Gear[];
  onSave: (template: GearTemplate) => void;
  onCancel: () => void;
  editingTemplate?: GearTemplate | null;
}

const CreateTemplateScreen: React.FC<CreateTemplateScreenProps> = ({
  gears,
  onSave,
  onCancel,
  editingTemplate,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showAlert } = useDialog();
  const isEditMode = !!editingTemplate;

  const [name, setName] = useState(editingTemplate?.name || '');
  const [description, setDescription] = useState(
    editingTemplate?.description || '',
  );
  const [selectedGearIds, setSelectedGearIds] = useState<string[]>(
    editingTemplate?.gearIds || [],
  );
  const [templateItems, setTemplateItems] = useState<PlanItem[]>(
    editingTemplate?.items || [],
  );
  const [showGearSelect, setShowGearSelect] = useState(false);

  const selectedGears = useMemo(() => {
    return gears.filter(g => selectedGearIds.includes(g.id));
  }, [gears, selectedGearIds]);

  const selectedGearsWeight = selectedGears.reduce(
    (sum, gear) => sum + gear.weight,
    0,
  );

  const handleSave = () => {
    if (!name.trim()) {
      showAlert({
        title: t('common.error'),
        message: t('createTemplate.errorName'),
        icon: 'error',
        confirmText: t('common.confirm'),
      });
      return;
    }

    if (selectedGearIds.length === 0) {
      showAlert({
        title: t('common.error'),
        message: t('createTemplate.errorGear'),
        icon: 'error',
        confirmText: t('common.confirm'),
      });
      return;
    }

    const template: GearTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      gearIds: selectedGearIds,
      items: templateItems.length > 0 ? templateItems : undefined,
      createdAt: editingTemplate?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(template);
  };

  const handleGearSelect = (gearIds: string[], items?: PlanItem[]) => {
    setSelectedGearIds(gearIds);
    setTemplateItems(items || []);
    setShowGearSelect(false);
  };

  if (showGearSelect) {
    return (
      <GearSelectScreen
        gears={gears}
        selectedItems={templateItems.length > 0 ? templateItems : undefined}
        selectedGearIds={templateItems.length > 0 ? undefined : selectedGearIds}
        onSave={handleGearSelect}
        onCancel={() => setShowGearSelect(false)}
      />
    );
  }

  // 계층 구조 렌더링
  const renderItemTree = (items: PlanItem[], depth: number = 0): React.ReactNode => {
    return items.map(item => {
      const gear = item.gear || gears.find(g => g.id === item.gearId);
      if (!gear) return null;
      const hasChildren = item.children && item.children.length > 0;

      return (
        <View key={item.id}>
          <View style={[styles.treeItem, { paddingLeft: 12 + depth * 20 }]}>
            {depth > 0 && (
              <View style={[styles.depthLine, { left: depth * 20, backgroundColor: theme.colors.outlineVariant }]} />
            )}
            <Icon name={getCategoryIcon(gear.category)} size={18} color={theme.colors.primary} />
            <View style={styles.treeItemInfo}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{gear.name}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                {t(`gearCategory.${gear.category}`)} · {gear.weight}g
                {hasChildren ? ` · ${item.children?.length} ${t('plan.gearCount')}` : ''}
              </Text>
            </View>
          </View>
          {hasChildren && renderItemTree(item.children!, depth + 1)}
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <IconButton icon="arrow-left" size={24} onPress={onCancel} iconColor={theme.colors.onSurface} />
        <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {isEditMode ? t('createTemplate.editTemplate') : t('createTemplate.newTemplate')}
        </Text>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!name.trim() || selectedGearIds.length === 0}
          style={styles.saveHeaderButton}
          buttonColor={theme.colors.primary}>
          {t('common.save')}
        </Button>
      </Surface>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <TextInput
            mode="outlined"
            label={t('createTemplate.templateName')}
            placeholder={t('createTemplate.templateNamePlaceholder')}
            value={name}
            onChangeText={setName}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            outlineStyle={{ borderRadius: 12 }}
          />

          <TextInput
            mode="outlined"
            label={t('createTemplate.description')}
            placeholder={t('createTemplate.descriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.memoInput, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            outlineStyle={{ borderRadius: 12 }}
          />

          {/* Gear Section */}
          <View style={styles.gearSection}>
            <View style={styles.gearSectionHeader}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                {t('createTemplate.selectGear')}
              </Text>
              <View style={styles.statBadges}>
                <View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>
                    {selectedGearIds.length} {t('gear.items')}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>
                    {selectedGearsWeight > 0 ? `${(selectedGearsWeight / 1000).toFixed(1)}kg` : '-'}
                  </Text>
                </View>
              </View>
            </View>

            <Button
              mode="contained-tonal"
              icon="pencil"
              onPress={() => setShowGearSelect(true)}
              style={styles.selectGearButton}
              buttonColor={theme.colors.primaryContainer}
              textColor={theme.colors.primary}>
              {t('createTemplate.selectGear')}
            </Button>

            {/* Selected Gear Tree */}
            {templateItems.length > 0 ? (
              <Surface style={[styles.treeContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]} elevation={0}>
                {renderItemTree(templateItems)}
              </Surface>
            ) : selectedGears.length > 0 ? (
              <Surface style={[styles.treeContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]} elevation={0}>
                {selectedGears.map(gear => (
                  <View key={gear.id} style={[styles.treeItem, { paddingLeft: 12 }]}>
                    <Icon name={getCategoryIcon(gear.category)} size={18} color={theme.colors.primary} />
                    <View style={styles.treeItemInfo}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{gear.name}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                        {t(`gearCategory.${gear.category}`)} · {gear.weight}g
                      </Text>
                    </View>
                  </View>
                ))}
              </Surface>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerTitle: {
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  saveHeaderButton: {
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  input: {
    marginBottom: 12,
  },
  memoInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  gearSection: {
    marginTop: 16,
  },
  gearSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  selectGearButton: {
    marginBottom: 16,
    borderRadius: 12,
  },
  treeContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  treeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 12,
    gap: 10,
  },
  treeItemInfo: {
    flex: 1,
  },
  depthLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
  },
});

export default CreateTemplateScreen;
