import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { addUdhar, subscribeToUdhar, deleteUdhar } from '../../firebase/firestore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Colors from '../../constants/Colors';

interface UdharPerson {
  name: string;
  totalGiven: number;
  totalReturned: number;
  outstanding: number;
  transactions: any[];
}

export default function UdharScreen() {
  const { familyId, memberId, memberName } = useAuth();
  const [allUdhar, setAllUdhar] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'give' | 'return'>('give');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<UdharPerson | null>(null);

  useEffect(() => {
    if (!familyId) return;
    const unsub = subscribeToUdhar(familyId, setAllUdhar);
    return unsub;
  }, [familyId]);

  // Group by person
  const persons: Record<string, UdharPerson> = {};
  allUdhar.forEach((u: any) => {
    const name = u.personName;
    if (!persons[name]) {
      persons[name] = { name, totalGiven: 0, totalReturned: 0, outstanding: 0, transactions: [] };
    }
    if (u.type === 'give') {
      persons[name].totalGiven += u.amount;
    } else {
      persons[name].totalReturned += u.amount;
    }
    persons[name].outstanding = persons[name].totalGiven - persons[name].totalReturned;
    persons[name].transactions.push(u);
  });

  const personList = Object.values(persons).sort((a, b) => b.outstanding - a.outstanding);
  const totalOutstanding = personList.reduce((sum, p) => sum + p.outstanding, 0);

  async function handleSubmit() {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    if (!personName.trim()) {
      Alert.alert('Error', 'Enter person name');
      return;
    }

    setLoading(true);
    try {
      await addUdhar(familyId!, {
        personName: personName.trim(),
        amount: numAmount,
        type: formType,
        comment: comment.trim(),
        memberId: memberId!,
        memberName: memberName!,
      });
      setAmount('');
      setComment('');
      setPersonName('');
      setShowForm(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  function openReturnForm(person: string) {
    setFormType('return');
    setPersonName(person);
    setShowForm(true);
  }

  function renderPerson({ item }: { item: UdharPerson }) {
    return (
      <TouchableOpacity onPress={() => setSelectedPerson(item)}>
        <Card style={styles.personCard}>
          <View style={styles.personRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{item.name}</Text>
              <Text style={styles.personMeta}>
                Given: Rs {item.totalGiven.toLocaleString()} | Returned: Rs {item.totalReturned.toLocaleString()}
              </Text>
            </View>
            <View style={styles.outstandingBadge}>
              <Text style={[styles.outstandingText, { color: item.outstanding > 0 ? Colors.udhar : Colors.success }]}>
                Rs {item.outstanding.toLocaleString()}
              </Text>
              <Text style={styles.outstandingLabel}>
                {item.outstanding > 0 ? 'pending' : 'settled'}
              </Text>
            </View>
          </View>
          {item.outstanding > 0 && (
            <TouchableOpacity
              style={styles.returnBtn}
              onPress={() => openReturnForm(item.name)}
            >
              <Text style={styles.returnBtnText}>+ Add Return</Text>
            </TouchableOpacity>
          )}
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Outstanding Udhar</Text>
        <Text style={styles.summaryAmount}>Rs {totalOutstanding.toLocaleString()}</Text>
      </Card>

      <FlatList
        data={personList}
        keyExtractor={(item) => item.name}
        renderItem={renderPerson}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No udhar records yet</Text>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setFormType('give');
          setPersonName('');
          setShowForm(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Udhar Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {formType === 'give' ? '💸 Give Udhar' : '💰 Record Return'}
            </Text>

            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, formType === 'give' && styles.typeBtnActive]}
                onPress={() => setFormType('give')}
              >
                <Text style={[styles.typeBtnText, formType === 'give' && styles.typeBtnTextActive]}>
                  Give Udhar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, formType === 'return' && styles.typeBtnActiveReturn]}
                onPress={() => setFormType('return')}
              >
                <Text style={[styles.typeBtnText, formType === 'return' && styles.typeBtnTextActive]}>
                  Record Return
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Person Name"
              value={personName}
              onChangeText={setPersonName}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount (Rs)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Comment (optional)"
              value={comment}
              onChangeText={setComment}
            />

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
              <Button
                title={formType === 'give' ? 'Give Udhar' : 'Record Return'}
                onPress={handleSubmit}
                loading={loading}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Person Detail Modal */}
      <Modal visible={!!selectedPerson} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedPerson?.name} — Timeline
            </Text>
            <View style={styles.detailSummary}>
              <Text style={styles.detailText}>
                Given: Rs {selectedPerson?.totalGiven.toLocaleString()} | Returned: Rs{' '}
                {selectedPerson?.totalReturned.toLocaleString()}
              </Text>
              <Text
                style={[
                  styles.detailOutstanding,
                  { color: (selectedPerson?.outstanding || 0) > 0 ? Colors.udhar : Colors.success },
                ]}
              >
                Outstanding: Rs {selectedPerson?.outstanding.toLocaleString()}
              </Text>
            </View>
            <FlatList
              data={selectedPerson?.transactions || []}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => {
                const date = item.createdAt?.toDate?.();
                return (
                  <TouchableOpacity
                    style={styles.timelineRow}
                    onLongPress={() =>
                      Alert.alert('Delete', `Remove this ${item.type} record?`, [
                        { text: 'Cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => deleteUdhar(familyId!, item.id),
                        },
                      ])
                    }
                  >
                    <Text style={styles.timelineDot}>
                      {item.type === 'give' ? '🔴' : '🟢'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timelineText}>
                        {item.type === 'give' ? 'Given' : 'Returned'} Rs {item.amount.toLocaleString()}
                      </Text>
                      {item.comment ? (
                        <Text style={styles.timelineComment}>{item.comment}</Text>
                      ) : null}
                      <Text style={styles.timelineMeta}>
                        {item.memberName} &middot;{' '}
                        {date ? date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <Button
              title="Close"
              variant="secondary"
              onPress={() => setSelectedPerson(null)}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summaryCard: {
    margin: 16,
    alignItems: 'center',
    backgroundColor: Colors.udhar,
    paddingVertical: 20,
  },
  summaryLabel: { color: '#FFFFFFCC', fontSize: 13 },
  summaryAmount: { color: Colors.textWhite, fontSize: 28, fontWeight: '900' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  personCard: { marginBottom: 10 },
  personRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.udhar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.textWhite, fontSize: 18, fontWeight: '700' },
  personInfo: { flex: 1, marginLeft: 12 },
  personName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  personMeta: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  outstandingBadge: { alignItems: 'flex-end' },
  outstandingText: { fontSize: 16, fontWeight: '800' },
  outstandingLabel: { fontSize: 10, color: Colors.textLight },
  returnBtn: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: Colors.udharReturn + '15',
    borderRadius: 8,
  },
  returnBtnText: { color: Colors.udharReturn, fontWeight: '700', fontSize: 13 },
  emptyText: { textAlign: 'center', color: Colors.textLight, marginTop: 60, fontSize: 15 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.udhar,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: { fontSize: 28, color: Colors.textWhite, fontWeight: '300', marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  typeToggle: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: Colors.udhar },
  typeBtnActiveReturn: { backgroundColor: Colors.udharReturn },
  typeBtnText: { fontWeight: '700', color: Colors.text },
  typeBtnTextActive: { color: Colors.textWhite },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  modalActions: { flexDirection: 'row', marginTop: 8 },
  detailSummary: { marginBottom: 12 },
  detailText: { fontSize: 13, color: Colors.textLight },
  detailOutstanding: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  timelineDot: { fontSize: 14, marginRight: 10, marginTop: 2 },
  timelineText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  timelineComment: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  timelineMeta: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
});
