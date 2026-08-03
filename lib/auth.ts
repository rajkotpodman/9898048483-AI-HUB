import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Helper to interact with our secure HttpOnly cookie API
const tokenStorage = {
  save: async (token: string) => {
    await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: token }),
    });
    cachedAccessToken = token;
  },
  load: async () => {
    const res = await fetch('/api/auth/token');
    const data = await res.json();
    cachedAccessToken = data.token;
    return cachedAccessToken;
  },
  clear: async () => {
    await fetch('/api/auth/token', { method: 'DELETE' });
    cachedAccessToken = null;
  }
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = await tokenStorage.load();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        // If we have a user but no token in memory/cookie, we need them to re-authenticate to get a fresh OAuth token
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      await tokenStorage.clear();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    await tokenStorage.save(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || await tokenStorage.load();
};

export const logout = async () => {
  await auth.signOut();
  await tokenStorage.clear();
};
