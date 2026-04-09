import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Text, Button, Surface, IconButton, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { KAKAO_API_KEY } from '../config/apiKeys';
import { Location } from '../types';
import KakaoMap, { KakaoMapHandle } from './KakaoMap';

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
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 지도 상태 (좌표는 ref로 관리 → 리렌더링 방지)
  const mapRef = useRef<KakaoMapHandle>(null);
  const mapLatRef = useRef(37.5665);
  const mapLngRef = useRef(126.978);
  const [address, setAddress] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const addressDebounceRef = useRef<NodeJS.Timeout>();

  // Reset state when drawer opens
  useEffect(() => {
    if (visible) {
      setSearchQuery(initialQuery);
      setSearchResults([]);
      setShowResults(false);
      setAddress('');
      setHasInteracted(false);
      if (initialQuery.length >= 2) {
        searchLocation(initialQuery);
        setShowResults(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const searchLocation = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=10`,
        { headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` } },
      );
      const data = await response.json();
      if (data.documents) {
        setSearchResults(
          data.documents.map((place: any) => ({
            name: place.place_name,
            address: place.address_name,
            latitude: parseFloat(place.y),
            longitude: parseFloat(place.x),
            placeId: place.id,
          })),
        );
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchLocation(searchQuery);
      setShowResults(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchLocation]);

  // 역지오코딩
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
        { headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` } },
      );
      const data = await response.json();
      if (data.documents && data.documents.length > 0) {
        const doc = data.documents[0];
        setAddress(doc.road_address?.address_name || doc.address?.address_name || '');
      } else {
        setAddress('');
      }
    } catch {
      setAddress('');
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  // 지도 이동 시
  const handleMapLocationChange = useCallback((lat: number, lng: number) => {
    mapLatRef.current = lat;
    mapLngRef.current = lng;
    if (!hasInteracted) setHasInteracted(true);
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    addressDebounceRef.current = setTimeout(() => reverseGeocode(lat, lng), 500);
  }, [reverseGeocode, hasInteracted]);

  // 검색 결과 선택 → 지도 이동
  const handleSelectResult = (location: Location) => {
    mapLatRef.current = location.latitude;
    mapLngRef.current = location.longitude;
    setAddress(location.address || location.name);
    setHasInteracted(true);
    setShowResults(false);
    setSearchQuery(location.name);
    mapRef.current?.moveTo(location.latitude, location.longitude);
    Keyboard.dismiss();
  };

  const handleConfirm = () => {
    const location: Location = {
      name: address || searchQuery || t('location.unknownLocation'),
      address: address || undefined,
      latitude: mapLatRef.current,
      longitude: mapLngRef.current,
    };
    onSelect(location);
  };

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

          {/* Map + Search overlay */}
          <View style={styles.mapArea}>
            <KakaoMap
              ref={mapRef}
              latitude={37.5665}
              longitude={126.978}
              height={0}
              interactive
              showCenterPin
              onLocationChange={handleMapLocationChange}
            />

            {/* Search bar overlay */}
            <View style={styles.searchOverlay}>
              <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
                <Icon name="magnify" size={20} color={theme.colors.onSurfaceVariant} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.onSurface }]}
                  placeholder={t('location.searchPlaceholder')}
                  placeholderTextColor={theme.colors.outline}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    if (text.length >= 2) setShowResults(true);
                    else setShowResults(false);
                  }}
                  onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setShowResults(false); }}>
                    <Icon name="close-circle" size={20} color={theme.colors.outline} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Dropdown results */}
              {showResults && (
                <View style={[styles.dropdown, { backgroundColor: theme.colors.surface }]}>
                  {isSearching ? (
                    <View style={styles.dropdownLoading}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    </View>
                  ) : searchResults.length > 0 ? (
                    <FlatList
                      data={searchResults}
                      keyExtractor={item => item.placeId || item.name}
                      keyboardShouldPersistTaps="handled"
                      style={styles.dropdownList}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => handleSelectResult(item)}>
                          <Icon name="map-marker" size={16} color={theme.colors.primary} />
                          <View style={styles.dropdownTextContainer}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                              {item.address}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    />
                  ) : (
                    <View style={styles.dropdownLoading}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {t('location.noResults')}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Address info + buttons */}
          <View style={[styles.bottomArea, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.addressRow}>
              {isLoadingAddress ? (
                <>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                    {t('location.loadingAddress')}
                  </Text>
                </>
              ) : hasInteracted ? (
                <>
                  <Icon name="map-marker" size={20} color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginLeft: 8, flex: 1 }} numberOfLines={2}>
                    {address || `${mapLatRef.current.toFixed(5)}, ${mapLngRef.current.toFixed(5)}`}
                  </Text>
                </>
              ) : (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('location.moveMapToSelect')}
                </Text>
              )}
            </View>
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={onClose}
                style={[styles.button, { borderColor: theme.colors.outline }]}
                textColor={theme.colors.onSurface}>
                {t('common.cancel')}
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirm}
                style={styles.button}
                buttonColor={theme.colors.primary}
                disabled={!hasInteracted}>
                {t('location.select')}
              </Button>
            </View>
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
    height: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '600',
  },
  mapArea: {
    flex: 1,
  },
  searchOverlay: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  dropdown: {
    marginTop: 6,
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 220,
  },
  dropdownLoading: {
    padding: 16,
    alignItems: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  dropdownTextContainer: {
    flex: 1,
  },
  bottomArea: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
  },
});

export default LocationSelectDrawer;
