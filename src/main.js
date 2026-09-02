import { subscribeToAuth, loginUser, registerUser, logoutUser, getCurrentUser } from './auth.js';
import { 
  subscribeToData, 
  addWaterLog, 
  deleteWaterLog, 
  resetFilterCycle, 
  clearTodayLogs, 
  resetAllData,
  getActiveLocation,
  setActiveLocation
} from './db.js';
import { getStoredFirebaseConfig, saveStoredFirebaseConfig, isFirebaseConfigured } from './firebaseConfig.js';
import { WaterGauge } from './gauge.js';
import { setupPWA } from './pwa.js';

// DOM Elements - Navigation & Views
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const tabViews = {
  tabToday: document.getElementById('tabToday'),
  tabStats: document.getElementById('tabStats'),
  tabFilter: document.getElementById('tabFilter')
};
const dockTabs = document.querySelectorAll('.dock-tab');
const headerFilterPill = document.getElementById('headerFilterPill');
const headerFilterRemaining = document.getElementById('headerFilterRemaining');
const openFilterTabFromToday = document.getElementById('openFilterTabFromToday');

// Location Switcher Elements
const locPillBtns = document.querySelectorAll('.loc-pill-btn');
const dosageGrid = document.getElementById('dosageGrid');
const actionHeadingTitle = document.getElementById('actionHeadingTitle');
const actionHeadingHint = document.getElementById('actionHeadingHint');
const filterTabLocationBadge = document.getElementById('filterTabLocationBadge');

// Header
const headerDate = document.getElementById('headerDate');
const greetingTitle = document.getElementById('greetingTitle');

// Auth Form
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authTogglePrompt = document.getElementById('authTogglePrompt');
const authToggleBtn = document.getElementById('authToggleBtn');
const authError = document.getElementById('authError');
const logoutBtns = document.querySelectorAll('#logoutBtn, .btn-settings-row.logout');

// Gauge & Today View Elements
const gaugeCanvas = document.getElementById('gaugeCanvas');
const remainingLitersEl = document.getElementById('remainingLiters');
const remainingPercentEl = document.getElementById('remainingPercent');
const consumedLitersEl = document.getElementById('consumedLiters');
const filterProgressBar = document.getElementById('filterProgressBar');
const healthPill = document.getElementById('healthPill');

const todayIntakeDisplay = document.getElementById('todayIntakeDisplay');
const todayIntakeMlDisplay = document.getElementById('todayIntakeMlDisplay');
const dailyGoalDisplay = document.getElementById('dailyGoalDisplay');
const todayPercentBadge = document.getElementById('todayPercentBadge');
const todayProgressBar = document.getElementById('todayProgressBar');
const todayStatusText = document.getElementById('todayStatusText');
const toggleDailyGoalBtn = document.getElementById('toggleDailyGoalBtn');
const todayDrinksList = document.getElementById('todayDrinksList');
const todayDrinksCount = document.getElementById('todayDrinksCount');
const resetAllLogsBtn = document.getElementById('resetAllLogsBtn');
const resetAllDataFilterTabBtn = document.getElementById('resetAllDataFilterTabBtn');

// Stats View Elements
const weeklyChart = document.getElementById('weeklyChart');
const statsTotalConsumed = document.getElementById('statsTotalConsumed');
const statsDailyAvg = document.getElementById('statsDailyAvg');
const statsDaysUsed = document.getElementById('statsDaysUsed');
const statsEstimatedFinish = document.getElementById('statsEstimatedFinish');
const historyList = document.getElementById('historyList');
const logCountBadge = document.getElementById('logCountBadge');
const undoActionBtn = document.getElementById('undoActionBtn');

// Filter View Elements
const filterTabRemaining = document.getElementById('filterTabRemaining');
const filterTabConsumed = document.getElementById('filterTabConsumed');
const filterTabProgressBar = document.getElementById('filterTabProgressBar');
const filterStartDateEl = document.getElementById('filterStartDate');
const filterDaysUsedEl = document.getElementById('filterDaysUsed');
const dailyAvgConsumptionEl = document.getElementById('dailyAvgConsumption');
const estimatedEndDateEl = document.getElementById('estimatedEndDate');
const connectionPill = document.getElementById('connectionPill');
const connectionText = document.getElementById('connectionText');
const filterDepletedBanner = document.getElementById('filterDepletedBanner');
const bannerResetBtn = document.getElementById('bannerResetBtn');

// Modals
const customModal = document.getElementById('customModal');
const resetModal = document.getElementById('resetModal');
const settingsModal = document.getElementById('settingsModal');
const openCustomModalBtn = document.getElementById('openCustomModalBtn');
const openResetModalBtn = document.getElementById('openResetModalBtn');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const openFirebaseModalBtn = document.getElementById('openFirebaseModalBtn');
const settingsFromAuthBtn = document.getElementById('settingsFromAuthBtn');

