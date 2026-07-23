import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createPost } from '../api/posts';
import { colors, radii, spacing, shadow } from '../theme/colors';

const MAX_LEN = 500;

export default function CreatePostScreen({ navigation }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePost = async () => {
    setError('');
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Post cannot be empty.');
      return;
    }
    if (trimmed.length > MAX_LEN) {
      setError(`Post must be ${MAX_LEN} characters or fewer.`);
      return;
    }
    setSubmitting(true);
    try {
      await createPost(trimmed);
      navigation.goBack(); // FeedScreen refreshes via useFocusEffect
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.label}>What's on your mind?</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Share an update with the Techzu community..."
          placeholderTextColor={colors.textMuted}
          multiline
          autoFocus
          value={content}
          onChangeText={setContent}
          maxLength={MAX_LEN}
        />
        <Text style={styles.counter}>
          {content.length}/{MAX_LEN}
        </Text>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePost}
          disabled={submitting}
          style={[styles.buttonWrap, submitting && styles.buttonDisabled]}
        >
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.buttonText}>Post</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  label: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    fontSize: 16,
    minHeight: 160,
    textAlignVertical: 'top',
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
  },
  counter: { textAlign: 'right', color: colors.textMuted, fontSize: 12, marginTop: 6 },
  errorBox: {
    backgroundColor: colors.dangerBg,
    borderRadius: radii.sm,
    padding: 10,
    marginTop: spacing.md,
  },
  error: { color: colors.danger, textAlign: 'center', fontSize: 13, fontWeight: '600' },
  buttonWrap: { marginTop: spacing.lg, borderRadius: radii.sm, overflow: 'hidden' },
  button: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '700' },
});
