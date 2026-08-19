import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured, missingEnvVars } from './firebaseConfig';

export interface AuthState {
  user: User | null;
  loading: boolean;
}

function handleAuthError(err: any): never {
  const code = err?.code || '';
  if (!isFirebaseConfigured || code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key') {
    const missingStr = missingEnvVars.length > 0 ? ` Missing: ${missingEnvVars.join(', ')}.` : '';
    throw new Error(
      `Firebase Web App credentials are missing or invalid in your build environment.${missingStr} Please check Netlify Environment Variables (ensure keys start with VITE_ and are not secrets) or your local .env file.`
    );
  }
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    throw new Error('Invalid email or password. Please check your spelling or click "Create Account".');
  }
  if (code === 'auth/email-already-in-use') {
    throw new Error('An account with this email already exists. Click "Sign In" to log in.');
  }
  if (code === 'auth/weak-password') {
    throw new Error('Password should be at least 6 characters long.');
  }
  throw new Error(err.message || 'Authentication failed. Please check your credentials.');
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) {
    handleAuthError({ code: 'auth/api-key-not-valid' });
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (err) {
    handleAuthError(err);
  }
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) {
    handleAuthError({ code: 'auth/api-key-not-valid' });
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (err) {
    handleAuthError(err);
  }
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
