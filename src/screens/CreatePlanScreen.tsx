import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Text, Button, TextInput, Chip, IconButton, useTheme, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CalendarPicker from 'react-native-calendar-picker';
import { useTranslation } from 'react-i18next';
import { Plan, PlanType, Location } from '../types';
import { planTypes } from '../data/mockData';
import { useDialog } from '../contexts/DialogContext';
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
  const { t } = useTranslation();
  const { showAlert } = useDialog();
  const isEditMode = !!editingPlan;

  const [name, setName] = useState(editingPlan?.name || '');
  const [destination, setDestination] = useState(
    editingPlan?.destination || '',
  );
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    editingPlan?.location || null,
  );
  const [startDate, setStartDate] = useState<Date | null>(
    editingPlan ? editingPlan.startDate : null,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    editingPlan ? editingPlan.endDate : null,
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [type, setType] = useState<PlanType>(
    editingPlan?.type || PlanType.AUTO_CAMPING,
  );
  const [description, setDescription] = useState(
    editingPlan?.description || '',
  );
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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
    const planName = name.trim() || t('createPlan.unnamedPlan');

    if (!startDate) {
      showAlert({
        title: t('common.error'),
        message: t('createPlan.errorStartDate'),
        icon: 'error',
        confirmText: t('common.confirm'),
      });
      return;
    }

    const finalEndDate = endDate || startDate;

    if (startDate > finalEndDate) {
      showAlert({
        title: t('common.error'),
        message: t('createPlan.errorDate'),
        icon: 'error',
        confirmText: t('common.confirm'),
      });
      return;
    }

    const newPlan: Plan = {
      id: editingPlan?.id || Date.now().toString(),
      name: planName,
      destination: selectedLocation?.name || destination,
      location: selectedLocation || undefined,
      startDate,
      endDate: finalEndDate,
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
          {isEditMode ? t('createPlan.editPlan') : t('createPlan.newPlan')}
        </Text>
        <View style={{ width: 48 }} />
      </Surface>

      <ScrollView ref={scrollViewRef} style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('createPlan.planName')}
          </Text>
          <TextInput
            mode="outlined"
            placeholder={t('createPlan.planNamePlaceholder')}
            placeholderTextColor={theme.colors.outline}
            value={name}
            onChangeText={setName}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            outlineStyle={styles.outlineRounded}
          />

          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('createPlan.campingType')}
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
                {t(`planType.${planType}`)}
              </Chip>
            ))}
          </View>

          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('createPlan.destination')}
          </Text>

          {!selectedLocation ? (
            <Surface style={[styles.selectorCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} elevation={0}>
              <TouchableOpacity
                style={styles.locationSelector}
                onPress={() => setShowLocationDrawer(true)}>
                <View style={styles.locationContent}>
                  <Icon name="map-marker" size={20} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={[styles.locationPlaceholder, { color: theme.colors.outline }]}>
                    {t('createPlan.selectDestination')}
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
                  {t('createPlan.removeLocation')}
                </Text>
              </TouchableOpacity>
            </Surface>
          )}

          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('createPlan.schedule')}
          </Text>

          <TouchableOpacity
            style={[styles.dateRangeSelector, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
            onPress={() => setShowCalendar(true)}>
            <View style={styles.dateRangeItem}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('createPlan.startDate')}
              </Text>
              <Text variant="titleMedium" style={{ color: startDate ? theme.colors.onSurface : theme.colors.outline, fontWeight: '600' }}>
                {startDate ? formatDateDisplay(startDate) : t('createPlan.selectStartDate')}
              </Text>
            </View>
            <Icon name="arrow-right" size={20} color={theme.colors.outline} />
            <View style={[styles.dateRangeItem, { alignItems: 'flex-end' }]}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('createPlan.endDate')}
              </Text>
              <Text variant="titleMedium" style={{ color: endDate ? theme.colors.onSurface : theme.colors.outline, fontWeight: '600' }}>
                {endDate ? formatDateDisplay(endDate) : t('createPlan.selectEndDate')}
              </Text>
            </View>
            <Icon name="calendar-range" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          <Modal
            visible={showCalendar}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCalendar(false)}>
            <View style={styles.calendarOverlay}>
              <Surface style={[styles.calendarContainer, { backgroundColor: theme.colors.surface }]} elevation={5}>
                <View style={styles.calendarHeader}>
                  <Text variant="titleLarge" style={[styles.calendarTitle, { color: theme.colors.onSurface }]}>
                    {t('createPlan.schedule')}
                  </Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setShowCalendar(false)}
                    iconColor={theme.colors.onSurfaceVariant}
                  />
                </View>
                <CalendarPicker
                  startFromMonday={false}
                  allowRangeSelection={true}
                  selectedStartDate={startDate || undefined}
                  selectedEndDate={endDate || undefined}
                  onDateChange={(date, type) => {
                    if (type === 'END_DATE') {
                      if (date) {
                        setEndDate(new Date(date.toString()));
                      }
                    } else {
                      setStartDate(new Date(date.toString()));
                      setEndDate(null);
                    }
                  }}
                  selectedDayColor={theme.colors.primary}
                  selectedDayTextColor={theme.colors.onPrimary}
                  selectedRangeStyle={{ backgroundColor: theme.colors.primaryContainer }}
                  selectedRangeStartStyle={{ backgroundColor: theme.colors.primary }}
                  selectedRangeEndStyle={{ backgroundColor: theme.colors.primary }}
                  selectedRangeStartTextStyle={{ color: theme.colors.onPrimary }}
                  selectedRangeEndTextStyle={{ color: theme.colors.onPrimary }}
                  todayBackgroundColor={theme.colors.surfaceVariant}
                  todayTextStyle={{ color: theme.colors.onSurface }}
                  textStyle={{ color: theme.colors.onSurface }}
                  monthTitleStyle={{ color: theme.colors.onSurface, fontWeight: '700', fontSize: 18 }}
                  yearTitleStyle={{ color: theme.colors.onSurface, fontWeight: '700', fontSize: 18 }}
                  dayLabelsWrapper={{ borderTopWidth: 0, borderBottomWidth: 0 }}
                  previousTitle="<"
                  nextTitle=">"
                  previousTitleStyle={{ color: theme.colors.primary, fontSize: 20 }}
                  nextTitleStyle={{ color: theme.colors.primary, fontSize: 20 }}
                  width={340}
                />
                <View style={styles.calendarFooter}>
                  <Button
                    mode="contained"
                    onPress={() => {
                      if (!endDate) {
                        setEndDate(startDate);
                      }
                      setShowCalendar(false);
                    }}
                    buttonColor={theme.colors.primary}
                    style={styles.calendarConfirmBtn}
                    contentStyle={{ height: 56 }}>
                    {t('common.confirm')}
                  </Button>
                </View>
              </Surface>
            </View>
          </Modal>

          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('createPlan.description')}
          </Text>
          <TextInput
            mode="outlined"
            placeholder={t('createPlan.descriptionPlaceholder')}
            placeholderTextColor={theme.colors.outline}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.memoInput, { backgroundColor: theme.colors.surface }]}
            contentStyle={{ paddingTop: 12 }}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            outlineStyle={styles.outlineRounded}
            onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={[styles.cancelButton, { borderColor: theme.colors.outline }]}
            contentStyle={{ height: 56 }}
            textColor={theme.colors.onSurfaceVariant}>
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={{ height: 56 }}
            buttonColor={theme.colors.primary}>
            {t('createPlan.savePlan')}
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
  memoInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  outlineRounded: {
    borderRadius: 12,
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
    height: 56,
    marginBottom: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    flex: 1,
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
  dateRangeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  dateRangeItem: {
    flex: 1,
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  calendarTitle: {
    fontWeight: '700',
  },
  calendarFooter: {
    padding: 16,
    paddingTop: 8,
  },
  calendarConfirmBtn: {
    borderRadius: 12,
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
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
  },
});

export default CreatePlanScreen;
