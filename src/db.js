import { db, isFirebaseConfigured } from './firebaseConfig.js';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';

export const DEFAULT_FILTER_STATE = {
  targetCapacity: 150.0,
  currentUsed: 0.0,
  startDate: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
};

export function getActiveLocation() {
  return localStorage.getItem('brita_active_location') || 'work';
}

export function setActiveLocation(locationId) {
  localStorage.setItem('brita_active_location', locationId);
}

function getStorageKeys(locationId = 'work') {
  return {
    stateKey: `brita_filter_state_${locationId}`,
    logsKey: `brita_water_logs_${locationId}`
  };
}

function getLocalState(locationId = 'work') {
  try {
    const { stateKey } = getStorageKeys(locationId);
    let data = localStorage.getItem(stateKey);
    // Geriye dönük uyumluluk: work için eski key'den oku
    if (!data && locationId === 'work') {
      data = localStorage.getItem('brita_filter_state');
    }
    return data ? JSON.parse(data) : { ...DEFAULT_FILTER_STATE };
  } catch (e) {
    return { ...DEFAULT_FILTER_STATE };
  }
}

function setLocalState(state, locationId = 'work') {
  const { stateKey } = getStorageKeys(locationId);
  localStorage.setItem(stateKey, JSON.stringify(state));
  if (locationId === 'work') {
    localStorage.setItem('brita_filter_state', JSON.stringify(state));
  }
}

