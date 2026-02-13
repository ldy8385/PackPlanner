import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  SectionList,
  Dimensions,
} from 'react-native';
import { Text, Button, IconButton, Surface, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Manufacturer } from '../types';

interface ManufacturerSelectDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (manufacturerKey: string) => void;
  manufacturers: Manufacturer[];
  selectedManufacturer?: string;
}

const { height } = Dimensions.get('window');

// 한글 초성 추출 함수
const getKoreanInitial = (str: string): string => {
  const cho = [
    'ㄱ',
    'ㄲ',
    'ㄴ',
    'ㄷ',
    'ㄸ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅃ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅉ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
  ];
  const code = str.charCodeAt(0) - 44032;
  if (code >= 0 && code <= 11171) {
    return cho[Math.floor(code / 588)];
  }
  return str.charAt(0).toUpperCase();
};

// 문자 분류 함수
const getCharType = (char: string): string => {
  const code = char.charCodeAt(0);

  // 한글
  if (
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0x3131 && code <= 0x318e)
  ) {
    return 'korean';
  }
  // 숫자
  if (code >= 48 && code <= 57) {
    return 'number';
  }
  // 영어
  if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
    return 'english';
  }
  return 'other';
};

interface ManufacturerItem {
  key: string;
  displayName: string;
}

// 정렬 및 그룹화 함수 (displayName 기반)
const groupManufacturers = (items: ManufacturerItem[]) => {
  const groups: { [key: string]: ManufacturerItem[] } = {};

  items.forEach(m => {
    if (!m.displayName) return;
    const firstChar = m.displayName.charAt(0);
    const charType = getCharType(firstChar);

    let groupKey: string;
    if (charType === 'korean') {
      groupKey = getKoreanInitial(m.displayName);
    } else if (charType === 'number') {
      groupKey = '#';
    } else if (charType === 'english') {
      groupKey = firstChar.toUpperCase();
    } else {
      groupKey = 'Etc';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(m);
  });

  // 각 그룹 내에서 정렬
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'));
  });

  // 섹션 순서: ㄱ-ㅎ, A-Z, 1-9, 기타
  const koreanOrder = [
    'ㄱ',
    'ㄲ',
    'ㄴ',
    'ㄷ',
    'ㄸ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅃ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅉ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
  ];
  const englishOrder = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const aIsKorean = koreanOrder.includes(a);
    const bIsKorean = koreanOrder.includes(b);
    const aIsEnglish = englishOrder.includes(a);
    const bIsEnglish = englishOrder.includes(b);
    const aIsNumber = a === '#';
    const bIsNumber = b === '#';

    // 순서: 한글 > 영어 > 숫자 > 기타
    if (aIsKorean && !bIsKorean) return -1;
    if (!aIsKorean && bIsKorean) return 1;
    if (aIsEnglish && !bIsEnglish && !bIsKorean) return -1;
    if (!aIsEnglish && bIsEnglish && !aIsKorean) return 1;
    if (aIsNumber && !bIsNumber && !bIsKorean && !bIsEnglish) return -1;
    if (!aIsNumber && bIsNumber && !aIsKorean && !aIsEnglish) return 1;

    // 같은 카테고리 내에서 정렬
    if (aIsKorean && bIsKorean) {
      return koreanOrder.indexOf(a) - koreanOrder.indexOf(b);
    }
    if (aIsEnglish && bIsEnglish) {
      return englishOrder.indexOf(a) - englishOrder.indexOf(b);
    }

    return a.localeCompare(b);
  });

  return sortedKeys.map(key => ({
    title: key,
    data: groups[key],
  }));
};

interface ManufacturerSection {
  title: string;
  data: ManufacturerItem[];
}

const ITEM_HEIGHT = 56;
const SECTION_HEADER_HEIGHT = 34;

