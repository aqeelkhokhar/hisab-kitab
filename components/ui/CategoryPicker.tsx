import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Colors from '../../constants/Colors';

const CATEGORIES = ['Food', 'Bills', 'Travel', 'Shopping', 'Health', 'Education', 'Entertainment', 'Other'];

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍕',
  Bills: '📄',
  Travel: '✈️',
  Shopping: '🛍️',
  Health: '🏥',
  Education: '📚',
  Entertainment: '🎬',
  Other: '📌',
};

interface CategoryPickerProps {
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryPicker({ selected, onSelect }: CategoryPickerProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.chip,
            selected === cat && { backgroundColor: Colors.categories[cat] || Colors.primary },
          ]}
          onPress={() => onSelect(cat)}
        >
          <Text style={styles.icon}>{CATEGORY_ICONS[cat]}</Text>
          <Text style={[styles.label, selected === cat && styles.labelSelected]}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export { CATEGORIES, CATEGORY_ICONS };

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginVertical: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    gap: 4,
  },
  icon: { fontSize: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text },
  labelSelected: { color: Colors.textWhite },
});
