import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, shadow } from '../theme/colors';

function timeAgo(isoLike) {
  // MySQL TIMESTAMP columns come back as UTC without a 'Z' suffix; normalize before parsing.
  const date = new Date(isoLike.replace(' ', 'T') + 'Z');
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function PostCard({ post, onToggleLike, onOpenComments, onPressAuthor }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerTouchable}
          onPress={() => onPressAuthor && onPressAuthor(post.author.username)}
        >
          <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <Text style={styles.avatarText}>{post.author.username[0]?.toUpperCase()}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{post.author.username}</Text>
            <Text style={styles.timestamp}>{timeAgo(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onToggleLike(post.id)}
          accessibilityLabel={post.likedByMe ? 'Unlike post' : 'Like post'}
        >
          <Ionicons
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={19}
            color={post.likedByMe ? colors.like : colors.textSecondary}
          />
          <Text style={styles.actionText}>{post.likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onOpenComments(post)}>
          <Ionicons name="chatbubble-outline" size={17} color={colors.textSecondary} />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default memo(PostCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginHorizontal: 14,
    marginVertical: 7,
    ...shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerTouchable: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 16 },
  username: { fontWeight: '700', fontSize: 15, color: colors.textPrimary },
  timestamp: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  content: { fontSize: 15, color: colors.textPrimary, lineHeight: 21, marginBottom: 12 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 28 },
  actionText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500', marginLeft: 6 },
});
