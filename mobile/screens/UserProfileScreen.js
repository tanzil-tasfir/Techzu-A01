import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getUserByUsername } from '../api/auth';
import { colors, radii, spacing, shadow } from '../theme/colors';

export default function UserProfileScreen({ route }) {
  const { username } = route.params;
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setProfile(await getUserByUsername(username));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'User not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.username[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{profile.username}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </LinearGradient>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.rowLabel}>Name</Text>
          <Text style={styles.rowValue}>{profile.username}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{profile.email}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  error: { color: colors.danger, fontSize: 14 },
  header: { alignItems: 'center', paddingVertical: spacing.xl, paddingTop: 48 },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { color: colors.textOnPrimary, fontSize: 30, fontWeight: '800' },
  username: { color: colors.textOnPrimary, fontSize: 20, fontWeight: '800' },
  email: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    margin: spacing.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowLabel: { marginLeft: 10, color: colors.textSecondary, fontSize: 14, flex: 1 },
  rowValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
});