function getLocalLogs(locationId = 'work') {
  try {
    const { logsKey } = getStorageKeys(locationId);
    let data = localStorage.getItem(logsKey);
    // Geriye dönük uyumluluk: work için eski key'den oku
    if (!data && locationId === 'work') {
      data = localStorage.getItem('brita_water_logs');
    }
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function setLocalLogs(logs, locationId = 'work') {
  const { logsKey } = getStorageKeys(locationId);
  localStorage.setItem(logsKey, JSON.stringify(logs));
  if (locationId === 'work') {
    localStorage.setItem('brita_water_logs', JSON.stringify(logs));
  }
}

export function subscribeToData(userId, locationId = 'work', callback) {
  if (!userId) return () => {};

  if (isFirebaseConfigured() && db) {
    const stateDocRef = doc(db, 'users', userId, 'data', `filter_${locationId}`);
    const logsColRef = collection(db, 'users', userId, `logs_${locationId}`);
    const logsQuery = query(logsColRef, orderBy('timestamp', 'desc'), limit(50));

    let currentState = { ...DEFAULT_FILTER_STATE };
    let currentLogs = [];

    const unsubState = onSnapshot(stateDocRef, (docSnap) => {
      if (docSnap.exists()) {
        currentState = docSnap.data();
      } else {
        setDoc(stateDocRef, currentState);
      }
      callback({ state: currentState, logs: currentLogs, isCloud: true, locationId });
    }, (error) => {
      console.error("Firestore durum dinleme hatası:", error);
    });

    const unsubLogs = onSnapshot(logsQuery, (querySnap) => {
      currentLogs = [];
      querySnap.forEach((doc) => {
        const item = doc.data();
        currentLogs.push({
          id: doc.id,
          amount: Number(item.amount) || 0,
          label: item.label || 'Su',
          timestamp: item.timestamp || new Date().toISOString()
        });
      });
      callback({ state: currentState, logs: currentLogs, isCloud: true, locationId });
    }, (error) => {
      console.error("Firestore kayıtlar dinleme hatası:", error);
    });

    return () => {
      unsubState();
      unsubLogs();
    };
  } else {
    // Lokal Mod (LocalStorage)
    const notifyLocal = () => {
      const state = getLocalState(locationId);
      const logs = getLocalLogs(locationId);
      callback({ state, logs, isCloud: false, locationId });
    };

    notifyLocal();

    const handler = (e) => {
      if (!e.detail || e.detail.locationId === locationId || !e.detail.locationId) {
        notifyLocal();
      }
    };
    window.addEventListener('local-db-updated', handler);
    return () => {
      window.removeEventListener('local-db-updated', handler);
    };
  }
}

export async function addWaterLog(userId, amount, label = 'Su Tüketimi', locationId = 'work') {
  amount = parseFloat(amount);
  if (isNaN(amount) || amount <= 0) return { success: false };

  if (isFirebaseConfigured() && db && userId) {
    const stateDocRef = doc(db, 'users', userId, 'data', `filter_${locationId}`);
    const stateSnap = await getDoc(stateDocRef);
    let state = stateSnap.exists() ? stateSnap.data() : { ...DEFAULT_FILTER_STATE };

    const target = Number(state.targetCapacity || 150.0);
    const used = Number(state.currentUsed || 0.0);
    const remaining = Math.max(0, Math.round((target - used) * 100) / 100);

    if (remaining <= 0) {
      return { 
        success: false, 
        filterEmpty: true, 
        message: 'Filtre kapasitesi doldu (150L tükendi). Lütfen yeni filtre takıp sayacı sıfırlayınız.' 
      };
    }

    const newUsed = Math.min(target, Math.round((used + amount) * 100) / 100);
    state.currentUsed = newUsed;
    state.lastUpdated = new Date().toISOString();
    await setDoc(stateDocRef, state, { merge: true });

    const logsColRef = collection(db, 'users', userId, `logs_${locationId}`);
    await addDoc(logsColRef, {
      amount,
      label,
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } else {
    const state = getLocalState(locationId);
    const target = Number(state.targetCapacity || 150.0);
    const used = Number(state.currentUsed || 0.0);
    const remaining = Math.max(0, Math.round((target - used) * 100) / 100);

    if (remaining <= 0) {
      return { 
        success: false, 
        filterEmpty: true, 
        message: 'Filtre kapasitesi doldu (150L tükendi). Lütfen yeni filtre takıp sayacı sıfırlayınız.' 
      };
    }

    state.currentUsed = Math.min(target, Math.round((used + amount) * 100) / 100);
    state.lastUpdated = new Date().toISOString();
    setLocalState(state, locationId);

    const logs = getLocalLogs(locationId);
    logs.unshift({
      id: 'log_' + Date.now(),
      amount,
      label,
      timestamp: new Date().toISOString()
    });
    setLocalLogs(logs.slice(0, 50), locationId);
    window.dispatchEvent(new CustomEvent('local-db-updated', { detail: { locationId } }));
    return { success: true };
  }
}

export async function deleteWaterLog(userId, logId, amount, locationId = 'work') {
  amount = parseFloat(amount) || 0;

  if (isFirebaseConfigured() && db && userId) {
    const stateDocRef = doc(db, 'users', userId, 'data', `filter_${locationId}`);
    const stateSnap = await getDoc(stateDocRef);
    if (stateSnap.exists()) {
      let state = stateSnap.data();
      state.currentUsed = Math.max(0, Math.round(((state.currentUsed || 0) - amount) * 100) / 100);
      state.lastUpdated = new Date().toISOString();
      await setDoc(stateDocRef, state, { merge: true });
    }

    const logRef = doc(db, 'users', userId, `logs_${locationId}`, logId);
    await deleteDoc(logRef);
  } else {
    const state = getLocalState(locationId);
    state.currentUsed = Math.max(0, Math.round(((state.currentUsed || 0) - amount) * 100) / 100);
    state.lastUpdated = new Date().toISOString();
    setLocalState(state, locationId);

    let logs = getLocalLogs(locationId);
    logs = logs.filter(l => l.id !== logId);
    setLocalLogs(logs, locationId);
    window.dispatchEvent(new CustomEvent('local-db-updated', { detail: { locationId } }));
  }
}

export async function clearTodayLogs(userId, locationId = 'work') {
  const todayStr = new Date().toDateString();
  if (isFirebaseConfigured() && db && userId) {
    // Cloud sync logic
  } else {
    let logs = getLocalLogs(locationId);
    logs = logs.filter(l => new Date(l.timestamp).toDateString() !== todayStr);
    setLocalLogs(logs, locationId);
    window.dispatchEvent(new CustomEvent('local-db-updated', { detail: { locationId } }));
  }
}

export async function resetFilterCycle(userId, newTarget = 150.0, startDate = new Date().toISOString(), locationId = 'work') {
  const resetData = {
    targetCapacity: Number(newTarget) || 150.0,
    currentUsed: 0.0,
    startDate: startDate,
    lastUpdated: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db && userId) {
    const stateDocRef = doc(db, 'users', userId, 'data', `filter_${locationId}`);
    await setDoc(stateDocRef, resetData);
  } else {
    setLocalState(resetData, locationId);
    window.dispatchEvent(new CustomEvent('local-db-updated', { detail: { locationId } }));
  }
}

export async function resetAllData(userId, locationId = 'work') {
  const freshData = {
    targetCapacity: 150.0,
    currentUsed: 0.0,
    startDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db && userId) {
    const stateDocRef = doc(db, 'users', userId, 'data', `filter_${locationId}`);
    await setDoc(stateDocRef, freshData);
  } else {
    setLocalState(freshData, locationId);
    setLocalLogs([], locationId);
    window.dispatchEvent(new CustomEvent('local-db-updated', { detail: { locationId } }));
  }
}
