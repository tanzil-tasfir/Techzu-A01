import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing, shadow } from '../theme/colors';

export default function ProfileScreen() {
  const { user, logout, updateUsername, updatePassword } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState('');
  const [nameErr, setNameErr] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  const saveUsername = async () => {
    setNameMsg('');
    setNameErr('');
    if (!username.trim() || username.trim() === user?.username) return;
    setNameSaving(true);
    try {
      await updateUsername(username.trim());
      setNameMsg('Name updated.');
    } catch (err) {
      setNameErr(err.message);
    } finally {
      setNameSaving(false);
    }
  };

  const savePassword = async () => {
    setPwMsg('');
    setPwErr('');
    if (!currentPassword || !newPassword) {
      setPwErr('Both fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPwErr('New password must be at least 6 characters.');
      return;
    }
    setPwSaving(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPwMsg('Password updated.');
    } catch (err) {
      setPwErr(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change Name</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!!nameErr && <Text style={styles.err}>{nameErr}</Text>}
          {!!nameMsg && <Text style={styles.success}>{nameMsg}</Text>}
          <TouchableOpacity style={styles.saveBtn} onPress={saveUsername} disabled={nameSaving}>
            {nameSaving ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.saveText}>Save Name</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change Password</Text>

          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Current password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showCurrent}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent((s) => !s)}>
              <Ionicons name={showCurrent ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.passwordWrap, { marginTop: 10 }]}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="New password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew((s) => !s)}>
              <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {!!pwErr && <Text style={styles.err}>{pwErr}</Text>}
          {!!pwMsg && <Text style={styles.success}>{pwMsg}</Text>}
          <TouchableOpacity style={styles.saveBtn} onPress={savePassword} disabled={pwSaving}>
            {pwSaving ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.saveText}>Update Password</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  cardTitle: { fontWeight: '700', fontSize: 15, color: colors.textPrimary, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
  },
  passwordWrap: { justifyContent: 'center' },
  passwordInput: { paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 12, height: '100%', justifyContent: 'center' },
  err: { color: colors.danger, fontSize: 12, marginTop: 8 },
  success: { color: colors.success, fontSize: 12, marginTop: 8 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.dangerBg,
    borderRadius: radii.sm,
    paddingVertical: 14,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15, marginLeft: 8 },
});
