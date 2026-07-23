import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session on cold start

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('authUser'),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistSession = useCallback(async (nextToken, nextUser) => {
    await AsyncStorage.setItem('authToken', nextToken);
    await AsyncStorage.setItem('authUser', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const signup = useCallback(
    async (username, email, password) => {
      const { token: t, user: u } = await authApi.signup(username, email, password);
      await persistSession(t, u);
      return u;
    },
    [persistSession]
  );

  const login = useCallback(
    async (identifier, password) => {
      const { token: t, user: u } = await authApi.login(identifier, password);
      await persistSession(t, u);
      return u;
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['authToken', 'authUser']);
    setToken(null);
    setUser(null);
  }, []);

  const updateUsername = useCallback(
    async (username) => {
      const { token: t, user: u } = await authApi.updateUsername(username);
      await persistSession(t, u);
      return u;
    },
    [persistSession]
  );

  const updatePassword = useCallback(async (currentPassword, newPassword) => {
    await authApi.updatePassword(currentPassword, newPassword);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, signup, login, logout, updateUsername, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