// Custom Input Elements
const customSlider = document.getElementById('customSlider');
const customAmountDisplay = document.getElementById('customAmountDisplay');
const customBtnAmount = document.getElementById('customBtnAmount');
const stepperMinus = document.getElementById('stepperMinus');
const stepperPlus = document.getElementById('stepperPlus');
const customLabelInput = document.getElementById('customLabelInput');
const submitCustomAmountBtn = document.getElementById('submitCustomAmountBtn');

// Reset Elements
const resetStartDateInput = document.getElementById('resetStartDateInput');
const resetCapacityInput = document.getElementById('resetCapacityInput');
const confirmResetBtn = document.getElementById('confirmResetBtn');

// Settings Elements
const cfgApiKey = document.getElementById('cfgApiKey');
const cfgProjectId = document.getElementById('cfgProjectId');
const cfgAuthDomain = document.getElementById('cfgAuthDomain');
const cfgAppId = document.getElementById('cfgAppId');
const saveFirebaseSettingsBtn = document.getElementById('saveFirebaseSettingsBtn');
const clearFirebaseSettingsBtn = document.getElementById('clearFirebaseSettingsBtn');

// Toast
const floatingToast = document.getElementById('floatingToast');
const toastMessage = document.getElementById('toastMessage');
const toastUndoBtn = document.getElementById('toastUndoBtn');

// PWA
const pwaBanner = document.getElementById('pwaBanner');
const pwaInstallBtn = document.getElementById('pwaInstallBtn');

// Application State
let currentUser = null;
let currentLocation = getActiveLocation(); // 'work' | 'home'
let currentFilterState = { targetCapacity: 150.0, currentUsed: 0.0, startDate: new Date().toISOString() };
let currentLogs = [];
let lastAddedLog = null;
let toastTimeout = null;
let isRegisterMode = false;
let waterGauge = null;
let dataUnsubscribe = null;
let isCloudConnection = false;
let availableGoals = [1.5, 2.0, 2.5, 3.0];
let dailyWaterGoal = parseFloat(localStorage.getItem('brita_daily_goal')) || 2.0;

// Toggle Daily Hydration Goal
if (toggleDailyGoalBtn) {
  toggleDailyGoalBtn.addEventListener('click', () => {
    const currIdx = availableGoals.indexOf(dailyWaterGoal);
    dailyWaterGoal = availableGoals[(currIdx + 1) % availableGoals.length];
    localStorage.setItem('brita_daily_goal', dailyWaterGoal.toString());
    vibrate(15);
    updateUI(currentFilterState, currentLogs, isCloudConnection);
  });
}

// Reset All Logs & Filter (Kayıtları Sıfırla)
async function handleCompleteReset() {
  const locName = currentLocation === 'home' ? 'Ev' : 'İş Yeri';
  if (confirm(`Bu işlem ${locName} profilindeki tüm su kayıtlarını ve filtre sayacını sıfırlayacaktır.\n\n• Filtre: 150.0 Litre (%100)\n• Kayıtlar: 0 adet\n• Bugünkü Hidrasyon: 0.00 L\n\nOnaylıyor musunuz?`)) {
    vibrate([40, 80, 40]);
    await resetAllData(currentUser ? currentUser.uid : null, currentLocation);
  }
}

if (resetAllLogsBtn) {
  resetAllLogsBtn.addEventListener('click', handleCompleteReset);
}
if (resetAllDataFilterTabBtn) {
  resetAllDataFilterTabBtn.addEventListener('click', handleCompleteReset);
}

// Initialize Water Gauge
if (gaugeCanvas) {
  waterGauge = new WaterGauge(gaugeCanvas);
}

// Haptic feedback helper
function vibrate(ms = 15) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch (e) {}
  }
}

// Set Date and Time-based Greeting
function initHeaderGreeting() {
  const now = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  const dateStr = now.toLocaleDateString('tr-TR', options);
  headerDate.textContent = `Bugün, ${dateStr}`;

  const hour = now.getHours();
  if (hour >= 5 && hour < 12) {
    greetingTitle.textContent = 'Günaydın ☀️';
  } else if (hour >= 12 && hour < 18) {
    greetingTitle.textContent = 'İyi çalışmalar 👋';
  } else {
    greetingTitle.textContent = 'İyi akşamlar 🌙';
  }
}
initHeaderGreeting();

