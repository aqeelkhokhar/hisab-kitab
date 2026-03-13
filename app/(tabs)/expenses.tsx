import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { addExpense, subscribeToExpenses, deleteExpense } from '../../firebase/firestore';
import { convertPhotoToBase64 } from '../../firebase/storage';
import CategoryPicker, { CATEGORY_ICONS } from '../../components/ui/CategoryPicker';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Colors from '../../constants/Colors';

export default function ExpensesScreen() {
  const { familyId, memberId, memberName } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [comment, setComment] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!familyId) return;
    const unsub = subscribeToExpenses(familyId, setExpenses);
    return unsub;
  }, [familyId]);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.3,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.3,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleAddExpense() {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await convertPhotoToBase64(photoUri);
      }

      await addExpense(familyId!, {
        amount: numAmount,
        category,
        comment: comment.trim(),
        photoUrl,
        memberId: memberId!,
        memberName: memberName!,
      });

      setAmount('');
      setComment('');
      setCategory('Food');
      setPhotoUri(null);
      setShowForm(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(expenseId: string, expAmount: number) {
    Alert.alert('Delete Expense', `Remove Rs ${expAmount} expense?`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteExpense(familyId!, expenseId),
      },
    ]);
  }

  function renderExpense({ item }: { item: any }) {
    const date = item.createdAt?.toDate?.();
    return (
      <TouchableOpacity onLongPress={() => handleDelete(item.id, item.amount)}>
        <Card style={styles.expenseCard}>
          <View style={styles.expRow}>
            <View style={[styles.catBadge, { backgroundColor: Colors.categories[item.category] || Colors.primary }]}>
              <Text style={styles.catBadgeText}>{CATEGORY_ICONS[item.category] || '📌'}</Text>
            </View>
            <View style={styles.expInfo}>
              <Text style={styles.expComment}>{item.comment || item.category}</Text>
              <Text style={styles.expMeta}>
                {item.memberName} &middot; {item.category} &middot;{' '}
                {date ? date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : ''}
              </Text>
            </View>
            <Text style={styles.expAmount}>Rs {item.amount.toLocaleString()}</Text>
          </View>
          {item.photoUrl && (
            <Image source={{ uri: item.photoUrl }} style={styles.receiptThumb} />
          )}
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No expenses yet. Tap + to add one!</Text>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Expense</Text>

            <TextInput
              style={styles.input}
              placeholder="Amount (Rs)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />

            <Text style={styles.label}>Category</Text>
            <CategoryPicker selected={category} onSelect={setCategory} />

            <TextInput
              style={styles.input}
              placeholder="Comment (e.g. Grocery shopping)"
              value={comment}
              onChangeText={setComment}
            />

            {/* Photo */}
            <View style={styles.photoRow}>
              <Button title="📷 Camera" variant="secondary" onPress={takePhoto} style={{ flex: 1 }} />
              <Button title="🖼 Gallery" variant="secondary" onPress={pickPhoto} style={{ flex: 1, marginLeft: 8 }} />
            </View>

            {photoUri && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.previewImg} />
                <TouchableOpacity onPress={() => setPhotoUri(null)}>
                  <Text style={styles.removePhoto}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setShowForm(false);
                  setPhotoUri(null);
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Add Expense"
                onPress={handleAddExpense}
                loading={loading}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 100 },
  expenseCard: { marginBottom: 10 },
  expRow: { flexDirection: 'row', alignItems: 'center' },
  catBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBadgeText: { fontSize: 20 },
  expInfo: { flex: 1, marginLeft: 12 },
  expComment: { fontSize: 15, fontWeight: '600', color: Colors.text },
  expMeta: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  expAmount: { fontSize: 16, fontWeight: '800', color: Colors.expense },
  receiptThumb: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 10,
    resizeMode: 'cover',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textLight,
    marginTop: 60,
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
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
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 8 },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  photoRow: { flexDirection: 'row', marginTop: 8, marginBottom: 8 },
  photoPreview: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  previewImg: { width: 60, height: 60, borderRadius: 8 },
  removePhoto: { color: Colors.danger, marginLeft: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', marginTop: 12 },
});
