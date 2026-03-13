import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
}

export default function PinInput({ length = 4, onComplete }: PinInputProps) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<TextInput>(null);

  function handleChange(text: string) {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    setPin(cleaned);
    if (cleaned.length === length) {
      onComplete(cleaned);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < pin.length && styles.dotFilled]}
          />
        ))}
      </View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={pin}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        caretHidden
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 16 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: 60,
  },
});
