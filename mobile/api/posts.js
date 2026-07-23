import client from './client';

export async function fetchPosts({ page = 1, limit = 10, username = '' } = {}) {
  const { data } = await client.get('/posts', {
    params: { page, limit, ...(username ? { username } : {}) },
  });
  return data; // { posts, pagination }
}

export async function createPost(content) {
  const { data } = await client.post('/posts', { content });
  return data.post;
}

export async function toggleLike(postId) {
  const { data } = await client.post(`/posts/${postId}/like`);
  return data; // { liked, likeCount }
}

export async function addComment(postId, content) {
  const { data } = await client.post(`/posts/${postId}/comment`, { content });
  return data.comment;
}

export async function fetchComments(postId, { page = 1, limit = 20 } = {}) {
  const { data } = await client.get(`/posts/${postId}/comments`, { params: { page, limit } });
  return data; // { comments, pagination }
}
