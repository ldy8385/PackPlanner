import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {Text, IconButton, Surface} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {GearCategory} from '../types';

interface CategorySelectDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: GearCategory) => void;
  categories: GearCategory[];
  selectedCategory?: GearCategory;
  getCategoryIcon: (category: GearCategory) => string;
}

const {height} = Dimensions.get('window');

const CategorySelectDrawer: React.FC<CategorySelectDrawerProps> = ({
  visible,
  onClose,
  onSelect,
  categories,
  selectedCategory,
  getCategoryIcon,
}) => {
  const handleSelect = (category: GearCategory) => {
    onSelect(category);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Surface style={styles.drawer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              카테고리 선택
            </Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>

          {/* 3열 그리드 */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.gridItem,
                    selectedCategory === category && styles.gridItemSelected,
                  ]}
                  onPress={() => handleSelect(category)}
                  activeOpacity={0.7}>
                  <Icon
                    name={getCategoryIcon(category)}
                    size={28}
                    color={
                      selectedCategory === category ? '#FFFFFF' : '#2E7D32'
                    }
                    style={styles.gridIcon}
                  />
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.gridText,
                      selectedCategory === category && styles.gridTextSelected,
                    ]}
                    numberOfLines={2}>
                    {category}
                  </Text>
                  {selectedCategory === category && (
                    <View style={styles.checkMark}>
                      <Icon name="check-circle" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.bottomPadding} />
          </ScrollView>
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
    height: height * 0.75,
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
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#1B5E20',
  },
  gridIcon: {
    marginBottom: 8,
  },
  gridText: {
    textAlign: 'center',
    color: '#1C1B1F',
    fontWeight: '500',
    fontSize: 12,
  },
  gridTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomPadding: {
    height: 32,
  },
});

export default CategorySelectDrawer;
