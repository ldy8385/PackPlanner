import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Button, TextInput, Chip, IconButton, useTheme, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import { Plan, PlanType, Location } from '../types';
import { planTypes } from '../data/mockData';
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
  const theme = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <IconButton icon="arrow-left" size={24} onPress={onCancel} iconColor={theme.colors.onSurface} />
        <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {isEditMode ? 'Edit Plan' : 'New Plan'}
        </Text>
        <View style={{ width: 48 }} />
      </Surface>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <TextInput
            mode="outlined"
            label="Plan Name"
            placeholder="e.g. Weekend Camping"
            value={name}
            onChangeText={setName}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />

          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Camping Type
          </Text>
          <View style={styles.typeContainer}>
            {planTypes.map(planType => (
              <Chip
                key={planType}
                selected={type === planType}
                onPress={() => setType(planType)}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: type === planType ? theme.colors.primaryContainer : theme.colors.surface,
                    borderColor: type === planType ? theme.colors.primary : theme.colors.outline,
                  }
                ]}
                textStyle={{
                  color: type === planType ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant
                }}
                showSelectedOverlay={true}>
                {planType}
              </Chip>
            ))}
          </View>

          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Destination
          </Text>

          {!selectedLocation ? (
            <Surface style={[styles.selectorCard, { backgroundColor: theme.colors.surface }]} elevation={0}>
              <TouchableOpacity
                style={styles.locationSelector}
                onPress={() => setShowLocationDrawer(true)}>
                <View style={styles.locationContent}>
                  <Icon name="map-marker" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={[styles.locationPlaceholder, { color: theme.colors.outline }]}>
                    Select Destination
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color={theme.colors.outline} />
              </TouchableOpacity>
            </Surface>
          ) : (
            <Surface style={[styles.selectedLocationCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]} elevation={0}>
              <TouchableOpacity
                style={[styles.selectedLocationHeader, { borderBottomColor: theme.colors.outlineVariant }]}
                onPress={() => setShowLocationDrawer(true)}>
                <View style={styles.selectedLocationInfo}>
                  <Text
                    variant="titleMedium"
                    style={[styles.selectedLocationName, { color: theme.colors.onSurface }]}>
                    {selectedLocation.name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}>
                    {selectedLocation.address}
                  </Text>
                </View>
                <Icon name="pencil" size={20} color={theme.colors.primary} />
              </TouchableOpacity>

              {selectedLocation && selectedLocation.latitude && selectedLocation.longitude && (
                <KakaoMap
                  latitude={selectedLocation.latitude}
                  longitude={selectedLocation.longitude}
                  height={150}
                />
              )}

              <TouchableOpacity
                style={styles.clearLocationButton}
                onPress={handleClearLocation}>
                <Icon name="close-circle" size={16} color={theme.colors.error} />
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                  Remove Location
                </Text>
              </TouchableOpacity>
            </Surface>
          )}

          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Schedule
          </Text>

          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.dateSelector, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
              onPress={() => setOpenStartDatePicker(true)}>
              <View style={styles.dateContent}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                  Start Date
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                  {formatDateDisplay(startDate)}
                </Text>
              </View>
              <Icon name="calendar-start" size={24} color={theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateSelector, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
              onPress={() => setOpenEndDatePicker(true)}>
              <View style={styles.dateContent}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                  End Date
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                  {formatDateDisplay(endDate)}
                </Text>
              </View>
              <Icon name="calendar-end" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

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
            theme="light"
            confirmText="Confirm"
            cancelText="Cancel"
            title="Select Start Date"
          />

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
            theme="light"
            confirmText="Confirm"
            cancelText="Cancel"
            title="Select End Date"
          />

          <TextInput
            mode="outlined"
            label="Description (Optional)"
            placeholder="Add details about your trip..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.input, { backgroundColor: theme.colors.surface, marginTop: 12 }]}
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
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            buttonColor={theme.colors.primary}>
            Save Plan
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
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorCard: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationPlaceholder: {
    marginLeft: 12,
  },
  selectedLocationCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  selectedLocationInfo: {
    flex: 1,
  },
  selectedLocationName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  clearLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  dateContent: {
    flex: 1,
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
});

export default CreatePlanScreen;
