import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {Text, Button, TextInput, Chip, IconButton} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import {Plan, PlanType, Location} from '../types';
import {planTypes} from '../data/mockData';
import LocationSelectDrawer from '../components/LocationSelectDrawer';
import KakaoMap from '../components/KakaoMap';

interface CreatePlanScreenProps {
  onSave: (plan: Plan) => void;
  onCancel: () => void;
  editingPlan?: Plan | null;
}

const CreatePlanScreen: React.FC<CreatePlanScreenProps> = ({
  onSave,
  onCancel,
  editingPlan,
}) => {
  const isEditMode = !!editingPlan;

  const [name, setName] = useState(editingPlan?.name || '');
  const [destination, setDestination] = useState(
    editingPlan?.destination || '',
  );
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    editingPlan?.location || null,
  );
  const today = new Date();
  const [startDate, setStartDate] = useState(
    editingPlan ? editingPlan.startDate : today,
  );
  const [endDate, setEndDate] = useState(
    editingPlan ? editingPlan.endDate : today,
  );
  const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
  const [openEndDatePicker, setOpenEndDatePicker] = useState(false);
  const [type, setType] = useState<PlanType>(
    editingPlan?.type || PlanType.AUTO_CAMPING,
  );
  const [description, setDescription] = useState(
    editingPlan?.description || '',
  );
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    setDestination(location.name);
    setShowLocationDrawer(false);
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
    setDestination('');
  };

  const handleSave = () => {
    const planName = name.trim() || '이름 없는 계획';

    if (!destination.trim()) {
      Alert.alert('오류', '목적지를 입력해주세요.');
      return;
    }

    if (startDate > endDate) {
      Alert.alert('오류', '종료일은 시작일 이후여야 합니다.');
      return;
    }

    const newPlan: Plan = {
      id: editingPlan?.id || Date.now().toString(),
      name: planName,
      destination: selectedLocation?.name || destination,
      location: selectedLocation || undefined,
      startDate,
      endDate,
      type,
      description,
      createdAt: editingPlan?.createdAt || new Date(),
      items: editingPlan?.items || [],
      isCompleted: editingPlan?.isCompleted || false,
    };

    onSave(newPlan);
  };

  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={onCancel} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {isEditMode ? '계획 수정' : '새 계획 만들기'}
        </Text>
        <View style={{width: 48}} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <TextInput
            mode="outlined"
            label="계획 이름"
            placeholder="계획 이름을 입력하세요 (미입력 시 '이름 없는 계획')"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            캠핑 유형
          </Text>
          <View style={styles.typeContainer}>
            {planTypes.map(planType => (
              <Chip
                key={planType}
                selected={type === planType}
                onPress={() => setType(planType)}
                style={[
                  styles.typeChip,
                  type === planType && styles.typeChipSelected,
                ]}
                textStyle={
                  type === planType ? styles.typeChipTextSelected : undefined
                }>
                {planType}
              </Chip>
            ))}
          </View>

          <Text variant="titleMedium" style={styles.sectionTitle}>
            목적지
          </Text>

          {!selectedLocation ? (
            <TouchableOpacity
              style={styles.locationSelector}
              onPress={() => setShowLocationDrawer(true)}>
              <View style={styles.locationContent}>
                <Icon name="map-marker" size={20} color="#999" />
                <Text variant="bodyLarge" style={styles.locationPlaceholder}>
                  목적지 선택하기
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ) : (
            <View style={styles.selectedLocationCard}>
              <TouchableOpacity
                style={styles.selectedLocationHeader}
                onPress={() => setShowLocationDrawer(true)}>
                <View style={styles.selectedLocationInfo}>
                  <Text
                    variant="titleMedium"
                    style={styles.selectedLocationName}>
                    {selectedLocation.name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={styles.selectedLocationAddress}>
                    {selectedLocation.address}
                  </Text>
                </View>
                <Icon name="pencil" size={20} color="#2E7D32" />
              </TouchableOpacity>

              {selectedLocation.latitude && selectedLocation.longitude && (
                <KakaoMap
                  latitude={selectedLocation.latitude}
                  longitude={selectedLocation.longitude}
                  height={150}
                />
              )}

              <TouchableOpacity
                style={styles.clearLocationButton}
                onPress={handleClearLocation}>
                <Icon name="close-circle" size={16} color="#B3261E" />
                <Text variant="bodySmall" style={styles.clearLocationText}>
                  선택 해제
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text variant="titleMedium" style={styles.sectionTitle}>
            일정
          </Text>

          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setOpenStartDatePicker(true)}>
            <View style={styles.dateContent}>
              <Text variant="bodyLarge" style={styles.dateLabel}>
                시작일
              </Text>
              <Text variant="titleMedium" style={styles.dateValue}>
                {formatDateDisplay(startDate)}
              </Text>
            </View>
            <Icon name="calendar" size={24} color="#999" />
          </TouchableOpacity>

          <DatePicker
            modal
            open={openStartDatePicker}
            date={startDate}
            onConfirm={date => {
              setOpenStartDatePicker(false);
              setStartDate(date);
            }}
            onCancel={() => {
              setOpenStartDatePicker(false);
            }}
            mode="date"
            locale="ko"
          />

          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setOpenEndDatePicker(true)}>
            <View style={styles.dateContent}>
              <Text variant="bodyLarge" style={styles.dateLabel}>
                종료일
              </Text>
              <Text variant="titleMedium" style={styles.dateValue}>
                {formatDateDisplay(endDate)}
              </Text>
            </View>
            <Icon name="calendar" size={24} color="#999" />
          </TouchableOpacity>

          <DatePicker
            modal
            open={openEndDatePicker}
            date={endDate}
            onConfirm={date => {
              setOpenEndDatePicker(false);
              setEndDate(date);
            }}
            onCancel={() => {
              setOpenEndDatePicker(false);
            }}
            mode="date"
            locale="ko"
          />

          <TextInput
            mode="outlined"
            label="설명 (선택사항)"
            placeholder="계획에 대한 설명을 입력하세요"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.input}
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

      {/* Location Select Drawer */}
      <LocationSelectDrawer
        visible={showLocationDrawer}
        onClose={() => setShowLocationDrawer(false)}
        onSelect={handleSelectLocation}
        initialQuery={destination}
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
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  typeChipSelected: {
    backgroundColor: '#4CAF50',
  },
  typeChipTextSelected: {
    color: '#fff',
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchResultAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationPlaceholder: {
    marginLeft: 12,
    color: '#999',
  },
  selectedLocationCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedLocationInfo: {
    flex: 1,
  },
  selectedLocationName: {
    color: '#1C1B1F',
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedLocationAddress: {
    color: '#79747E',
  },
  clearLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 4,
  },
  clearLocationText: {
    color: '#B3261E',
  },
  dateDisplay: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  dateValue: {
    color: '#333',
    fontWeight: '600',
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
});

export default CreatePlanScreen;
