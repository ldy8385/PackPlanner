import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Text, Button, Surface, IconButton, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { KAKAO_API_KEY } from '../config/apiKeys';
import { Location } from '../types';
import KakaoMap from './KakaoMap';

interface LocationSelectDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: Location) => void;
  initialQuery?: string;
}

const LocationSelectDrawer: React.FC<LocationSelectDrawerProps> = ({
  visible,
  onClose,
  onSelect,
  initialQuery = '',
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'search' | 'map'>('search');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // 지도 탭 상태
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapAddress, setMapAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const addressDebounceRef = useRef<NodeJS.Timeout>();

  // Reset state when drawer opens
  useEffect(() => {
    if (visible) {
      setSearchQuery(initialQuery);
      setSelectedLocation(null);
      setActiveTab('search');
      setMapCenter(null);
      setMapAddress('');
      if (initialQuery.length >= 2) {
        searchLocation(initialQuery);
      } else {
        setSearchResults([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialQuery]);

  const searchLocation = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
          query,
        )}&size=15`,
        {
          headers: {
            Authorization: `KakaoAK ${KAKAO_API_KEY}`,
          },
        },
      );
      const data = await response.json();

      if (data.documents) {
        const locations: Location[] = data.documents.map((place: any) => ({
          name: place.place_name,
          address: place.address_name,
          latitude: parseFloat(place.y),
          longitude: parseFloat(place.x),
          placeId: place.id,
        }));
        setSearchResults(locations);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocation(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocation]);

  // 역지오코딩: 좌표 → 주소
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
        {
          headers: {
            Authorization: `KakaoAK ${KAKAO_API_KEY}`,
          },
        },
      );
      const data = await response.json();
      if (data.documents && data.documents.length > 0) {
        const doc = data.documents[0];
        const address = doc.road_address?.address_name || doc.address?.address_name || '';
        setMapAddress(address);
      } else {
        setMapAddress('');
      }
    } catch {
      setMapAddress('');
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  // 지도 중심 변경 시
  const handleMapLocationChange = useCallback((lat: number, lng: number) => {
    setMapCenter({ lat, lng });
    if (addressDebounceRef.current) {
      clearTimeout(addressDebounceRef.current);
    }
    addressDebounceRef.current = setTimeout(() => {
      reverseGeocode(lat, lng);
    }, 500);
  }, [reverseGeocode]);

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (activeTab === 'search' && selectedLocation) {
      onSelect(selectedLocation);
    } else if (activeTab === 'map' && mapCenter) {
      const location: Location = {
        name: mapAddress || t('location.unknownLocation'),
        address: mapAddress || undefined,
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
      };
      onSelect(location);
    }
  };

  const canConfirm = activeTab === 'search' ? !!selectedLocation : !!mapCenter;

  const renderSearchResult = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={[
        styles.resultItem,
        { backgroundColor: theme.colors.surfaceVariant },
        selectedLocation?.placeId === item.placeId && {
          backgroundColor: theme.colors.primaryContainer,
          borderColor: theme.colors.primary,
        },
      ]}
      onPress={() => handleSelectLocation(item)}>
      <Icon
        name="map-marker"
        size={20}
        color={
          selectedLocation?.placeId === item.placeId
            ? theme.colors.primary
            : theme.colors.outline
        }
      />
      <View style={styles.resultTextContainer}>
        <Text
          variant="bodyLarge"
          style={[
            styles.resultName,
            { color: theme.colors.onSurface },
            selectedLocation?.placeId === item.placeId && {
              color: theme.colors.onPrimaryContainer,
              fontWeight: '600',
            },
          ]}>
          {item.name}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {item.address}
        </Text>
      </View>
      {selectedLocation?.placeId === item.placeId && (
        <Icon name="check-circle" size={24} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderSearchTab = () => (
    <>
      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Icon
          name="magnify"
          size={20}
          color={theme.colors.onSurfaceVariant}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.onSurface }]}
          placeholder={t('location.searchPlaceholder')}
          placeholderTextColor={theme.colors.outline}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={theme.colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      {/* Map Preview (when location selected) */}
      {selectedLocation && (
        <View style={[styles.mapPreview, { borderColor: theme.colors.outlineVariant, borderWidth: 1 }]}>
          <KakaoMap
            latitude={selectedLocation.latitude}
            longitude={selectedLocation.longitude}
            height={200}
          />
          <View style={styles.mapOverlay}>
            <Text variant="titleSmall" style={styles.mapLocationName}>
              {selectedLocation.name}
            </Text>
          </View>
        </View>
      )}

      {/* Search Results */}
      <View style={styles.resultsContainer}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
              {t('location.searching')}
            </Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="map-search" size={48} color={theme.colors.outlineVariant} />
            <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              {searchQuery.length < 2
                ? t('location.searchForPlace')
                : t('location.noResults')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={item => item.placeId || item.name}
            renderItem={renderSearchResult}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
          />
        )}
      </View>
    </>
  );

  const renderMapTab = () => (
    <View style={styles.mapTabContainer}>
      <View style={styles.mapFullContainer}>
        <KakaoMap
          latitude={37.5665}
          longitude={126.978}
          height={400}
          interactive
          onLocationChange={handleMapLocationChange}
        />
      </View>
      <View style={[styles.mapInfo, { backgroundColor: theme.colors.surface }]}>
        {isLoadingAddress ? (
          <View style={styles.mapInfoRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
              {t('location.loadingAddress')}
            </Text>
          </View>
        ) : mapCenter ? (
          <View style={styles.mapInfoRow}>
            <Icon name="map-marker" size={20} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginLeft: 8, flex: 1 }} numberOfLines={2}>
              {mapAddress || `${mapCenter.lat.toFixed(5)}, ${mapCenter.lng.toFixed(5)}`}
            </Text>
          </View>
        ) : (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            {t('location.moveMapToSelect')}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Surface style={[styles.drawer, { backgroundColor: theme.colors.surface }]} elevation={5}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
            <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              {t('location.selectLocation')}
            </Text>
            <IconButton icon="close" size={24} onPress={onClose} iconColor={theme.colors.onSurface} />
          </View>

          {/* Tabs */}
          <View style={[styles.tabContainer, { borderBottomColor: theme.colors.outlineVariant }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'search' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab('search')}>
              <Icon
                name="magnify"
                size={18}
                color={activeTab === 'search' ? theme.colors.primary : theme.colors.outline}
              />
              <Text
                variant="bodyMedium"
                style={{
                  color: activeTab === 'search' ? theme.colors.primary : theme.colors.outline,
                  fontWeight: activeTab === 'search' ? '600' : '400',
                  marginLeft: 6,
                }}>
                {t('location.tabSearch')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'map' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab('map')}>
              <Icon
                name="map"
                size={18}
                color={activeTab === 'map' ? theme.colors.primary : theme.colors.outline}
              />
              <Text
                variant="bodyMedium"
                style={{
                  color: activeTab === 'map' ? theme.colors.primary : theme.colors.outline,
                  fontWeight: activeTab === 'map' ? '600' : '400',
                  marginLeft: 6,
                }}>
                {t('location.tabMap')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'search' ? renderSearchTab() : renderMapTab()}

          {/* Bottom Buttons */}
          <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
            <Button
              mode="outlined"
              onPress={onClose}
              style={[styles.cancelButton, { borderColor: theme.colors.outline }]}
              textColor={theme.colors.onSurface}>
              {t('common.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={styles.selectButton}
              buttonColor={theme.colors.primary}
              disabled={!canConfirm}>
              {t('location.select')}
            </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    height: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  mapPreview: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 0,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  mapLocationName: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  mapTabContainer: {
    flex: 1,
  },
  mapFullContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  mapInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
  },
  selectButton: {
    flex: 1,
  },
});

export default LocationSelectDrawer;
