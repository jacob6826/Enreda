import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import {
  subscribeToAuth,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
} from '../services/firebase/authService';
import { isFirebaseConfigured } from '../services/firebase/firebaseConfig';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    isFirebaseConfigured,
    loginWithEmail,
    registerWithEmail,
    logout: logoutUser,
  };
}
