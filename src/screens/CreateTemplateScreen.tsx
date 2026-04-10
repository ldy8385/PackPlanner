import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Text,
  Button,
  TextInput,
  IconButton,
  Surface,
  Divider,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gear, GearTemplate, PlanItem } from '../types';
import { useDialog } from '../contexts/DialogContext';
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

  const selectedGearsCount = selectedGears.length;
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
          />

          <TextInput
            mode="outlined"
            label={t('createTemplate.description')}
            placeholder={t('createTemplate.descriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          {/* Gear Selection Section */}
          <View style={styles.gearSection}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t('createTemplate.selectGear')}
            </Text>

            <Surface style={[styles.selectedInfo, { backgroundColor: theme.colors.surface }]} elevation={0}>
              <View style={styles.selectedStat}>
                <Icon name="package-variant" size={20} color={theme.colors.secondary} />
                <Text style={[styles.selectedStatText, { color: theme.colors.onSurfaceVariant }]}>
                  {selectedGearsCount} {t('gear.items')}
                </Text>
              </View>
              <View style={styles.selectedStat}>
                <Icon name="weight-kilogram" size={20} color={theme.colors.tertiary} />
                <Text style={[styles.selectedStatWeight, { color: theme.colors.tertiary }]}>
                  {Math.round(selectedGearsWeight)}g
                </Text>
              </View>
            </Surface>

            <Button
              mode="contained"
              icon="plus"
              onPress={() => setShowGearSelect(true)}
              style={[styles.selectGearButton, { backgroundColor: theme.colors.secondary }]}
              buttonColor={theme.colors.secondary}>
              {t('createTemplate.selectGear')}
            </Button>

            {/* Selected Gear List */}
            {selectedGears.length > 0 && (
              <Surface style={[styles.selectedGearsContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]} elevation={0}>
                <Text variant="bodyMedium" style={[styles.selectedGearsTitle, { color: theme.colors.onSurfaceVariant }]}>
                  {t('createTemplate.selectedItems')}
                </Text>
                {selectedGears.map(gear => (
                  <View key={gear.id} style={[styles.selectedGearItem, { borderBottomColor: theme.colors.outlineVariant }]}>
                    <View style={styles.selectedGearInfo}>
                      <Text style={[styles.selectedGearName, { color: theme.colors.onSurface }]}>{gear.name}</Text>
                      <Text style={[styles.selectedGearDetail, { color: theme.colors.onSurfaceVariant }]}>
                        {t(`gearCategory.${gear.category}`)} · {gear.weight}g
                      </Text>
                    </View>
                    <IconButton
                      icon="close"
                      size={20}
                      iconColor={theme.colors.error}
                      onPress={() => {
                        setSelectedGearIds(
                          selectedGearIds.filter(id => id !== gear.id),
                        );
                      }}
                    />
                  </View>
                ))}
              </Surface>
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={[styles.cancelButton, { borderColor: theme.colors.outline }]}
            textColor={theme.colors.onSurfaceVariant}>
            {t('common.cancel')}
          </Button>
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
    marginBottom: 16,
  },
  divider: {
    marginVertical: 24,
    height: 1,
  },
  gearSection: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  selectedInfo: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  selectedStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedStatText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedStatWeight: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectGearButton: {
    marginBottom: 16,
    borderRadius: 12,
  },
  selectedGearsContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  selectedGearsTitle: {
    marginBottom: 12,
    fontWeight: '500',
  },
  selectedGearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  selectedGearInfo: {
    flex: 1,
  },
  selectedGearName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedGearDetail: {
    fontSize: 14,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  cancelButton: {
    width: '100%',
    borderRadius: 12,
  },
});

export default CreateTemplateScreen;
