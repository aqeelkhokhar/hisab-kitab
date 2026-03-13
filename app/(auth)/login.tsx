import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PinInput from '../../components/ui/PinInput';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { loginWithPin } from '../../firebase/firestore';
import Colors from '../../constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState('');

  async function handlePinComplete(enteredPin: string) {
    setPin(enteredPin);
    setLoading(true);
    try {
      const familyId = await AsyncStorage.getItem('familyId');
      const memberName = await AsyncStorage.getItem('memberName');

      if (!familyId || !memberName) {
        // First time user — go to setup
        router.replace('/(auth)/setup');
        return;
      }

      const result = await loginWithPin(familyId, memberName, enteredPin);
      await login(familyId, result.memberId, result.memberName);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid PIN. Try again.');
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
      <View style={styles.content}>
        <Text style={styles.emoji}>🏠</Text>
        <Text style={styles.title}>Home Hisab Kitab</Text>
        <Text style={styles.subtitle}>Enter your 4-digit PIN</Text>

        <View style={styles.pinContainer}>
          <PinInput onComplete={handlePinComplete} />
        </View>

        {loading && <Text style={styles.loadingText}>Verifying...</Text>}

        <Button
          title="New here? Join Family"
          variant="secondary"
          onPress={() => router.push('/(auth)/setup')}
          style={styles.setupButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    marginBottom: 40,
  },
  pinContainer: { marginBottom: 24 },
  loadingText: {
    color: Colors.textLight,
    marginTop: 12,
  },
  setupButton: { marginTop: 40 },
});
