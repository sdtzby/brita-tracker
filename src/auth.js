import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebaseConfig.js';

const DEMO_USER_KEY = 'brita_demo_user';

export async function loginUser(email, password) {
  if (isFirebaseConfigured() && auth) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } else {
    // Demo / Offline modu
    if (!email || !password) {
      throw new Error("Lütfen e-posta ve şifre giriniz.");
    }
    const demoUser = {
      uid: 'demo_user_150',
      email: email,
      displayName: email.split('@')[0],
      isDemo: true
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: demoUser }));
    return demoUser;
  }
}

export async function registerUser(email, password) {
  if (isFirebaseConfigured() && auth) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  } else {
    return loginUser(email, password);
  }
}

export async function logoutUser() {
  if (isFirebaseConfigured() && auth) {
    await signOut(auth);
  } else {
    localStorage.removeItem(DEMO_USER_KEY);
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
  }
}

export function getCurrentUser() {
  if (isFirebaseConfigured() && auth) {
    return auth.currentUser;
  }
  const stored = localStorage.getItem(DEMO_USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function subscribeToAuth(callback) {
  if (isFirebaseConfigured() && auth) {
    return onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  } else {
    const initial = getCurrentUser();
    callback(initial);
    const handler = (e) => callback(e.detail);
    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  }
}
