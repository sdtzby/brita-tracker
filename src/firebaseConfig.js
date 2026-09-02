import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Varsayılan / Kayıtlı Firebase Konfigürasyonu
// Kullanıcı isterse doğrudan buraya yapıştırabilir veya uygulama içindeki Ayarlar (Dişli) ekranından kaydedebilir.
const DEFAULT_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export function getStoredFirebaseConfig() {
  const local = localStorage.getItem('brita_firebase_config');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    } catch (e) {
      console.warn("Geçersiz yerel Firebase yapılandırması:", e);
    }
  }
  return DEFAULT_CONFIG;
}

export function saveStoredFirebaseConfig(config) {
  localStorage.setItem('brita_firebase_config', JSON.stringify(config));
}

export function isFirebaseConfigured(config = getStoredFirebaseConfig()) {
  return Boolean(config && config.apiKey && config.projectId && config.apiKey.length > 5);
}

let appInstance = null;
let authInstance = null;
let dbInstance = null;

export function initFirebase() {
  const config = getStoredFirebaseConfig();
  
  if (!isFirebaseConfigured(config)) {
    console.warn("Firebase yapılandırması henüz girilmedi. Yerel Demo Modu devrede.");
    return { app: null, auth: null, db: null, isDemo: true };
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    return { app: appInstance, auth: authInstance, db: dbInstance, isDemo: false };
  } catch (err) {
    console.error("Firebase başlatma hatası:", err);
    return { app: null, auth: null, db: null, isDemo: true, error: err.message };
  }
}

export const { app, auth, db } = initFirebase();
