import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Share,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useMonthlyExpenses, useMonthlyIncome, getCurrentMonth, formatMonth } from '../../hooks/useMonthlyData';
import { addIncome, deleteIncome, getFamilyMembers } from '../../firebase/firestore';
import { registerForPushNotifications } from '../../notifications/setup';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CATEGORY_ICONS } from '../../components/ui/CategoryPicker';
import Colors from '../../constants/Colors';

export default function DashboardScreen() {
  const { familyId, memberId, memberName, logout } = useAuth();
  const [month] = useState(getCurrentMonth());
  const { expenses, loading: expLoading } = useMonthlyExpenses(month);
  const { income, loading: incLoading } = useMonthlyIncome(month);
  const [refreshing, setRefreshing] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  const [familyCode, setFamilyCode] = useState('');

  useEffect(() => {
    if (familyId && memberId) {
      registerForPushNotifications(familyId, memberId);
      loadFamilyCode();
    }
  }, [familyId, memberId]);

  async function loadFamilyCode() {
    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');
      const snap = await getDoc(doc(db, 'families', familyId!));
      if (snap.exists()) {
        setFamilyCode(snap.data().code);
      }
    } catch {}
  }

  const totalIncome = income.reduce((sum: number, i: any) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum: number, i: any) => sum + i.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e: any) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  async function handleAddIncome() {
    const amount = parseFloat(incomeAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    try {
      await addIncome(familyId!, {
        amount,
        source: incomeSource.trim() || 'Salary',
        memberId: memberId!,
        memberName: memberName!,
        month,
      });
      setIncomeAmount('');
      setIncomeSource('');
      setShowIncomeModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  const recentExpenses = expenses.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Assalam o Alaikum,</Text>
          <Text style={styles.name}>{memberName} 👋</Text>
        </View>
        <TouchableOpacity onPress={() => {
          Share.share({
            message: `Join our family on Home Hisab Kitab! 🏠\n\nFamily Code: ${familyCode}\n\nDownload the app and use this code to join.`,
          });
        }}>
          <Text style={styles.codeChip}>{familyCode || '...'}</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{formatMonth(month)}</Text>
        <Text style={[styles.balanceAmount, { color: balance >= 0 ? Colors.income : Colors.expense }]}>
          Rs {balance.toLocaleString()}
        </Text>
        <Text style={styles.balanceLabel}>Remaining Balance</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceItemAmount, { color: Colors.income }]}>
              Rs {totalIncome.toLocaleString()}
            </Text>
            <Text style={styles.balanceItemLabel}>Income</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceItemAmount, { color: Colors.expense }]}>
              Rs {totalExpenses.toLocaleString()}
            </Text>
            <Text style={styles.balanceItemLabel}>Expenses</Text>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <Button title="+ Add Income" onPress={() => setShowIncomeModal(true)} style={{ flex: 1 }} />
        <Button
          title="Logout"
          variant="danger"
          onPress={() => Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel' },
            { text: 'Logout', onPress: logout, style: 'destructive' },
          ])}
          style={{ flex: 0.5, marginLeft: 8 }}
        />
      </View>

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, total]) => (
              <View key={cat} style={styles.catRow}>
                <View style={styles.catLeft}>
                  <Text style={styles.catIcon}>{CATEGORY_ICONS[cat] || '📌'}</Text>
                  <Text style={styles.catName}>{cat}</Text>
                </View>
                <Text style={styles.catAmount}>Rs {total.toLocaleString()}</Text>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min((total / totalExpenses) * 100, 100)}%`,
                        backgroundColor: Colors.categories[cat] || Colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
        </Card>
      )}

      {/* Recent Transactions */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        {recentExpenses.length === 0 ? (
          <Text style={styles.emptyText}>No expenses this month yet</Text>
        ) : (
          recentExpenses.map((exp: any) => (
            <View key={exp.id} style={styles.txRow}>
              <Text style={styles.txIcon}>{CATEGORY_ICONS[exp.category] || '📌'}</Text>
              <View style={styles.txInfo}>
                <Text style={styles.txComment}>{exp.comment || exp.category}</Text>
                <Text style={styles.txMeta}>
                  {exp.memberName} &middot; {exp.createdAt?.toDate?.()?.toLocaleDateString() || ''}
                </Text>
              </View>
              <Text style={styles.txAmount}>-Rs {exp.amount.toLocaleString()}</Text>
            </View>
          ))
        )}
      </Card>

      {/* Income List */}
      {income.length > 0 && (
        <Card style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 32 }}>
          <Text style={styles.sectionTitle}>Income This Month</Text>
          {income.map((inc: any) => (
            <TouchableOpacity
              key={inc.id}
              style={styles.txRow}
              onLongPress={() =>
                Alert.alert('Delete Income', `Remove Rs ${inc.amount}?`, [
                  { text: 'Cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteIncome(familyId!, inc.id) },
                ])
              }
            >
              <Text style={styles.txIcon}>💰</Text>
              <View style={styles.txInfo}>
                <Text style={styles.txComment}>{inc.source}</Text>
                <Text style={styles.txMeta}>{inc.memberName}</Text>
              </View>
              <Text style={[styles.txAmount, { color: Colors.income }]}>+Rs {inc.amount.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Add Income Modal */}
      <Modal visible={showIncomeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Income</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount (Rs)"
              keyboardType="numeric"
              value={incomeAmount}
              onChangeText={setIncomeAmount}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Source (e.g. Salary, Freelance)"
              value={incomeSource}
              onChangeText={setIncomeSource}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setShowIncomeModal(false)} style={{ flex: 1 }} />
              <Button title="Add" onPress={handleAddIncome} style={{ flex: 1, marginLeft: 8 }} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 8,
  },
  greeting: { fontSize: 14, color: Colors.textLight },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text },
  codeChip: {
    backgroundColor: Colors.primaryLight,
    color: Colors.textWhite,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  balanceCard: {
    marginHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.primaryDark,
  },
  balanceLabel: { color: '#FFFFFFAA', fontSize: 13 },
  balanceAmount: { fontSize: 36, fontWeight: '900', marginVertical: 4 },
  balanceRow: {
    flexDirection: 'row',
    marginTop: 16,
    width: '100%',
  },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceItemAmount: { fontSize: 18, fontWeight: '700' },
  balanceItemLabel: { fontSize: 12, color: '#FFFFFFAA', marginTop: 2 },
  divider: { width: 1, backgroundColor: '#FFFFFF33', marginVertical: 4 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16 },
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  emptyText: { color: Colors.textLight, textAlign: 'center', paddingVertical: 16 },
  catRow: { marginBottom: 12 },
  catLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  catIcon: { fontSize: 16, marginRight: 6 },
  catName: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  catAmount: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4, marginLeft: 22 },
  barBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginLeft: 22 },
  barFill: { height: 6, borderRadius: 3 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  txIcon: { fontSize: 20, marginRight: 10 },
  txInfo: { flex: 1 },
  txComment: { fontSize: 14, fontWeight: '600', color: Colors.text },
  txMeta: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', color: Colors.expense },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', marginTop: 8 },
});
