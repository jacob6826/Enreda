import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebaseConfig';

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase API key is not configured. Please add your credentials in .env or Netlify settings.');
  }
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase API key is not configured. Please add your credentials in .env or Netlify settings.');
  }
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
