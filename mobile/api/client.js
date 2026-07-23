import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set Deployed backend URL in app.json -> expo.extra.apiUrl,
// or override here for local development, e.g. http://192.168.1.10:4000
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';

const client = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors so screens can just read `err.message`
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.errors?.[0]?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default client;
export { API_URL };
