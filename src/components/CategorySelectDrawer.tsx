import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Text, IconButton, Surface, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GearCategory } from '../types';

interface CategorySelectDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: GearCategory) => void;
  categories: GearCategory[];
  selectedCategory?: GearCategory;
  getCategoryIcon: (category: GearCategory) => string;
}

const CategorySelectDrawer: React.FC<CategorySelectDrawerProps> = ({
  visible,
  onClose,
  onSelect,
  categories,
  selectedCategory,
  getCategoryIcon,
}) => {
  const theme = useTheme();
  const { height } = Dimensions.get('window');

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
        <Surface style={[styles.drawer, { backgroundColor: theme.colors.surface }]} elevation={5}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
            <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Select Category
            </Text>
            <IconButton icon="close" size={24} onPress={onClose} iconColor={theme.colors.onSurface} />
          </View>

          {/* Grid */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.gridItem,
                    { backgroundColor: theme.colors.surfaceVariant },
                    selectedCategory === category && { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => handleSelect(category)}
                  activeOpacity={0.7}>
                  <Icon
                    name={getCategoryIcon(category)}
                    size={28}
                    color={
                      selectedCategory === category ? theme.colors.primary : theme.colors.onSurfaceVariant
                    }
                    style={styles.gridIcon}
                  />
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.gridText,
                      { color: theme.colors.onSurfaceVariant },
                      selectedCategory === category && { color: theme.colors.onPrimaryContainer, fontWeight: '700' },
                    ]}
                    numberOfLines={2}>
                    {category}
                  </Text>
                  {selectedCategory === category && (
                    <View style={styles.checkMark}>
                      <Icon name="check-circle" size={16} color={theme.colors.primary} />
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
    height: Dimensions.get('window').height * 0.75,
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
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  gridIcon: {
    marginBottom: 8,
  },
  gridText: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 12,
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
