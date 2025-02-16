// Example: StyledText.tsx
import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

export function Text({ style, ...props }) {
  return <RNText style={[styles.text, style]} {...props} />;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Inter_400Regular', // default to Inter
    color: 'white',
  },
});
