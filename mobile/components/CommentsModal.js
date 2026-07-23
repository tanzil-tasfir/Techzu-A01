import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchComments, addComment } from '../api/posts';
import { colors, radii, spacing, shadow } from '../theme/colors';

function timeAgo(isoLike) {
  const date = new Date(isoLike.replace(' ', 'T') + 'Z');
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CommentsModal({ visible, post, onClose, onCommentAdded, onToggleLike, onPressAuthor }) {
  const [localPost, setLocalPost] = useState(post);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!post) return;
    setLoading(true);
    setError('');
    try {
      const { comments: c } = await fetchComments(post.id, { limit: 50 });
      setComments(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [post]);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    if (visible) load();
    else {
      setComments([]);
      setText('');
      setError('');
    }
  }, [visible, load]);

  const handleLikePress = () => {
    if (!localPost) return;
    setLocalPost((p) => ({
      ...p,
      likedByMe: !p.likedByMe,
      likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
    }));
    onToggleLike?.(localPost.id);
  };

  const handleSend = async () => {
    if (!text.trim() || !post) return;
    setPosting(true);
    setError('');
    try {
      const newComment = await addComment(post.id, text.trim());
      setComments((prev) => [...prev, newComment]);
      setText('');
      onCommentAdded?.(post.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Comments</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 16 }}
            ListHeaderComponent={
              localPost && (
                <View style={styles.postPreview}>
                  <TouchableOpacity
                    style={styles.postHeader}
                    onPress={() => onPressAuthor && onPressAuthor(localPost.author.username)}
                  >
                    <View style={styles.postAvatar}>
                      <Text style={styles.postAvatarText}>{localPost.author.username[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.postUsername}>{localPost.author.username}</Text>
                      <Text style={styles.postTime}>{timeAgo(localPost.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.postContent}>{localPost.content}</Text>
                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleLikePress}>
                      <Ionicons
                        name={localPost.likedByMe ? 'heart' : 'heart-outline'}
                        size={18}
                        color={localPost.likedByMe ? colors.like : colors.textSecondary}
                      />
                      <Text style={styles.actionText}>{localPost.likeCount}</Text>
                    </TouchableOpacity>
                    <View style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.actionText}>{localPost.commentCount}</Text>
                    </View>
                  </View>
                  <Text style={styles.commentsDivider}>Comments</Text>
                </View>
              )
            }
            ListEmptyComponent={<Text style={styles.empty}>No comments yet. Be the first!</Text>}
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                <Text style={styles.commentUser}>{item.author.username}</Text>
                <Text style={styles.commentText}>{item.content}</Text>
              </View>
            )}
          />
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Write a comment..."
            value={text}
            onChangeText={setText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!text.trim() || posting) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || posting}
          >
            {posting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  postPreview: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  postAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  postAvatarText: { color: colors.textOnPrimary, fontWeight: '700' },
  postUsername: { fontWeight: '700', fontSize: 14, color: colors.textPrimary },
  postTime: { fontSize: 11, color: colors.textMuted },
  postContent: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  postActions: { flexDirection: 'row', marginTop: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginLeft: 6 },
  commentsDivider: { marginTop: 14, fontWeight: '700', fontSize: 13, color: colors.textSecondary },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  commentRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 10,
  },
  commentUser: { fontWeight: '700', fontSize: 13, color: colors.primary, marginBottom: 3 },
  commentText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 8,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radii.sm,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendText: { color: colors.textOnPrimary, fontWeight: '700' },
  error: { color: colors.danger, textAlign: 'center', paddingBottom: 8, fontSize: 13 },
});
