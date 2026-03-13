import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { createFamily, joinFamily } from '../../firebase/firestore';
import Colors from '../../constants/Colors';

export default function SetupScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [familyCode, setFamilyCode] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }
    if (mode === 'join' && !familyCode.trim()) {
      Alert.alert('Error', 'Please enter family code');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (mode === 'create') {
        const code = 'HISAB' + Math.floor(1000 + Math.random() * 9000);
        result = await createFamily(code, name.trim(), pin);
        Alert.alert(
          'Family Created!',
          `Share this code with your brothers:\n\n${code}\n\nThey can use this to join.`
        );
      } else {
        result = await joinFamily(familyCode.trim(), name.trim(), pin);
      }

      await login(result.familyId, result.memberId, name.trim());
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>👨‍👨‍👦</Text>
        <Text style={styles.title}>
          {mode === 'join' ? 'Join Your Family' : 'Create Family Group'}
        </Text>

        <View style={styles.toggleRow}>
          <Button
            title="Join Family"
            variant={mode === 'join' ? 'primary' : 'secondary'}
            onPress={() => setMode('join')}
            style={styles.toggleBtn}
          />
          <Button
            title="Create New"
            variant={mode === 'create' ? 'primary' : 'secondary'}
            onPress={() => setMode('create')}
            style={styles.toggleBtn}
          />
        </View>

        {mode === 'join' && (
          <View style={styles.field}>
            <Text style={styles.label}>Family Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. HISAB2024"
              value={familyCode}
              onChangeText={setFamilyCode}
              autoCapitalize="characters"
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ali"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Set 4-Digit PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="••••"
            value={pin}
            onChangeText={(t) => setPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="••••"
            value={confirmPin}
            onChangeText={(t) => setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
          />
        </View>

        <Button
          title={mode === 'join' ? 'Join Family' : 'Create Family'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  emoji: { fontSize: 56, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  toggleBtn: { flex: 1, minWidth: 120 },
  field: { width: '100%', marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitBtn: { width: '100%', marginTop: 8 },
});