// ---------------- LOCATION SWITCHER LOGIC ----------------
function renderDosageButtons(locationId) {
  if (!dosageGrid) return;

  if (locationId === 'home') {
    // Ev için: 1.5 L ve 3.0 L
    dosageGrid.innerHTML = `
      <button class="dosage-btn" data-amount="1.50" data-label="1.5 L Sürahi">
        <div class="dosage-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 3h12l-2 16a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L6 3z"/>
            <line x1="6" y1="8" x2="18" y2="8"/>
            <line x1="7" y1="13" x2="17" y2="13" stroke-dasharray="2 2"/>
          </svg>
        </div>
        <span class="dosage-volume">1.5 <small>L</small></span>
        <span class="dosage-sub">Sürahi Haznesi</span>
      </button>

      <button class="dosage-btn" data-amount="3.00" data-label="3.0 L XL Hazne / Kettle">
        <div class="dosage-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="5" width="14" height="15" rx="3"/>
            <path d="M9 2h6v3H9z"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke-dasharray="2 2"/>
          </svg>
        </div>
        <span class="dosage-volume">3.0 <small>L</small></span>
        <span class="dosage-sub">XL Hazne / Kettle</span>
      </button>
    `;
    if (actionHeadingTitle) actionHeadingTitle.textContent = 'Ev Su Tüketimi Ekle';
    if (actionHeadingHint) actionHeadingHint.textContent = '1.5 L veya 3 L tek dokunuşla kaydet';
  } else {
    // İş Yeri için: 200 ml, 500 ml, 750 ml
    dosageGrid.innerHTML = `
      <button class="dosage-btn" data-amount="0.20" data-label="200 ml Bardak">
        <div class="dosage-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 4h10l-1.5 15a2 2 0 0 1-2 1.8H10.5a2 2 0 0 1-2-1.8L7 4z"/>
            <line x1="6" y1="4" x2="18" y2="4"/>
            <line x1="8" y1="11" x2="16" y2="11" stroke-dasharray="2 2"/>
          </svg>
        </div>
        <span class="dosage-volume">200 <small>ml</small></span>
        <span class="dosage-sub">Bardak</span>
      </button>

      <button class="dosage-btn" data-amount="0.50" data-label="500 ml Şişe">
        <div class="dosage-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 2h4v3h-4z"/>
            <path d="M10 5l-2 3v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8l-2-3"/>
            <line x1="8" y1="13" x2="16" y2="13" stroke-dasharray="2 2"/>
          </svg>
        </div>
        <span class="dosage-volume">500 <small>ml</small></span>
        <span class="dosage-sub">Şişe</span>
      </button>

      <button class="dosage-btn" data-amount="0.75" data-label="750 ml Termos">
        <div class="dosage-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="7" y="5" width="10" height="15" rx="3"/>
            <path d="M9 2h6v3H9z"/>
            <line x1="7" y1="11" x2="17" y2="11" stroke-dasharray="2 2"/>
          </svg>
        </div>
        <span class="dosage-volume">750 <small>ml</small></span>
        <span class="dosage-sub">Termos</span>
      </button>
    `;
    if (actionHeadingTitle) actionHeadingTitle.textContent = 'Hızlı Tüketim Ekle';
    if (actionHeadingHint) actionHeadingHint.textContent = 'Tek dokunuşla kaydet';
  }

  attachDosageButtonHandlers();
}

function switchLocation(newLocation) {
  if (currentLocation === newLocation) return;
  currentLocation = newLocation;
  setActiveLocation(newLocation);
  vibrate(20);

  locPillBtns.forEach(btn => {
    if (btn.dataset.loc === newLocation) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (filterTabLocationBadge) {
    filterTabLocationBadge.textContent = newLocation === 'home' ? '🏠 EV FİLTRESİ • 150L' : '🏢 İŞ YERİ FİLTRESİ • 150L';
  }

  renderDosageButtons(newLocation);

  // Re-subscribe data for new location
  if (currentUser) {
    if (dataUnsubscribe) dataUnsubscribe();
    dataUnsubscribe = subscribeToData(currentUser.uid, currentLocation, ({ state, logs, isCloud }) => {
      updateUI(state, logs, isCloud);
    });
  }
}

locPillBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    switchLocation(btn.dataset.loc);
  });
});

// Sync initial location UI
locPillBtns.forEach(btn => {
  if (btn.dataset.loc === currentLocation) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
});
if (filterTabLocationBadge) {
  filterTabLocationBadge.textContent = currentLocation === 'home' ? '🏠 EV FİLTRESİ • 150L' : '🏢 İŞ YERİ FİLTRESİ • 150L';
}
renderDosageButtons(currentLocation);

// ---------------- TAB NAVIGATION ----------------
function switchTab(targetTabId) {
  Object.keys(tabViews).forEach(tabId => {
    const view = tabViews[tabId];
    if (tabId === targetTabId) {
      view.style.display = 'flex';
    } else {
      view.style.display = 'none';
    }
  });

  dockTabs.forEach(tab => {
    if (tab.dataset.tab === targetTabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

dockTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    vibrate(10);
    switchTab(tab.dataset.tab);
  });
});

