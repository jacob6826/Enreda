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
  const rawMsg = err?.message || '';

  if (!isFirebaseConfigured) {
    const missingStr = missingEnvVars.length > 0 ? ` Missing: ${missingEnvVars.join(', ')}.` : '';
    throw new Error(
      `Firebase Web App credentials are missing from your build environment.${missingStr} Please check Netlify Environment Variables or local .env file.`
    );
  }

  if (code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key') {
    throw new Error(
      `Firebase API Key was rejected by Google Cloud (${code}). If HTTP Referrer restrictions are enabled on your Web API Key in Google Cloud Console, please allow Desktop / file:// requests.`
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

  if (code === 'auth/network-request-failed') {
    throw new Error('Network error. Please check your internet connection and firewall settings.');
  }

  throw new Error(rawMsg ? `${rawMsg} (${code})` : 'Authentication failed. Please check your credentials.');
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) {
    handleAuthError({ code: 'auth/api-key-not-valid', message: 'Firebase auth instance not initialized.' });
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
    handleAuthError({ code: 'auth/api-key-not-valid', message: 'Firebase auth instance not initialized.' });
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
