import client from './client';

export async function signup(username, email, password) {
  const { data } = await client.post('/auth/signup', { username, email, password });
  return data; // { token, user }
}

export async function login(identifier, password) {
  const { data } = await client.post('/auth/login', { identifier, password });
  return data; // { token, user }
}

export async function getMe() {
  const { data } = await client.get('/auth/me');
  return data.user;
}

export async function registerFcmToken(token) {
  const { data } = await client.post('/auth/fcm-token', { token });
  return data;
}

export async function updateUsername(username) {
  const { data } = await client.patch('/auth/username', { username });
  return data; // { token, user }
}

export async function updatePassword(currentPassword, newPassword) {
  const { data } = await client.patch('/auth/password', { currentPassword, newPassword });
  return data; // { ok }
}

export async function getUserByUsername(username) {
  const { data } = await client.get(`/users/${encodeURIComponent(username)}`);
  return data.user; // { id, username, email }
}
