import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fetchPosts, toggleLike } from '../api/posts';
import PostCard from '../components/PostCard';
import CommentsModal from '../components/CommentsModal';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing, shadow } from '../theme/colors';

const PAGE_LIMIT = 10;

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [error, setError] = useState('');
  const [activePost, setActivePost] = useState(null);

  const load = useCallback(async (targetPage = 1, filter = usernameFilter, append = false) => {
    try {
      setError('');
      const { posts: newPosts, pagination } = await fetchPosts({
        page: targetPage,
        limit: PAGE_LIMIT,
        username: filter,
      });
      setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
      setPage(pagination.page);
      setTotalPages(pagination.totalPages);
    } catch (err) {
      setError(err.message);
    }
  }, [usernameFilter]);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    await load(1, usernameFilter, false);
    setLoading(false);
  }, [load, usernameFilter]);

  // Refresh the feed whenever this screen regains focus (e.g. after creating a post)
  useFocusEffect(
    useCallback(() => {
      initialLoad();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usernameFilter])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1, usernameFilter, false);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await load(page + 1, usernameFilter, true);
    setLoadingMore(false);
  };

  const handleToggleLike = async (postId) => {
    // Optimistic update for a snappy feel
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p
      )
    );
    try {
      const { liked, likeCount } = await toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likedByMe: liked, likeCount } : p))
      );
    } catch (err) {
      // Revert on failure
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: !p.likedByMe,
                likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
              }
            : p
        )
      );
      setError(err.message);
    }
  };

  const handleCommentAdded = (postId) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoBacking}>
              <Logo size={30} />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.greeting}>Hi, {user?.username}</Text>
              <Text style={styles.subGreeting}>Here's what's happening</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.logoutBtn}
            accessibilityLabel="Open profile"
          >
            <Ionicons name="person-outline" size={22} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by username..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            value={usernameFilter}
            onChangeText={setUsernameFilter}
          />
          {!!usernameFilter && (
            <TouchableOpacity onPress={() => setUsernameFilter('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onToggleLike={handleToggleLike}
              onOpenComments={(p) => setActivePost(p)}
              onPressAuthor={(username) => navigation.navigate('UserProfile', { username })}
            />
          )}
          contentContainerStyle={{ paddingVertical: 10, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={onLoadMore}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
              <Text style={styles.empty}>
                {usernameFilter ? `No posts from "${usernameFilter}"` : 'No posts yet — be the first!'}
              </Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={colors.primary} /> : null}
        />
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CreatePost')}
        accessibilityLabel="Create new post"
        style={styles.fabWrap}
      >
        <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
          <Ionicons name="add" size={24} color={colors.textOnPrimary} />
          <Text style={styles.fabLabel}>Create New Post</Text>
        </LinearGradient>
      </TouchableOpacity>

      <CommentsModal
        visible={!!activePost}
        post={activePost}
        onClose={() => setActivePost(null)}
        onCommentAdded={handleCommentAdded}
        onToggleLike={handleToggleLike}
        onPressAuthor={(username) => {
          setActivePost(null);
          navigation.navigate('UserProfile', { username });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 54,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logoBacking: {
    padding: 4,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  greeting: { fontSize: 17, fontWeight: '700', color: colors.textOnPrimary },
  subGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: spacing.lg,
    ...shadow.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  emptyWrap: { alignItems: 'center', marginTop: 70 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 10, fontSize: 14 },
  error: { color: colors.danger, textAlign: 'center', marginTop: 8, fontSize: 13 },
  fabWrap: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    borderRadius: 29,
    ...shadow.floating,
  },
  fab: {
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 15, marginLeft: 8 },
});