if (headerFilterPill) {
  headerFilterPill.addEventListener('click', () => {
    vibrate(10);
    switchTab('tabFilter');
  });
}

if (openFilterTabFromToday) {
  openFilterTabFromToday.addEventListener('click', () => {
    vibrate(10);
    switchTab('tabFilter');
  });
}

// ---------------- AUTH LOGIC ----------------
function showAuthError(msg) {
  authError.textContent = msg;
  authError.classList.add('visible');
}

function clearAuthError() {
  authError.textContent = '';
  authError.classList.remove('visible');
}

authToggleBtn.addEventListener('click', () => {
  isRegisterMode = !isRegisterMode;
  clearAuthError();
  if (isRegisterMode) {
    authSubmitBtn.textContent = 'Kayıt Ol ve Başla';
    authTogglePrompt.textContent = 'Zaten hesabınız var mı?';
    authToggleBtn.textContent = 'Giriş Yap';
  } else {
    authSubmitBtn.textContent = 'Giriş Yap';
    authTogglePrompt.textContent = 'Hesabınız yok mu?';
    authToggleBtn.textContent = 'Kayıt Ol';
  }
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAuthError();
  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) {
    showAuthError('Lütfen e-posta ve şifrenizi girin.');
    return;
  }

  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = 'Giriş yapılıyor...';

  try {
    if (isRegisterMode) {
      await registerUser(email, password);
    } else {
      await loginUser(email, password);
    }
  } catch (err) {
    console.error("Auth hatası:", err);
    let msg = err.message || 'Giriş yapılamadı.';
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
      msg = 'E-posta veya şifre hatalı.';
    } else if (msg.includes('auth/email-already-in-use')) {
      msg = 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.';
    } else if (msg.includes('auth/weak-password')) {
      msg = 'Şifreniz en az 6 karakter olmalıdır.';
    }
    showAuthError(msg);
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isRegisterMode ? 'Kayıt Ol ve Başla' : 'Giriş Yap';
  }
});

logoutBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    if (confirm('Oturumu kapatmak istediğinize emin misiniz?')) {
      if (dataUnsubscribe) dataUnsubscribe();
      await logoutUser();
    }
  });
});

