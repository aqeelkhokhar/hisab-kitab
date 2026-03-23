import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { loginWithPin } from '../../firebase/firestore';
import Colors from '../../constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('memberName').then((stored) => {
      if (stored) setName(stored);
    });
  }, []);

  async function handleLogin() {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }

    setLoading(true);
    try {
      const storedFamilyId = await AsyncStorage.getItem('familyId');

      // Save PIN for potential join/create family later
      await AsyncStorage.setItem('tempPin', pin);

      if (storedFamilyId) {
        // Returning user with family - verify PIN against Firestore
        const result = await loginWithPin(storedFamilyId, name.trim(), pin);
        await login(storedFamilyId, result.memberId, result.memberName);
      } else {
        // New user or user without family
        await login(null, null, name.trim());
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid name or PIN.');
      setPin('');
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
        <Text style={styles.emoji}>🏠</Text>
        <Text style={styles.title}>Home Hisab Kitab</Text>
        <Text style={styles.subtitle}>Enter your name and PIN to continue</Text>

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
          <Text style={styles.label}>4-Digit PIN</Text>
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

        <Button
          title="Login"
          onPress={handleLogin}
          loading={loading}
          style={styles.loginBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 32,
  },
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
  loginBtn: { width: '100%', marginTop: 8 },
});
