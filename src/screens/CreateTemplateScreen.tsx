import React, {useState, useMemo} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Chip,
  IconButton,
  Surface,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Gear, GearTemplate} from '../types';
import GearSelectScreen from './GearSelectScreen';

interface CreateTemplateScreenProps {
  gears: Gear[];
  existingCategories: string[];
  onSave: (template: GearTemplate) => void;
  onCancel: () => void;
  editingTemplate?: GearTemplate | null;
}

const CreateTemplateScreen: React.FC<CreateTemplateScreenProps> = ({
  gears,
  existingCategories,
  onSave,
  onCancel,
  editingTemplate,
}) => {
  const isEditMode = !!editingTemplate;

  const [name, setName] = useState(editingTemplate?.name || '');
  const [description, setDescription] = useState(
    editingTemplate?.description || '',
  );
  const [category, setCategory] = useState(editingTemplate?.category || '');
  const [selectedGearIds, setSelectedGearIds] = useState<string[]>(
    editingTemplate?.gearIds || [],
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

  const getTemplateCategoryIcon = (cat: string): string => {
    const iconMap: {[key: string]: string} = {
      백패킹: 'bag-personal',
      오토캠핑: 'car',
      모토캠핑: 'motorbike',
      가족캠핑: 'account-group',
      솔로캠핑: 'account',
      '2인캠핑': 'account-multiple',
      겨울캠핑: 'snowflake',
      여름캠핑: 'weather-sunny',
      기타: 'dots-horizontal',
    };
    return iconMap[cat] || 'folder-outline';
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('오류', '템플릿 이름을 입력해주세요.');
      return;
    }

    if (selectedGearIds.length === 0) {
      Alert.alert('오류', '최소 한 개 이상의 장비를 선택해주세요.');
      return;
    }

    const template: GearTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      gearIds: selectedGearIds,
      createdAt: editingTemplate?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(template);
  };

  const handleGearSelect = (gearIds: string[]) => {
    setSelectedGearIds(gearIds);
    setShowGearSelect(false);
  };

  if (showGearSelect) {
    return (
      <GearSelectScreen
        gears={gears}
        selectedGearIds={selectedGearIds}
        onSave={handleGearSelect}
        onCancel={() => setShowGearSelect(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <Surface style={styles.header} elevation={2}>
        <IconButton icon="arrow-left" size={24} onPress={onCancel} />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          {isEditMode ? '템플릿 수정' : '새 템플릿'}
        </Text>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!name.trim() || selectedGearIds.length === 0}
          buttonColor="#4CAF50">
          저장
        </Button>
      </Surface>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <TextInput
            mode="outlined"
            label="템플릿 이름 *"
            placeholder="예: 백패킹 필수 장비 세트"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="설명"
            placeholder="템플릿에 대한 설명을 입력하세요"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="카테고리"
            placeholder="예: 백패킹, 오토캠핑, 가족캠핑"
            value={category}
            onChangeText={setCategory}
            left={<TextInput.Icon icon="folder-outline" />}
            style={styles.input}
          />

          {existingCategories.length > 0 && (
            <>
              <Text variant="bodyMedium" style={styles.sectionLabel}>
                기존 카테고리
              </Text>
              <View style={styles.categoriesContainer}>
                {existingCategories
                  .filter(c => c !== category)
                  .map((cat, index) => (
                    <Chip
                      key={index}
                      onPress={() => setCategory(cat)}
                      style={styles.categoryChip}
                      icon={getTemplateCategoryIcon(cat)}>
                      {cat}
                    </Chip>
                  ))}
              </View>
            </>
          )}

          <Divider style={styles.divider} />

          {/* 장비 선택 섹션 */}
          <View style={styles.gearSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              장비 선택
            </Text>

            <View style={styles.selectedInfo}>
              <View style={styles.selectedStat}>
                <Icon name="package-variant" size={20} color="#666" />
                <Text style={styles.selectedStatText}>
                  {selectedGearsCount}개 장비
                </Text>
              </View>
              <View style={styles.selectedStat}>
                <Icon name="weight-kilogram" size={20} color="#4CAF50" />
                <Text style={styles.selectedStatWeight}>
                  {selectedGearsWeight.toFixed(1)}kg
                </Text>
              </View>
            </View>

            <Button
              mode="contained"
              icon="plus"
              onPress={() => setShowGearSelect(true)}
              style={styles.selectGearButton}
              buttonColor="#4CAF50">
              장비 선택하기
            </Button>

            {/* 선택된 장비 목록 */}
            {selectedGears.length > 0 && (
              <View style={styles.selectedGearsContainer}>
                <Text variant="bodyMedium" style={styles.selectedGearsTitle}>
                  선택된 장비
                </Text>
                {selectedGears.map(gear => (
                  <View key={gear.id} style={styles.selectedGearItem}>
                    <View style={styles.selectedGearInfo}>
                      <Text style={styles.selectedGearName}>{gear.name}</Text>
                      <Text style={styles.selectedGearDetail}>
                        {gear.category} · {gear.weight}kg
                      </Text>
                    </View>
                    <IconButton
                      icon="close"
                      size={20}
                      onPress={() => {
                        setSelectedGearIds(
                          selectedGearIds.filter(id => id !== gear.id),
                        );
                      }}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}>
            취소
          </Button>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 8,
    color: '#666',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 24,
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
  },
  selectedStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedStatText: {
    fontSize: 16,
    color: '#666',
  },
  selectedStatWeight: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  selectGearButton: {
    marginBottom: 16,
  },
  selectedGearsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedGearsTitle: {
    marginBottom: 12,
    color: '#666',
  },
  selectedGearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedGearInfo: {
    flex: 1,
  },
  selectedGearName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  selectedGearDetail: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  cancelButton: {
    width: '100%',
  },
});

export default CreateTemplateScreen;