// ---------------- DATA & DASHBOARD UPDATES ----------------
function updateUI(state, logs, isCloud) {
  currentFilterState = state;
  currentLogs = logs;
  isCloudConnection = isCloud;

  const target = Number(state.targetCapacity || 150.0);
  const used = Number(state.currentUsed || 0.0);
  const remaining = Math.max(0, Math.round((target - used) * 100) / 100);
  const percent = Math.max(0, Math.min(100, Math.round((remaining / target) * 100)));

  // 1. Update Gauge & Header Pill
  remainingLitersEl.textContent = remaining.toFixed(1);
  remainingPercentEl.textContent = `%${percent}`;
  if (consumedLitersEl) consumedLitersEl.textContent = used.toFixed(1);
  headerFilterRemaining.textContent = `${remaining.toFixed(1)} L`;

  if (waterGauge) {
    waterGauge.setPercent(percent);
  }

  // Health Pill Badge
  if (healthPill) {
    if (percent < 15) {
      healthPill.className = 'health-pill danger';
      healthPill.innerHTML = `<span class="pulse-dot"></span> %${percent} • Değişim Gerekli`;
    } else if (percent < 35) {
      healthPill.className = 'health-pill warning';
      healthPill.innerHTML = `<span class="pulse-dot"></span> %${percent} • Filtre Azalıyor`;
    } else {
      healthPill.className = 'health-pill healthy';
      healthPill.innerHTML = `<span class="pulse-dot"></span> %${percent} • Filtre Aktif`;
    }
  }

  // Progress Bars (Filter Tab)
  if (filterProgressBar) filterProgressBar.style.width = `${percent}%`;
  if (filterTabProgressBar) {
    filterTabProgressBar.style.width = `${percent}%`;
    if (percent < 15) {
      filterTabProgressBar.style.background = 'var(--status-danger)';
    } else if (percent < 35) {
      filterTabProgressBar.style.background = 'var(--status-warning)';
    } else {
      filterTabProgressBar.style.background = 'var(--brita-blue)';
    }
  }

  // 2. Today's Intake Calculation
  const todayStr = new Date().toDateString();
  const todayLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return !isNaN(logDate.getTime()) && logDate.toDateString() === todayStr;
  });

  const todayIntake = todayLogs.reduce((acc, l) => acc + Number(l.amount || 0), 0);
  const todayMl = Math.round(todayIntake * 1000);

  if (todayIntakeDisplay) todayIntakeDisplay.textContent = todayIntake.toFixed(2);
  if (todayIntakeMlDisplay) todayIntakeMlDisplay.textContent = `(${todayMl} ml)`;
  if (dailyGoalDisplay) dailyGoalDisplay.textContent = dailyWaterGoal.toFixed(2);

  const goalRatio = Math.min(100, Math.round((todayIntake / dailyWaterGoal) * 100));
  const actualGoalPercent = Math.round((todayIntake / dailyWaterGoal) * 100);

  if (todayPercentBadge) todayPercentBadge.textContent = `%${actualGoalPercent}`;
  if (todayProgressBar) todayProgressBar.style.width = `${goalRatio}%`;

  if (todayStatusText) {
    if (todayIntake >= dailyWaterGoal) {
      todayStatusText.textContent = `🎉 Harika! Günlük ${dailyWaterGoal.toFixed(1)}L hedefinize ulaştınız!`;
      todayStatusText.style.color = 'var(--status-healthy)';
    } else {
      const left = Math.max(0, Math.round((dailyWaterGoal - todayIntake) * 100) / 100);
      todayStatusText.textContent = `${left.toFixed(2)} L kaldı • Hedefinize doğru ilerleyin! 💧`;
      todayStatusText.style.color = 'var(--text-mid)';
    }
  }

  // Render Today's Drinks Timeline
  renderTodayDrinks(todayLogs);

  // 3. Date and Lifetime Filter Calculations
  const startDate = new Date(state.startDate || Date.now());
  filterStartDateEl.textContent = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

  const now = new Date();
  const diffDays = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
  filterDaysUsedEl.textContent = `${diffDays} gün`;
  statsDaysUsed.textContent = diffDays;

  const dailyAvg = diffDays > 0 ? (used / diffDays) : 0;
  const dailyAvgStr = dailyAvg > 0 ? `${dailyAvg.toFixed(2)} L/g` : '-';
  dailyAvgConsumptionEl.textContent = dailyAvgStr;
  statsDailyAvg.textContent = dailyAvgStr;

  statsTotalConsumed.textContent = used.toFixed(1);

  if (dailyAvg > 0.1 && remaining > 0) {
    const daysLeft = Math.round(remaining / dailyAvg);
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + daysLeft);
    const estStr = `~${daysLeft} gün sonra`;
    estimatedEndDateEl.textContent = estStr;
    statsEstimatedFinish.textContent = estStr;
  } else if (remaining <= 0) {
    estimatedEndDateEl.textContent = 'Filtre Doldu';
    statsEstimatedFinish.textContent = 'Filtre Doldu';
    estimatedEndDateEl.style.color = 'var(--status-danger)';
    statsEstimatedFinish.style.color = 'var(--status-danger)';
  } else {
    estimatedEndDateEl.textContent = 'Hesaplanıyor';
    statsEstimatedFinish.textContent = 'Hesaplanıyor';
  }

  // Filter Tab Stats
  filterTabRemaining.innerHTML = `${remaining.toFixed(1)} <small>L</small>`;
  filterTabConsumed.innerHTML = `${used.toFixed(1)} <small>/ ${target.toFixed(0)} L</small>`;

  // 4. Render Weekly Bar Chart
  renderWeeklyChart(logs);

  // 5. Connection Status
  if (isCloud) {
    connectionPill.className = 'connection-status cloud';
    connectionText.textContent = 'Bulut Senkron';
  } else {
    connectionPill.className = 'connection-status local';
    connectionText.textContent = 'Lokal Demo';
  }

  // 6. Render Full Activity Log (Stats Tab)
  renderLogs(logs);

  // Undo button status
  undoActionBtn.disabled = logs.length === 0;

  // 7. Depleted Filter Banner & Guard
  const isDepleted = remaining <= 0;
  if (filterDepletedBanner) {
    filterDepletedBanner.style.display = isDepleted ? 'flex' : 'none';
  }
  document.querySelectorAll('.dosage-btn, .quick-btn').forEach(btn => {
    if (isDepleted) {
      btn.style.opacity = '0.4';
      btn.style.filter = 'grayscale(0.8)';
      btn.style.pointerEvents = 'none';
    } else {
      btn.style.opacity = '';
      btn.style.filter = '';
      btn.style.pointerEvents = '';
    }
  });
  if (openCustomModalBtn) {
    if (isDepleted) {
      openCustomModalBtn.style.opacity = '0.4';
      openCustomModalBtn.style.pointerEvents = 'none';
    } else {
      openCustomModalBtn.style.opacity = '';
      openCustomModalBtn.style.pointerEvents = '';
    }
  }
}

