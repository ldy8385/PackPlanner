import React, {useState, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {Text, Button, TextInput, Chip, IconButton} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Gear, GearCategory} from '../types';
import {gearCategories, manufacturers} from '../data/mockData';
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

  // Autocomplete 상태
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [inputLayout, setInputLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

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
    const {x, y, width, height} = event.nativeEvent.layout;
    setInputLayout({x, y, width, height});
  };

  const getCategoryIcon = (cat: GearCategory): string => {
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
      Alert.alert('오류', '장비 이름을 입력해주세요.');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 0) {
      Alert.alert('오류', '올바른 무게를 입력해주세요.');
      return;
    }

    if (!category) {
      Alert.alert('오류', '카테고리를 선택해주세요.');
      return;
    }

    const newGear: Gear = {
      id: editingGear?.id || Date.now().toString(),
      name: gearName,
      category: category as GearCategory,
      weight: weightNum,
      manufacturer: manufacturer || undefined,
      description: description.trim() || undefined,
      tags,
      imageUrl: imageUri || undefined,
    };

    onSave(newGear);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={onCancel} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {isEditMode ? '장비 수정' : '새 장비 추가'}
        </Text>
        <View style={{width: 48}} />
      </View>

      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none">
        <View style={styles.form}>
          <TextInput
            mode="outlined"
            label="장비 이름 *"
            placeholder="장비 이름을 입력하세요"
            value={name}
            onChangeText={setName}
            style={styles.input}
            outlineColor="#ddd"
            activeOutlineColor="#2E7D32"
          />

          {/* 사진 선택 */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            사진 (선택사항)
          </Text>
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleSelectImage}
            activeOpacity={0.7}>
            {imageUri ? (
              <View style={styles.imageWrapper}>
                <Image source={{uri: imageUri}} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}>
                  <Icon name="close-circle" size={24} color="#B3261E" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon name="camera-plus" size={40} color="#999" />
                <Text variant="bodyMedium" style={styles.imagePlaceholderText}>
                  사진 추가하기
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 카테고리 선택 - Drawer에서 선택 */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            카테고리 *
          </Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryDrawer(true)}>
            <View style={styles.categoryContent}>
              <Text
                variant="bodyLarge"
                style={[
                  styles.categoryText,
                  !category && styles.categoryPlaceholder,
                ]}>
                {category || '카테고리 선택하기'}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TextInput
            mode="outlined"
            label="무게 (kg) *"
            placeholder="예: 2.5"
            value={weight}
            onChangeText={setWeight}
            style={styles.input}
            keyboardType="decimal-pad"
            right={<TextInput.Affix text="kg" />}
            outlineColor="#ddd"
            activeOutlineColor="#2E7D32"
          />

          {/* 제조사 선택 - Drawer에서 선택 */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            제조사 (선택사항)
          </Text>
          <TouchableOpacity
            style={styles.manufacturerSelector}
            onPress={() => setShowManufacturerDrawer(true)}>
            <View style={styles.manufacturerContent}>
              <Text
                variant="bodyLarge"
                style={[
                  styles.manufacturerText,
                  manufacturer && styles.manufacturerTextSelected,
                ]}>
                {manufacturer || '제조사 선택하기'}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          {manufacturer && (
            <TouchableOpacity
              style={styles.clearManufacturer}
              onPress={() => setManufacturer('')}>
              <Text style={styles.clearManufacturerText}>선택 해제</Text>
            </TouchableOpacity>
          )}

          <Text variant="titleMedium" style={styles.sectionTitle}>
            태그
          </Text>

          {/* 태그 입력 with Autocomplete */}
          <View style={styles.autocompleteWrapper}>
            <View style={styles.tagInputContainer} onLayout={onTagInputLayout}>
              <TextInput
                mode="outlined"
                label="태그 추가"
                placeholder="태그를 입력하고 선택 또는 추가"
                outlineColor="#ddd"
                activeOutlineColor="#2E7D32"
                value={tagInput}
                onChangeText={text => {
                  setTagInput(text);
                  setShowTagSuggestions(!!text.trim());
                }}
                onFocus={() => setShowTagSuggestions(!!tagInput.trim())}
                onBlur={() => {
                  // iOS에서 터치 이벤트가 먼저 처리되도록 약간의 지연
                  setTimeout(() => setShowTagSuggestions(false), 200);
                }}
                style={[styles.input, {flex: 1}]}
                onSubmitEditing={handleAddTag}
              />
              <Button
                mode="contained"
                onPress={handleAddTag}
                style={styles.addTagButton}>
                추가
              </Button>
            </View>

            {showTagSuggestions && filteredTags.length > 0 && (
              <View
                style={[
                  styles.suggestionsContainer,
                  {
                    position: 'absolute',
                    top: inputLayout.height + 8,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                  },
                ]}>
                <ScrollView
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  style={{maxHeight: 200}}>
                  {filteredTags.slice(0, 5).map((t, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => selectTag(t)}
                      activeOpacity={0.7}>
                      <Icon name="tag" size={16} color="#2196F3" />
                      <Text style={styles.suggestionText}>#{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  onClose={() => handleRemoveTag(tag)}
                  style={styles.tagChip}>
                  #{tag}
                </Chip>
              ))}
            </View>
          )}

          <TextInput
            mode="outlined"
            label="설명 (선택사항)"
            placeholder="장비에 대한 설명을 입력하세요"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.input}
            outlineColor="#ddd"
            activeOutlineColor="#2E7D32"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}>
            취소
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}>
            저장
          </Button>
        </View>
      </ScrollView>

      {/* 제조사 선택 Drawer */}
      <ManufacturerSelectDrawer
        visible={showManufacturerDrawer}
        onClose={() => setShowManufacturerDrawer(false)}
        onSelect={setManufacturer}
        manufacturers={manufacturers}
        selectedManufacturer={manufacturer}
      />

      {/* 카테고리 선택 Drawer */}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontWeight: '600',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  manufacturerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  manufacturerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manufacturerText: {
    fontSize: 16,
    color: '#999',
  },
  manufacturerTextSelected: {
    color: '#333',
    fontWeight: '500',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  categoryPlaceholder: {
    color: '#999',
    fontWeight: 'normal',
  },
  clearManufacturer: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  clearManufacturerText: {
    color: '#F44336',
    fontSize: 14,
  },
  autocompleteWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTagButton: {
    backgroundColor: '#4CAF50',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: '#E3F2FD',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
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
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  imagePlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#666',
  },
});

export default CreateGearScreen;
