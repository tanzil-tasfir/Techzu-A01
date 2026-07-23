import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

/**
 * Brand logo mark, optionally paired with the "Mini Social" wordmark.
 * `size` controls the mark's pixel size; the wordmark scales with it.
 */
export default function Logo({ size = 44, withWordmark = false, dark = false }) {
  return (
    <View style={styles.row}>
      <Image
        source={require('../assets/logo.png')}
        style={{ width: size, height: size, borderRadius: size * 0.28 }}
        resizeMode="contain"
      />
      {withWordmark && (
        <View style={styles.wordmarkWrap}>
          <Text style={[styles.wordmark, { color: dark ? colors.textOnPrimary : colors.textPrimary }]}>
            Mini<Text style={{ color: colors.primary }}>Social</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  wordmarkWrap: { marginLeft: 10 },
  wordmark: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
});