// ---------------- TODAY'S DRINKS LIST (SON 5 KAYIT) ----------------
function renderTodayDrinks(todayLogs) {
  const totalCount = todayLogs.length;
  todayDrinksCount.textContent = totalCount > 5 ? `Son 5 / ${totalCount} kayıt` : `${totalCount} kayıt`;

  if (!todayLogs || totalCount === 0) {
    todayDrinksList.innerHTML = '<div class="empty-hint">Bugün henüz su kaydı girilmedi.</div>';
    return;
  }

  // Sadece son 5 kaydı göster
  const recentLogs = todayLogs.slice(0, 5);

  let html = recentLogs.map(log => {
    const d = new Date(log.timestamp);
    const timeStr = isNaN(d.getTime()) ? '' : d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item">
        <div class="history-info">
          <span class="history-label">${escapeHtml(log.label)}</span>
          <span class="history-time">${timeStr}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span class="history-amount">+${Number(log.amount).toFixed(2)} L</span>
          <button class="history-del-btn" data-id="${log.id}" data-amount="${log.amount}" title="Kaydı Sil" aria-label="Kaydı Sil">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (totalCount > 5) {
    html += `
      <button id="viewAllTodayDrinksBtn" style="font-size: 0.72rem; color: var(--brita-blue); text-align: center; padding: 6px; font-weight: 700; background: none; border: none; cursor: pointer; margin-top: 4px;">
        Tümünü İstatistikte Gör (${totalCount} kayıt) →
      </button>
    `;
  }

  todayDrinksList.innerHTML = html;
  attachDeleteHandlers(todayDrinksList);

  const viewAllBtn = document.getElementById('viewAllTodayDrinksBtn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => {
      switchTab('tabStats');
    });
  }
}

// ---------------- WEEKLY BAR CHART ----------------
function renderWeeklyChart(logs) {
  if (!weeklyChart) return;

  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const now = new Date();
  const last7Days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    last7Days.push(d);
  }

  const dailyTotals = last7Days.map(dayDate => {
    const dateStr = dayDate.toDateString();
    const sum = logs
      .filter(l => {
        const ld = new Date(l.timestamp);
        return !isNaN(ld.getTime()) && ld.toDateString() === dateStr;
      })
      .reduce((acc, l) => acc + Number(l.amount || 0), 0);
    return {
      date: dayDate,
      dayName: dayNames[dayDate.getDay()],
      amount: sum,
      isToday: dayDate.toDateString() === now.toDateString()
    };
  });

  const maxVal = Math.max(2.5, ...dailyTotals.map(d => d.amount));

  weeklyChart.innerHTML = dailyTotals.map(item => {
    const heightPercent = Math.min(100, Math.round((item.amount / maxVal) * 100));
    return `
      <div class="chart-col ${item.isToday ? 'active' : ''}">
        <span class="chart-val">${item.amount > 0 ? item.amount.toFixed(1) : ''}</span>
        <div class="chart-bar-wrap">
          <div class="chart-bar" style="height: ${Math.max(4, heightPercent)}%;"></div>
        </div>
        <span class="chart-day">${item.dayName}</span>
      </div>
    `;
  }).join('');
}

// ---------------- FULL ACTIVITY LOG ----------------
function renderLogs(logs) {
  logCountBadge.textContent = `${logs.length} kayıt`;
  if (!logs || logs.length === 0) {
    historyList.innerHTML = '<div class="empty-history">Henüz tüketim kaydı bulunmuyor.</div>';
    return;
  }

  historyList.innerHTML = logs.map(log => {
    const d = new Date(log.timestamp);
    const timeStr = isNaN(d.getTime()) ? '' : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item">
        <div class="history-info">
          <span class="history-label">${escapeHtml(log.label)}</span>
          <span class="history-time">${timeStr}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span class="history-amount">+${Number(log.amount).toFixed(2)} L</span>
          <button class="history-del-btn" data-id="${log.id}" data-amount="${log.amount}" title="Kaydı Sil" aria-label="Kaydı Sil">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  attachDeleteHandlers(historyList);
}

function attachDeleteHandlers(container) {
  container.querySelectorAll('.history-del-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const amt = parseFloat(btn.dataset.amount);
      if (confirm(`Bu ${amt} litrelik kaydı silmek istediğinize emin misiniz?`)) {
        vibrate(20);
        await deleteWaterLog(currentUser.uid, id, amt, currentLocation);
      }
    });
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------- TOAST ALERT & UNDO ----------------
function showToast(amount, label, logId) {
  lastAddedLog = { id: logId, amount, label };
  toastMessage.textContent = `${amount.toFixed(2)} L eklendi (${label})`;
  floatingToast.classList.add('visible');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    floatingToast.classList.remove('visible');
  }, 4000);
}