const ManufacturerSelectDrawer: React.FC<ManufacturerSelectDrawerProps> = ({
  visible,
  onClose,
  onSelect,
  manufacturers,
  selectedManufacturer,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSection, setCurrentSection] = useState('');
  const sectionListRef = useRef<SectionList<ManufacturerItem, ManufacturerSection>>(null);
  const navBarRef = useRef<View>(null);
  const navBarLayout = useRef({ y: 0, height: 0 });
  const isScrolling = useRef(false);

  const lang = i18n.language;

  // Manufacturer를 displayName 포함 아이템으로 변환
  const manufacturerItems: ManufacturerItem[] = useMemo(() => {
    return manufacturers.map(m => ({
      key: m.key,
      displayName: lang === 'en' ? m.en : m.ko,
    }));
  }, [manufacturers, lang]);

  // 검색 필터링
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupManufacturers(manufacturerItems);
    }

    const query = searchQuery.toLowerCase();
    const filtered = manufacturerItems.filter(m =>
      m.displayName.toLowerCase().includes(query),
    );

    return groupManufacturers(filtered);
  }, [manufacturerItems, searchQuery]);

  // 네비게이션 키 (중복 제거)
  const navigationKeys = useMemo(() => {
    const keys = filteredSections.map(s => s.title);
    return Array.from(new Set(keys));
  }, [filteredSections]);

  // getItemLayout: 섹션 헤더와 아이템 높이를 정확히 계산
  const getItemLayout = useCallback((_data: any, index: number) => {
    let offset = 0;
    let currentIndex = 0;
    for (const section of filteredSections) {
      // 섹션 헤더
      if (currentIndex === index) {
        return { length: SECTION_HEADER_HEIGHT, offset, index };
      }
      offset += SECTION_HEADER_HEIGHT;
      currentIndex++;
      // 섹션 내 아이템
      const itemCount = section.data.length;
      if (index < currentIndex + itemCount) {
        const itemIdx = index - currentIndex;
        return { length: ITEM_HEIGHT, offset: offset + itemIdx * ITEM_HEIGHT, index };
      }
      offset += itemCount * ITEM_HEIGHT;
      currentIndex += itemCount;
    }
    return { length: ITEM_HEIGHT, offset, index };
  }, [filteredSections]);

  // 특정 섹션으로 스크롤
  const scrollToSection = useCallback(
    (index: number) => {
      if (
        index >= 0 &&
        index < filteredSections.length &&
        sectionListRef.current
      ) {
        isScrolling.current = true;
        sectionListRef.current.scrollToLocation({
          sectionIndex: index,
          itemIndex: 0,
          animated: false,
        });
        setCurrentSection(filteredSections[index].title);
        // 스크롤 완료 후 플래그 해제
        setTimeout(() => { isScrolling.current = false; }, 100);
      }
    },
    [filteredSections],
  );

  // 터치된 위치의 항목으로 이동
  const handleTouch = (relativeY: number) => {
    if (!navBarLayout.current.height || navigationKeys.length === 0) return;

    const navBarHeight = navBarLayout.current.height;
    const itemHeight = navBarHeight / navigationKeys.length;

    // 바 낮을 벗어나지 않도록 클램프
    const clampedY = Math.max(0, Math.min(relativeY, navBarHeight - 1));

    let index = Math.floor(clampedY / itemHeight);
    index = Math.max(0, Math.min(index, navigationKeys.length - 1));

    scrollToSection(index);
  };

  // 뷰 어빌리티 변경 핸들러 - 현재 보이는 섹션 추적 (프로그래밍 스크롤 중 무시)
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ section?: { title: string } }> }) => {
      if (isScrolling.current) return;
      if (viewableItems.length > 0 && viewableItems[0].section) {
        setCurrentSection(viewableItems[0].section.title);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleSelect = (item: ManufacturerItem) => {
    onSelect(item.key);
    onClose();
    setSearchQuery('');
    setCurrentSection('');
  };

  const renderItem = ({ item }: { item: ManufacturerItem }) => (
    <TouchableOpacity
      style={[
        styles.item,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant },
        selectedManufacturer === item.key && { backgroundColor: theme.colors.primaryContainer },
      ]}
      onPress={() => handleSelect(item)}>
      <Text
        style={[
          styles.itemText,
          { color: theme.colors.onSurface },
          selectedManufacturer === item.key && { color: theme.colors.onPrimaryContainer, fontWeight: '700' },
        ]}>
        {item.displayName}
      </Text>
      {selectedManufacturer === item.key && (
        <Icon name="check" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: ManufacturerSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.surfaceVariant, borderBottomColor: theme.colors.outlineVariant }]}>
      <Text style={[styles.sectionHeaderText, { color: theme.colors.onSurfaceVariant }]}>{section.title}</Text>
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
          {/* 헤더 */}
          <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
            <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              {t('manufacturer.selectBrand')}
            </Text>
            <IconButton icon="close" size={24} onPress={onClose} iconColor={theme.colors.onSurface} />
          </View>

          {/* 검색창 */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Icon
              name="magnify"
              size={20}
              color={theme.colors.onSurfaceVariant}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.onSurface }]}
              placeholder={t('manufacturer.searchPlaceholder')}
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

          {/* 콘텐츠 영역 */}
          <View style={styles.content}>
            {/* 섹션 리스트 */}
            <SectionList
              ref={sectionListRef}
              sections={filteredSections}
              keyExtractor={item => item.key}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              stickySectionHeadersEnabled={true}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              getItemLayout={getItemLayout}
            />

            {/* 우측 네비게이션 바 */}
            {!searchQuery && navigationKeys.length > 0 && (
              <View
                ref={navBarRef}
                style={[styles.navBar, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.outlineVariant }]}
                onLayout={event => {
                  const layout = event.nativeEvent.layout;
                  navBarLayout.current = {
                    y: layout.y,
                    height: layout.height,
                  };
                }}
                onTouchStart={e => handleTouch(e.nativeEvent.locationY)}
                onTouchMove={e => handleTouch(e.nativeEvent.locationY)}>
                <View style={styles.navBarContent}>
                  {navigationKeys.map((key, _index) => (
                    <View
                      key={key}
                      style={[
                        styles.navItem,
                        currentSection === key && { backgroundColor: theme.colors.primary },
                      ]}
                      pointerEvents="none">
                      <Text
                        style={[
                          styles.navItemText,
                          { color: theme.colors.onSurfaceVariant },
                          currentSection === key && { color: theme.colors.onPrimary },
                        ]}>
                        {key}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* 현재 위치 표시 인디케이터 */}
                {currentSection && (
                  <View style={[styles.currentPositionIndicator, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.currentPositionText, { color: theme.colors.onPrimary }]}>
                      {currentSection}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 하단 버튼 */}
          <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
            <Button
              mode="outlined"
              onPress={() => {
                onSelect('');
                onClose();
                setSearchQuery('');
              }}
              style={[styles.clearButton, { borderColor: theme.colors.outline }]}
              textColor={theme.colors.onSurface}>
              {t('common.clear')}
            </Button>
            <Button
              mode="contained"
              onPress={onClose}
              style={styles.closeButton}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}>
              {t('common.close')}
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
    height: height * 0.8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    height: SECTION_HEADER_HEIGHT,
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    height: 56,
  },
  itemText: {
    fontSize: 16,
  },
  navBar: {
    width: 44,
    borderLeftWidth: 1,
    justifyContent: 'center',
  },
  navBarContent: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 2,
  },
  navItem: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 4,
    paddingVertical: 1,
  },
  navItemText: {
    fontSize: 11,
    fontWeight: '600',
  },
  currentPositionIndicator: {
    position: 'absolute',
    left: -50,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  currentPositionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  clearButton: {
    flex: 1,
  },
  closeButton: {
    flex: 2,
  },
});

export default ManufacturerSelectDrawer;
