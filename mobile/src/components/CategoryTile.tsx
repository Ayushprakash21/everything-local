import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface CategoryData {
  id: string;
  label: string;
  subtitle?: string;
  icon: string;
  bgColor: string;
  accentColor: string;
}

interface CategoryTileProps {
  category: CategoryData;
  isSelected?: boolean;
  onPress: () => void;
  size?: 'compact' | 'normal';
}

export const CategoryTile: React.FC<CategoryTileProps> = ({
  category,
  isSelected,
  onPress,
  size = 'normal'
}) => {
  const isCompact = size === 'compact';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.tile,
        { backgroundColor: isSelected ? '#064e3b' : category.bgColor },
        isCompact && styles.tileCompact
      ]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.65)' }
        ]}
      >
        <Text style={styles.emojiIcon}>{category.icon}</Text>
      </View>
      <Text
        style={[
          styles.label,
          { color: isSelected ? '#ffffff' : '#0f172a' },
          isCompact && styles.labelCompact
        ]}
        numberOfLines={2}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: 84,
    height: 104,
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  tileCompact: {
    width: 76,
    height: 94,
    borderRadius: 14,
    padding: 6
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  emojiIcon: {
    fontSize: 24
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 14
  },
  labelCompact: {
    fontSize: 10,
    lineHeight: 13
  }
});
