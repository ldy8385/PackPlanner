import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Text, Button, TextInput, Chip, IconButton, useTheme, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Gear, GearCategory } from '../types';
import { gearCategories, manufacturers, getManufacturerName } from '../data/mockData';
import ManufacturerSelectDrawer from '../components/ManufacturerSelectDrawer';
import CategorySelectDrawer from '../components/CategorySelectDrawer';

interface CreateGearScreenProps {
  onSave: (gear: Gear) => void;
  onCancel: () => void;
  editingGear?: Gear | null;
  tags?: string[];
}

const CreateGearScreen: React.FC<CreateGearScreenProps> = ({
  onSave,
  onCancel,
  editingGear,
  tags: availableTags = [],
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isEditMode = !!editingGear;

  const [name, setName] = useState(editingGear?.name || '');
  const [category, setCategory] = useState<GearCategory | null>(
    editingGear?.category || null,
  );
  const [weight, setWeight] = useState(
    editingGear?.weight ? editingGear.weight.toString() : '',
  );
  const [manufacturer, setManufacturer] = useState(
    editingGear?.manufacturer || '',
  );
  const [description, setDescription] = useState(
    editingGear?.description || '',
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(editingGear?.tags || []);
  const [showManufacturerDrawer, setShowManufacturerDrawer] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(
    editingGear?.imageUrl || null,
  );
  const [container, setContainer] = useState<boolean>(
    editingGear?.container ??
    (editingGear?.category === GearCategory.BAG ||
      editingGear?.category === GearCategory.POUCH),
  );
  const [quantity, setQuantity] = useState<string>(
    editingGear?.quantity?.toString() || '1',
  );

  // Autocomplete 상태
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [inputLayout, setInputLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // 카테고리 변경 시 container 자동 설정 (배낭/파우치는 기본 true)
  useEffect(() => {
    if (!isEditMode && category) {
      const shouldBeContainer =
        category === GearCategory.BAG || category === GearCategory.POUCH;
      setContainer(shouldBeContainer);
    }
  }, [category, isEditMode]);

  // 태그 검색어 필터링
  const filteredTags = useMemo(() => {
    if (!tagInput.trim()) return [];
    return availableTags.filter(
      t =>
        t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t),
    );
  }, [tagInput, availableTags, tags]);

  // 입력창 레이아웃 측정
  const onTagInputLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setInputLayout({ x, y, width, height });
  };

  const getCategoryIcon = (cat: GearCategory): string => {
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
    return iconMap[cat] || 'package-variant';
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const selectTag = (t: string) => {
    if (!tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleSelectImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.7,
        selectionLimit: 1,
      },
      (response: any) => {
        if (response.assets && response.assets.length > 0) {
          const uri = response.assets[0].uri;
          if (uri) {
            setImageUri(uri);
          }
        }
      },
    );
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handleSave = () => {
    const gearName = name.trim();

    if (!gearName) {
      Alert.alert(t('common.error'), t('createGear.errorName'));
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 0) {
      Alert.alert(t('common.error'), t('createGear.errorWeight'));
      return;
    }

    if (!category) {
      Alert.alert(t('common.error'), t('createGear.errorCategory'));
      return;
    }

    const quantityNum = parseInt(quantity, 10) || 1;

    const newGear: Gear = {
      id: editingGear?.id || Date.now().toString(),
      name: gearName,
      category: category as GearCategory,
      weight: weightNum,
      manufacturer: manufacturer || undefined,
      description: description.trim() || undefined,
      tags,
      imageUrl: imageUri || undefined,
      container: container || undefined,
      quantity: quantityNum > 1 ? quantityNum : undefined, // 1보다 클 때만 저장
    };

    onSave(newGear);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <IconButton icon="arrow-left" size={24} onPress={onCancel} iconColor={theme.colors.onSurface} />
        <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {isEditMode ? t('createGear.editGear') : t('createGear.addNewGear')}
        </Text>
        <View style={{ width: 48 }} />
      </Surface>

      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none">
        <View style={styles.form}>
          <TextInput
            mode="outlined"
            label={t('createGear.gearName')}
            placeholder={t('createGear.gearNamePlaceholder')}
            value={name}
            onChangeText={setName}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />

          {/* Photo Selection */}
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('createGear.photo')}
          </Text>
          <TouchableOpacity
            style={[styles.imageContainer, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}
            onPress={handleSelectImage}
            activeOpacity={0.7}>
            {imageUri ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: imageUri || undefined }} style={styles.image} />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: theme.colors.surface }]}
                  onPress={handleRemoveImage}>
                  <Icon name="close-circle" size={24} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Icon name="camera-plus" size={40} color={theme.colors.outline} />
                <Text variant="bodyMedium" style={[styles.imagePlaceholderText, { color: theme.colors.outline }]}>
                  {t('createGear.addPhoto')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Category Selection */}
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('createGear.category')}
          </Text>
          <Surface style={[styles.selectorCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <TouchableOpacity
              style={styles.selectorTouchable}
              onPress={() => setShowCategoryDrawer(true)}>
              <View style={styles.selectorContent}>
                {category ? (
                  <View style={styles.selectedItem}>
                    <Icon name={getCategoryIcon(category)} size={24} color={theme.colors.primary} />
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
                      {t(`gearCategory.${category}`)}
                    </Text>
                  </View>
                ) : (
                  <Text variant="bodyLarge" style={{ color: theme.colors.outline }}>
                    {t('createGear.selectCategory')}
                  </Text>
                )}
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.outline} />
            </TouchableOpacity>
          </Surface>

          <TextInput
            mode="outlined"
            label={t('createGear.weight')}
            placeholder={t('createGear.weightPlaceholder')}
            value={weight}
            onChangeText={setWeight}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            keyboardType="decimal-pad"
            right={<TextInput.Affix text="kg" />}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />

          {/* Manufacturer Selection */}
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('createGear.manufacturer')}
          </Text>
          <Surface style={[styles.selectorCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <TouchableOpacity
              style={styles.selectorTouchable}
              onPress={() => setShowManufacturerDrawer(true)}>
              <View style={styles.selectorContent}>
                <Text variant="bodyLarge" style={{ color: manufacturer ? theme.colors.onSurface : theme.colors.outline, fontWeight: manufacturer ? '500' : '400' }}>
                  {manufacturer ? getManufacturerName(manufacturer, i18n.language) : t('createGear.selectManufacturer')}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.outline} />
            </TouchableOpacity>
          </Surface>

          {manufacturer && (
            <TouchableOpacity
              style={styles.clearManufacturer}
              onPress={() => setManufacturer('')}>
              <Text style={{ color: theme.colors.error }}>{t('createGear.clearSelection')}</Text>
            </TouchableOpacity>
          )}

          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('createGear.tagsLabel')}
          </Text>

          {/* Tag Input */}
          <View style={styles.autocompleteWrapper}>
            <View style={styles.tagInputContainer} onLayout={onTagInputLayout}>
              <TextInput
                mode="outlined"
                label={t('createGear.addTags')}
                placeholder={t('createGear.tagsPlaceholder')}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                value={tagInput}
                onChangeText={text => {
                  setTagInput(text);
                  setShowTagSuggestions(!!text.trim());
                }}
                onFocus={() => setShowTagSuggestions(!!tagInput.trim())}
                onBlur={() => {
                  setTimeout(() => setShowTagSuggestions(false), 200);
                }}
                style={[styles.input, { flex: 1, backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.onSurface}
                onSubmitEditing={handleAddTag}
              />
              <Button
                mode="contained"
                onPress={handleAddTag}
                style={[styles.addTagButton, { backgroundColor: theme.colors.primaryContainer }]}
                labelStyle={{ color: theme.colors.onPrimaryContainer }}>
                {t('common.add')}
              </Button>
            </View>

            {showTagSuggestions && filteredTags.length > 0 && (
              <Surface
                style={[
                  styles.suggestionsContainer,
                  {
                    top: inputLayout.height + 8,
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                elevation={2}>
                <ScrollView
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 200 }}>
                  {filteredTags.slice(0, 5).map((t, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionItem, { borderBottomColor: theme.colors.outlineVariant }]}
                      onPress={() => selectTag(t)}
                      activeOpacity={0.7}>
                      <Icon name="tag" size={16} color={theme.colors.primary} />
                      <Text style={[styles.suggestionText, { color: theme.colors.onSurface }]}>#{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Surface>
            )}
          </View>

          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  onClose={() => handleRemoveTag(tag)}
                  style={[styles.tagChip, { backgroundColor: theme.colors.secondaryContainer }]}
                  textStyle={{ color: theme.colors.onSecondaryContainer }}>
                  #{tag}
                </Chip>
              ))}
            </View>
          )}

          {/* Packing Options */}
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('createGear.packingOptions')}
          </Text>
          <View style={styles.containerToggleRow}>
            <TouchableOpacity
              style={[
                styles.containerToggle,
                container && { backgroundColor: theme.colors.tertiaryContainer, borderColor: theme.colors.tertiary },
                !container && { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }
              ]}
              onPress={() => setContainer(true)}>
              <Icon
                name="package-variant-closed"
                size={24}
                color={container ? theme.colors.onTertiaryContainer : theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodyLarge"
                style={{
                  color: container ? theme.colors.onTertiaryContainer : theme.colors.onSurfaceVariant,
                  fontWeight: container ? '600' : '400'
                }}>
                {t('createGear.packedInside')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.containerToggle,
                !container && { backgroundColor: theme.colors.secondary, borderColor: 'transparent' },
                container && { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }
              ]}
              onPress={() => setContainer(false)}>
              <Icon
                name="package-variant"
                size={24}
                color={!container ? theme.colors.onSecondary : theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodyLarge"
                style={{
                  color: !container ? theme.colors.onSecondary : theme.colors.onSurfaceVariant,
                  fontWeight: !container ? '600' : '400'
                }}>
                {t('createGear.standalone')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quantity */}
          <TextInput
            mode="outlined"
            label={t('createGear.quantity')}
            placeholder={t('createGear.quantityPlaceholder')}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />
          <Text variant="bodySmall" style={[styles.helperText, { color: theme.colors.outline }]}>
            {t('createGear.quantityHelper')}
          </Text>

          <TextInput
            mode="outlined"
            label={t('createGear.descriptionLabel')}
            placeholder={t('createGear.descriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={[styles.cancelButton, { borderColor: theme.colors.outline }]}
            textColor={theme.colors.onSurfaceVariant}>
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            buttonColor={theme.colors.primary}>
            {t('createGear.saveGear')}
          </Button>
        </View>
      </ScrollView>

      {/* Drawers */}
      <ManufacturerSelectDrawer
        visible={showManufacturerDrawer}
        onClose={() => setShowManufacturerDrawer(false)}
        onSelect={setManufacturer}
        manufacturers={manufacturers}
        selectedManufacturer={manufacturer}
      />

      <CategorySelectDrawer
        visible={showCategoryDrawer}
        onClose={() => setShowCategoryDrawer(false)}
        onSelect={setCategory}
        categories={gearCategories}
        selectedCategory={category || undefined}
        getCategoryIcon={getCategoryIcon}
      />
    </View>
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
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontWeight: '600',
  },
  input: {
    marginBottom: 8,
  },
  helperText: {
    marginBottom: 16,
    marginLeft: 4,
  },
  selectorCard: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  selectorTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  selectorContent: {
    flex: 1,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearManufacturer: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  autocompleteWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  suggestionsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTagButton: {
    marginBottom: 8,
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  tagChip: {
    borderRadius: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
  },
  containerToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  containerToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  imageContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 16,
    padding: 2,
  },
  imagePlaceholder: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontWeight: '500',
  },
});

export default CreateGearScreen;
