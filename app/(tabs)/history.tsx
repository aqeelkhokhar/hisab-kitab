import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToExpenses, subscribeToUdhar } from '../../firebase/firestore';
import { CATEGORY_ICONS } from '../../components/ui/CategoryPicker';
import Card from '../../components/ui/Card';
import Colors from '../../constants/Colors';

type FilterType = 'all' | 'expense' | 'udhar_give' | 'udhar_return';

export default function HistoryScreen() {
  const { familyId } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [udhar, setUdhar] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!familyId) return;
    const unsub1 = subscribeToExpenses(familyId, setExpenses);
    const unsub2 = subscribeToUdhar(familyId, setUdhar);
    return () => {
      unsub1();
      unsub2();
    };
  }, [familyId]);

  // Merge and sort all transactions
  let allItems: any[] = [];

  if (filter === 'all' || filter === 'expense') {
    allItems.push(
      ...expenses.map((e) => ({
        ...e,
        txType: 'expense' as const,
        date: e.createdAt?.toDate?.() || new Date(),
      }))
    );
  }

  if (filter === 'all' || filter === 'udhar_give') {
    allItems.push(
      ...udhar
        .filter((u) => (filter === 'udhar_give' ? u.type === 'give' : filter === 'all' ? true : false))
        .map((u) => ({
          ...u,
          txType: 'udhar' as const,
          date: u.createdAt?.toDate?.() || new Date(),
        }))
    );
  }

  if (filter === 'udhar_return') {
    allItems.push(
      ...udhar
        .filter((u) => u.type === 'return')
        .map((u) => ({
          ...u,
          txType: 'udhar' as const,
          date: u.createdAt?.toDate?.() || new Date(),
        }))
    );
  }

  // Apply search
  if (search.trim()) {
    const q = search.toLowerCase();
    allItems = allItems.filter(
      (item) =>
        (item.comment || '').toLowerCase().includes(q) ||
        (item.memberName || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.personName || '').toLowerCase().includes(q)
    );
  }

  // Sort by date desc
  allItems.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Group by date
  const grouped: Record<string, any[]> = {};
  allItems.forEach((item) => {
    const key = item.date.toLocaleDateString('en-PK', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  const sections = Object.entries(grouped).map(([title, data]) => ({
    title,
    data,
    total: data.reduce((sum, item) => {
      if (item.txType === 'expense') return sum + item.amount;
      if (item.type === 'give') return sum + item.amount;
      return sum - item.amount;
    }, 0),
  }));

  function renderItem({ item }: { item: any }) {
    if (item.txType === 'expense') {
      return (
        <View style={styles.itemRow}>
          <View style={[styles.iconBadge, { backgroundColor: Colors.categories[item.category] || Colors.primary }]}>
            <Text style={styles.iconText}>{CATEGORY_ICONS[item.category] || '📌'}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.comment || item.category}</Text>
            <Text style={styles.itemMeta}>{item.memberName} &middot; {item.category}</Text>
          </View>
          <Text style={[styles.itemAmount, { color: Colors.expense }]}>
            -Rs {item.amount.toLocaleString()}
          </Text>
        </View>
      );
    }

    // Udhar
    const isGive = item.type === 'give';
    return (
      <View style={styles.itemRow}>
        <View style={[styles.iconBadge, { backgroundColor: isGive ? Colors.udhar : Colors.udharReturn }]}>
          <Text style={styles.iconText}>{isGive ? '🤝' : '💰'}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>
            {isGive ? `Udhar to ${item.personName}` : `Return from ${item.personName}`}
          </Text>
          <Text style={styles.itemMeta}>
            {item.memberName}
            {item.comment ? ` — ${item.comment}` : ''}
          </Text>
        </View>
        <Text style={[styles.itemAmount, { color: isGive ? Colors.udhar : Colors.udharReturn }]}>
          {isGive ? '-' : '+'}Rs {item.amount.toLocaleString()}
        </Text>
      </View>
    );
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'expense', label: 'Expenses' },
    { key: 'udhar_give', label: 'Udhar Given' },
    { key: 'udhar_return', label: 'Returns' },
  ];

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id + item.txType}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTotal}>Rs {section.total.toLocaleString()}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  searchInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  filterTextActive: { color: Colors.textWhite },
  list: { paddingBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textLight },
  sectionTotal: { fontSize: 13, fontWeight: '700', color: Colors.text },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
  itemInfo: { flex: 1, marginLeft: 10 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  itemMeta: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  itemAmount: { fontSize: 14, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: Colors.textLight, marginTop: 60, fontSize: 15 },
});
