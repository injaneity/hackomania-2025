import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

export function Text({ style, ...props }: TextProps) {
  return (
    <RNText 
      {...props} 
      style={[styles.defaultText, style]}
    />
  );
}

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: 'CaveatBrush_400Regular',
  },
});
