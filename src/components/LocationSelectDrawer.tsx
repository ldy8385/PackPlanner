import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {Text, Button, Surface, IconButton} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {KAKAO_API_KEY} from '../config/apiKeys';
import {Location} from '../types';
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
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );

  // Reset state when drawer opens
  useEffect(() => {
    if (visible) {
      setSearchQuery(initialQuery);
      setSelectedLocation(null);
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

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(selectedLocation);
    }
  };

  const renderSearchResult = ({item}: {item: Location}) => (
    <TouchableOpacity
      style={[
        styles.resultItem,
        selectedLocation?.placeId === item.placeId && styles.resultItemSelected,
      ]}
      onPress={() => handleSelectLocation(item)}>
      <Icon
        name="map-marker"
        size={20}
        color={
          selectedLocation?.placeId === item.placeId ? '#2E7D32' : '#79747E'
        }
      />
      <View style={styles.resultTextContainer}>
        <Text
          variant="bodyLarge"
          style={[
            styles.resultName,
            selectedLocation?.placeId === item.placeId &&
              styles.resultNameSelected,
          ]}>
          {item.name}
        </Text>
        <Text variant="bodySmall" style={styles.resultAddress}>
          {item.address}
        </Text>
      </View>
      {selectedLocation?.placeId === item.placeId && (
        <Icon name="check-circle" size={24} color="#2E7D32" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Surface style={styles.drawer}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              위치 선택
            </Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Icon
              name="magnify"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="장소를 검색하세요"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Map Preview (when location selected) */}
          {selectedLocation && (
            <View style={styles.mapContainer}>
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
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text variant="bodyMedium" style={styles.loadingText}>
                  검색 중...
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="map-search" size={48} color="#79747E" />
                <Text variant="bodyLarge" style={styles.emptyText}>
                  {searchQuery.length < 2
                    ? '장소를 검색해보세요'
                    : '검색 결과가 없습니다'}
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

          {/* Bottom Buttons */}
          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={onClose}
              style={styles.cancelButton}
              textColor="#49454F">
              취소
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={styles.selectButton}
              buttonColor="#2E7D32"
              disabled={!selectedLocation}>
              선택
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
    backgroundColor: '#fff',
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
    borderBottomColor: '#E7E0EC',
  },
  headerTitle: {
    fontWeight: '600',
    color: '#1C1B1F',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
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
    color: '#1C1B1F',
  },
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
  loadingText: {
    marginTop: 12,
    color: '#49454F',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#49454F',
    textAlign: 'center',
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  resultItemSelected: {
    backgroundColor: '#C8E6C9',
    borderColor: '#2E7D32',
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    color: '#1C1B1F',
    fontWeight: '500',
    marginBottom: 2,
  },
  resultNameSelected: {
    color: '#1B5E20',
    fontWeight: '600',
  },
  resultAddress: {
    color: '#79747E',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E7E0EC',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    borderColor: '#79747E',
  },
  selectButton: {
    flex: 1,
  },
});

export default LocationSelectDrawer;