toastUndoBtn.addEventListener('click', async () => {
  floatingToast.classList.remove('visible');
  if (lastAddedLog && currentUser) {
    vibrate([20, 50, 20]);
    const targetLog = currentLogs[0];
    if (targetLog) {
      await deleteWaterLog(currentUser.uid, targetLog.id, targetLog.amount, currentLocation);
    }
  }
});

undoActionBtn.addEventListener('click', async () => {
  if (currentLogs.length > 0 && currentUser) {
    const targetLog = currentLogs[0];
    if (confirm(`Son eklenen "${targetLog.label}" (+${targetLog.amount.toFixed(2)} L) kaydı geri alınsın mı?`)) {
      vibrate(25);
      await deleteWaterLog(currentUser.uid, targetLog.id, targetLog.amount, currentLocation);
    }
  }
});

// Banner Reset Button Handler
if (bannerResetBtn) {
  bannerResetBtn.addEventListener('click', () => {
    resetStartDateInput.value = new Date().toISOString().split('T')[0];
    resetCapacityInput.value = '150';
    openModal(resetModal);
  });
}

// ---------------- QUICK LOG BUTTON HANDLERS ----------------
function attachDosageButtonHandlers() {
  document.querySelectorAll('.dosage-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!currentUser) return;

      const target = Number(currentFilterState.targetCapacity || 150.0);
      const used = Number(currentFilterState.currentUsed || 0.0);
      const remaining = Math.max(0, Math.round((target - used) * 100) / 100);

      if (remaining <= 0) {
        vibrate([50, 100, 50]);
        if (confirm('⚠️ Filtre kapasitesi doldu (150L tükendi)!\n\nYeni su ekleyebilmek için filtreyi değiştirip sayacı sıfırlamalısınız.\n\nFiltreyi şimdi sıfırlamak ister misiniz?')) {
          resetStartDateInput.value = new Date().toISOString().split('T')[0];
          resetCapacityInput.value = '150';
          openModal(resetModal);
        }
        return;
      }

      const amount = parseFloat(btn.dataset.amount);
      const label = btn.dataset.label;
      vibrate(25);

      // Press micro-animation
      btn.style.transform = 'scale(0.93)';
      setTimeout(() => { btn.style.transform = ''; }, 120);

      const result = await addWaterLog(currentUser.uid, amount, label, currentLocation);
      if (result && result.filterEmpty) {
        alert(result.message);
        return;
      }
      showToast(amount, label);
    });
  });
}

// ---------------- CUSTOM AMOUNT MODAL ----------------
let customAmount = 0.50;

function updateCustomDisplay() {
  customAmountDisplay.textContent = customAmount.toFixed(2);
  customBtnAmount.textContent = customAmount.toFixed(2);
  customSlider.value = customAmount.toFixed(2);
}

openCustomModalBtn.addEventListener('click', () => {
  const target = Number(currentFilterState.targetCapacity || 150.0);
  const used = Number(currentFilterState.currentUsed || 0.0);
  const remaining = Math.max(0, Math.round((target - used) * 100) / 100);

  if (remaining <= 0) {
    vibrate([50, 100, 50]);
    if (confirm('⚠️ Filtre kapasitesi doldu!\n\nSu ekleyebilmek için lütfen filtreyi sıfırlayın. Şimdi sıfırlamak ister misiniz?')) {
      resetStartDateInput.value = new Date().toISOString().split('T')[0];
      resetCapacityInput.value = '150';
      openModal(resetModal);
    }
    return;
  }

  customAmount = currentLocation === 'home' ? 1.50 : 0.50;
  updateCustomDisplay();
  customLabelInput.value = '';
  openModal(customModal);
});

customSlider.addEventListener('input', (e) => {
  customAmount = parseFloat(e.target.value);
  updateCustomDisplay();
});

stepperMinus.addEventListener('click', () => {
  customAmount = Math.max(0.05, Math.round((customAmount - 0.05) * 100) / 100);
  updateCustomDisplay();
  vibrate(10);
});

stepperPlus.addEventListener('click', () => {
  customAmount = Math.min(5.00, Math.round((customAmount + 0.05) * 100) / 100);
  updateCustomDisplay();
  vibrate(10);
});

submitCustomAmountBtn.addEventListener('click', async () => {
  if (!currentUser) return;

  const target = Number(currentFilterState.targetCapacity || 150.0);
  const used = Number(currentFilterState.currentUsed || 0.0);
  const remaining = Math.max(0, Math.round((target - used) * 100) / 100);

  if (remaining <= 0) {
    vibrate([50, 100, 50]);
    alert('⚠️ Filtre kapasitesi doldu! Lütfen filtreyi sıfırlayınız.');
    closeModal(customModal);
    openModal(resetModal);
    return;
  }

  const label = customLabelInput.value.trim() || 'Özel Su Miktarı';
  vibrate(30);
  closeModal(customModal);
  const result = await addWaterLog(currentUser.uid, customAmount, label, currentLocation);
  if (result && result.filterEmpty) {
    alert(result.message);
    return;
  }
  showToast(customAmount, label);
});

// ---------------- FILTER RESET MODAL ----------------
openResetModalBtn.addEventListener('click', () => {
  resetStartDateInput.value = new Date().toISOString().split('T')[0];
  resetCapacityInput.value = '150';
  openModal(resetModal);
});

confirmResetBtn.addEventListener('click', async () => {
  if (!currentUser) return;
  const target = parseFloat(resetCapacityInput.value) || 150.0;
  const startDate = resetStartDateInput.value ? new Date(resetStartDateInput.value).toISOString() : new Date().toISOString();
  const locName = currentLocation === 'home' ? 'Ev' : 'İş Yeri';
  
  if (confirm(`${locName} filtresi sıfırlanacak ve hedef ${target} Litre olarak ayarlanacak. Onaylıyor musunuz?`)) {
    vibrate([40, 80, 40]);
    closeModal(resetModal);
    await resetFilterCycle(currentUser.uid, target, startDate, currentLocation);
  }
});

// ---------------- SETTINGS & FIREBASE CONFIG ----------------
function loadCurrentFirebaseSettings() {
  const cfg = getStoredFirebaseConfig();
  cfgApiKey.value = cfg.apiKey || '';
  cfgProjectId.value = cfg.projectId || '';
  cfgAuthDomain.value = cfg.authDomain || '';
  cfgAppId.value = cfg.appId || '';
}

[openSettingsBtn, openFirebaseModalBtn, settingsFromAuthBtn].forEach(btn => {
  if (btn) {
    btn.addEventListener('click', () => {
      loadCurrentFirebaseSettings();
      openModal(settingsModal);
    });
  }
});

saveFirebaseSettingsBtn.addEventListener('click', () => {
  const newCfg = {
    apiKey: cfgApiKey.value.trim(),
    projectId: cfgProjectId.value.trim(),
    authDomain: cfgAuthDomain.value.trim(),
    appId: cfgAppId.value.trim(),
  };
  saveStoredFirebaseConfig(newCfg);
  alert('Yapılandırma kaydedildi! Sayfa yenileniyor...');
  window.location.reload();
});

clearFirebaseSettingsBtn.addEventListener('click', () => {
  if (confirm('Firebase yapılandırmasını sıfırlayıp lokal demo moduna dönmek istiyor musunuz?')) {
    localStorage.removeItem('brita_firebase_config');
    alert('Lokal demo moduna dönüldü. Sayfa yenileniyor...');
    window.location.reload();
  }
});

// ---------------- MODAL HELPERS ----------------
function openModal(el) {
  el.classList.add('active');
}

function closeModal(el) {
  el.classList.remove('active');
}

document.querySelectorAll('.close-modal-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    if (targetId) {
      closeModal(document.getElementById(targetId));
    }
  });
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal(overlay);
    }
  });
});

// ---------------- PWA SETUP ----------------
const openPwaModalBtn = document.getElementById('openPwaModalBtn');
const pwaModal = document.getElementById('pwaModal');
const pwaModalInstallBtn = document.getElementById('pwaModalInstallBtn');

let globalPromptInstall = null;

if (openPwaModalBtn) {
  openPwaModalBtn.addEventListener('click', () => {
    openModal(pwaModal);
  });
}

if (pwaModalInstallBtn) {
  pwaModalInstallBtn.addEventListener('click', () => {
    if (globalPromptInstall) {
      globalPromptInstall();
      closeModal(pwaModal);
    } else {
      alert('Tarayıcınızın menüsünden "Ana Ekrana Ekle" veya "Uygulamayı Yükle" seçeneğini seçebilirsiniz.');
    }
  });
}

setupPWA((promptInstall) => {
  globalPromptInstall = promptInstall;
  pwaBanner.classList.add('show');
  pwaInstallBtn.addEventListener('click', () => {
    promptInstall();
    pwaBanner.classList.remove('show');
  });
});

// ---------------- AUTH STATE LISTENER ----------------
subscribeToAuth((user) => {
  currentUser = user;
  if (user) {
    authScreen.style.display = 'none';
    appScreen.style.display = 'flex';

    if (dataUnsubscribe) dataUnsubscribe();
    dataUnsubscribe = subscribeToData(user.uid, currentLocation, ({ state, logs, isCloud }) => {
      updateUI(state, logs, isCloud);
    });
  } else {
    appScreen.style.display = 'none';
    authScreen.style.display = 'flex';
    if (dataUnsubscribe) {
      dataUnsubscribe();
      dataUnsubscribe = null;
    }
  }
});
