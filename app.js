/**
 * Travel Cost Tracker PWA
 * Main application logic
 */

// Configuration
const CONFIG = {
    STORAGE_KEYS: {
        SCRIPT_URL: 'tct_script_url',
        RECENT_ENTRIES: 'tct_recent_entries',
        QUEUED_ENTRIES: 'tct_queued_entries'
    },
    MAX_RECENT_ENTRIES: 10,
    COST_VALUES: {
        GBP: [1, 5, 10, 50, 100],
        EUR: [1, 5, 10, 50, 100]
    }
};

// Application State
const state = {
    scriptUrl: null,
    selectedCurrency: 'GBP',
    selectedCost: 0, // Changed to 0 instead of null for additive behavior
    selectedMode: null,
    isOnline: navigator.onLine,
    queuedEntries: []
};

// DOM Elements - will be initialized when DOM is ready
const elements = {};

// Initialize DOM Elements
function initElements() {
    elements.setupModal = document.getElementById('setupModal');
    elements.instructionsModal = document.getElementById('instructionsModal');
    elements.app = document.getElementById('app');
    elements.scriptUrlInput = document.getElementById('scriptUrlInput');
    elements.saveScriptUrlBtn = document.getElementById('saveScriptUrl');
    elements.showInstructionsBtn = document.getElementById('showInstructions');
    elements.closeInstructionsBtn = document.getElementById('closeInstructions');
    elements.backToSetupBtn = document.getElementById('backToSetup');
    elements.settingsBtn = document.getElementById('settingsBtn');
    elements.currencyButtons = document.querySelectorAll('.currency-btn');
    elements.costButtons = document.getElementById('costButtons');
    elements.modeButtons = document.querySelectorAll('.mode-btn');
    elements.submitBtn = document.getElementById('submitBtn');
    elements.resetBtn = document.getElementById('resetBtn');
    elements.selectedCost = document.getElementById('selectedCost');
    elements.selectedMode = document.getElementById('selectedMode');
    elements.recentEntries = document.getElementById('recentEntries');
    elements.toast = document.getElementById('toast');
    elements.onlineStatus = document.getElementById('onlineStatus');
    elements.queuedCount = document.getElementById('queuedCount');
    // Monthly totals elements
    elements.monthlyTotals = document.getElementById('monthlyTotals');
    elements.monthName = document.getElementById('monthName');
    elements.totalGBP = document.getElementById('totalGBP');
    elements.totalEUR = document.getElementById('totalEUR');
    elements.entryCount = document.getElementById('entryCount');
    elements.refreshTotals = document.getElementById('refreshTotals');
}

// Initialize App
function init() {
    // Initialize DOM elements first
    initElements();
    
    // Check for saved script URL - THIS IS NOW PERSISTENT
    const savedUrl = localStorage.getItem(CONFIG.STORAGE_KEYS.SCRIPT_URL);
    state.scriptUrl = savedUrl;
    
    if (state.scriptUrl) {
        showApp();
    } else {
        showSetup();
    }
    
    // Load queued entries
    loadQueuedEntries();
    
    // Setup event listeners
    setupEventListeners();
    
    // Render cost buttons
    renderCostButtons();
    
    // Update UI
    updateOnlineStatus();
    updateQueuedCount();
    renderRecentEntries();
    updateCostDisplay();
    
    // Load monthly summary after a brief delay (improves perceived performance)
    if (state.scriptUrl) {
        setTimeout(() => {
            loadMonthlySummary();
        }, 100);
    }
    
    // Register service worker
    registerServiceWorker();
}

// Setup Event Listeners
function setupEventListeners() {
    // Setup modal
    elements.saveScriptUrlBtn.addEventListener('click', handleSaveScriptUrl);
    elements.showInstructionsBtn.addEventListener('click', showInstructions);
    elements.closeInstructionsBtn.addEventListener('click', hideInstructions);
    elements.backToSetupBtn.addEventListener('click', hideInstructions);
    
    // Settings
    elements.settingsBtn.addEventListener('click', handleSettings);
    
    // Currency selection
    elements.currencyButtons.forEach(btn => {
        btn.addEventListener('click', handleCurrencySelect);
    });
    
    // Mode selection
    elements.modeButtons.forEach(btn => {
        btn.addEventListener('click', handleModeSelect);
    });
    
    // Submit and Reset
    elements.submitBtn.addEventListener('click', handleSubmit);
    elements.resetBtn.addEventListener('click', handleReset);
    
    // Refresh totals (check if element exists)
    if (elements.refreshTotals) {
        elements.refreshTotals.addEventListener('click', () => {
            loadMonthlySummary();
        });
    }
    
    // Toggle recent entries
    const recentToggle = document.getElementById('recentEntriesToggle');
    if (recentToggle) {
        recentToggle.addEventListener('click', toggleRecentEntries);
    }
    
    // Online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Allow Enter key in setup
    elements.scriptUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSaveScriptUrl();
        }
    });
}

// Render Cost Buttons
function renderCostButtons() {
    const costs = CONFIG.COST_VALUES[state.selectedCurrency];
    const symbol = state.selectedCurrency === 'GBP' ? '£' : '€';
    
    elements.costButtons.innerHTML = costs.map(cost => `
        <button class="cost-btn" data-cost="${cost}">
            ${symbol}${cost}
        </button>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.cost-btn').forEach(btn => {
        btn.addEventListener('click', handleCostSelect);
    });
}

// Handle Currency Selection
function handleCurrencySelect(e) {
    const currency = e.target.dataset.currency;
    state.selectedCurrency = currency;
    state.selectedCost = 0; // Reset cost when changing currency
    
    // Update UI
    elements.currencyButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.currency === currency);
    });
    
    renderCostButtons();
    updateCostDisplay();
    updateSubmitButton();
}

// Handle Cost Selection - NOW ADDITIVE
function handleCostSelect(e) {
    const cost = parseFloat(e.target.dataset.cost);
    
    // ADD to existing total instead of replacing
    state.selectedCost += cost;
    
    // Briefly highlight the clicked button
    e.target.classList.add('pulse');
    setTimeout(() => {
        e.target.classList.remove('pulse');
    }, 200);
    
    updateCostDisplay();
    updateSubmitButton();
}

// Update Cost Display
function updateCostDisplay() {
    const symbol = state.selectedCurrency === 'GBP' ? '£' : '€';
    if (state.selectedCost > 0) {
        elements.selectedCost.textContent = `${symbol}${state.selectedCost.toFixed(2)}`;
        elements.selectedCost.classList.add('has-value');
    } else {
        elements.selectedCost.textContent = `${symbol}0.00`;
        elements.selectedCost.classList.remove('has-value');
    }
}

// Handle Reset Button
function handleReset() {
    state.selectedCost = 0;
    updateCostDisplay();
    updateSubmitButton();
    
    // Brief visual feedback
    elements.resetBtn.classList.add('pulse');
    setTimeout(() => {
        elements.resetBtn.classList.remove('pulse');
    }, 200);
}

// Handle Mode Selection
function handleModeSelect(e) {
    const btn = e.currentTarget;
    const mode = btn.dataset.mode;
    state.selectedMode = mode;
    
    // Update UI
    elements.modeButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });
    
    elements.selectedMode.textContent = mode;
    
    updateSubmitButton();
}

// Update Submit Button State
function updateSubmitButton() {
    const isValid = state.selectedCost > 0 && state.selectedMode !== null;
    elements.submitBtn.disabled = !isValid;
}

// Handle Submit
async function handleSubmit() {
    if (state.selectedCost <= 0 || !state.selectedMode) {
        return;
    }
    
    // Disable button
    elements.submitBtn.disabled = true;
    elements.submitBtn.textContent = '⏳ Recording...';
    
    // Create entry
    const entry = {
        timestamp: new Date().toISOString(),
        cost: state.selectedCost,
        currency: state.selectedCurrency,
        mode: state.selectedMode,
        userAgent: navigator.userAgent
    };
    
    try {
        if (state.isOnline) {
            // Try to submit online
            await submitToSheet(entry);
            showToast('✅ Entry recorded!', 'success');
            
            // Try to sync any queued entries
            await syncQueuedEntries();
            
            // Refresh monthly summary
            loadMonthlySummary();
        } else {
            // Queue for later
            queueEntry(entry);
            showToast('📦 Entry queued (offline)', 'warning');
        }
        
        // Save to recent entries
        saveRecentEntry(entry);
        
        // Reset form
        resetForm();
        
        // Update UI
        renderRecentEntries();
        updateQueuedCount();
        
    } catch (error) {
        console.error('Submit error:', error);
        
        // Queue entry on error
        queueEntry(entry);
        showToast('⚠️ Queued for retry', 'warning');
        
        saveRecentEntry(entry);
        renderRecentEntries();
        updateQueuedCount();
        resetForm();
    }
}

// Submit to Google Sheet
async function submitToSheet(entry) {
    if (!state.scriptUrl) {
        throw new Error('No script URL configured');
    }
    
    const response = await fetch(state.scriptUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script requires this
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
    });
    
    // Note: no-cors mode means we can't read the response
    // We'll assume success if no network error occurred
    return response;
}

// Queue Entry for Later Sync
function queueEntry(entry) {
    state.queuedEntries.push({
        ...entry,
        queued: true
    });
    saveQueuedEntries();
}

// Sync Queued Entries
async function syncQueuedEntries() {
    if (!state.isOnline || state.queuedEntries.length === 0) {
        return;
    }
    
    console.log(`🔄 Syncing ${state.queuedEntries.length} queued entries...`);
    
    const entriesToSync = [...state.queuedEntries];
    const failedEntries = [];
    
    for (const entry of entriesToSync) {
        try {
            await submitToSheet(entry);
            console.log('✅ Synced entry:', entry);
        } catch (error) {
            console.error('❌ Failed to sync entry:', error);
            failedEntries.push(entry);
        }
    }
    
    // Update queued entries with only failed ones
    state.queuedEntries = failedEntries;
    saveQueuedEntries();
    updateQueuedCount();
    
    if (entriesToSync.length > failedEntries.length) {
        const syncedCount = entriesToSync.length - failedEntries.length;
        showToast(`✅ Synced ${syncedCount} queued entries`, 'success');
        
        // Refresh monthly summary after syncing
        loadMonthlySummary();
    }
}

// Save Recent Entry
function saveRecentEntry(entry) {
    const recent = getRecentEntries();
    recent.unshift(entry);
    
    // Keep only last N entries
    const trimmed = recent.slice(0, CONFIG.MAX_RECENT_ENTRIES);
    
    localStorage.setItem(CONFIG.STORAGE_KEYS.RECENT_ENTRIES, JSON.stringify(trimmed));
}

// Get Recent Entries
function getRecentEntries() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.RECENT_ENTRIES);
    return stored ? JSON.parse(stored) : [];
}

// Render Recent Entries
function renderRecentEntries() {
    const recent = getRecentEntries();
    const recentSection = document.getElementById('recentEntriesSection');
    const recentCount = document.getElementById('recentEntriesCount');
    
    if (recent.length === 0) {
        // Hide the section when there are no entries
        if (recentSection) {
            recentSection.style.display = 'none';
        }
        return;
    }
    
    // Show the section when there are entries
    if (recentSection) {
        recentSection.style.display = 'block';
    }
    
    // Update count
    if (recentCount) {
        recentCount.textContent = `(${recent.length})`;
    }
    
    elements.recentEntries.innerHTML = recent.map(entry => {
        const symbol = entry.currency === 'GBP' ? '£' : '€';
        const date = new Date(entry.timestamp);
        const timeStr = date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const queuedBadge = entry.queued ? '<span class="entry-badge">QUEUED</span>' : '';
        const cardClass = entry.queued ? 'entry-card queued' : 'entry-card';
        
        return `
            <div class="${cardClass}">
                <div class="entry-header">
                    <div class="entry-cost">${symbol}${entry.cost.toFixed(2)}</div>
                    <div class="entry-mode">${entry.mode}</div>
                </div>
                <div class="entry-time">${timeStr}${queuedBadge}</div>
            </div>
        `;
    }).join('');
}

// Reset Form
function resetForm() {
    state.selectedCost = 0;
    state.selectedMode = null;
    
    elements.modeButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    updateCostDisplay();
    elements.selectedMode.textContent = '-';
    
    elements.submitBtn.disabled = true;
    elements.submitBtn.textContent = '📝 Record Entry';
}

// Handle Online/Offline
function handleOnline() {
    state.isOnline = true;
    updateOnlineStatus();
    showToast('🌐 Back online', 'success');
    
    // Try to sync queued entries
    syncQueuedEntries();
}

function handleOffline() {
    state.isOnline = false;
    updateOnlineStatus();
    showToast('📡 Offline mode', 'warning');
}

// Update Online Status Display
function updateOnlineStatus() {
    elements.onlineStatus.textContent = state.isOnline ? '●' : '●';
    elements.onlineStatus.className = `status-indicator ${state.isOnline ? 'online' : 'offline'}`;
}

// Update Queued Count Display
function updateQueuedCount() {
    const count = state.queuedEntries.length;
    elements.queuedCount.textContent = count > 0 ? `${count} queued` : '';
}

// Load Queued Entries
function loadQueuedEntries() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.QUEUED_ENTRIES);
    state.queuedEntries = stored ? JSON.parse(stored) : [];
}

// Save Queued Entries
function saveQueuedEntries() {
    localStorage.setItem(
        CONFIG.STORAGE_KEYS.QUEUED_ENTRIES,
        JSON.stringify(state.queuedEntries)
    );
}

// Show Toast
function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Setup Modal Functions
function showSetup() {
    elements.setupModal.classList.remove('hidden');
    elements.app.classList.add('hidden');
    elements.scriptUrlInput.focus();
}

function showApp() {
    elements.setupModal.classList.add('hidden');
    elements.instructionsModal.classList.add('hidden');
    elements.app.classList.remove('hidden');
}

function showInstructions(e) {
    e.preventDefault();
    elements.setupModal.classList.add('hidden');
    elements.instructionsModal.classList.remove('hidden');
}

function hideInstructions() {
    elements.instructionsModal.classList.add('hidden');
    elements.setupModal.classList.remove('hidden');
}

// Handle Save Script URL - NOW PERSISTS IN LOCALSTORAGE
function handleSaveScriptUrl() {
    const url = elements.scriptUrlInput.value.trim();
    
    console.log('💾 Attempting to save URL:', url);
    
    if (!url) {
        showToast('⚠️ Please enter a URL', 'error');
        return;
    }
    
    if (!url.startsWith('https://script.google.com/')) {
        showToast('⚠️ Invalid Google Apps Script URL', 'error');
        return;
    }
    
    // Save to state AND localStorage for persistence
    state.scriptUrl = url;
    localStorage.setItem(CONFIG.STORAGE_KEYS.SCRIPT_URL, url);
    
    // Verify it was saved
    const savedUrl = localStorage.getItem(CONFIG.STORAGE_KEYS.SCRIPT_URL);
    console.log('✅ URL saved to localStorage:', savedUrl);
    console.log('🔑 Storage key used:', CONFIG.STORAGE_KEYS.SCRIPT_URL);
    console.log('📦 All localStorage keys:', Object.keys(localStorage));
    
    showToast('✅ Configuration saved!', 'success');
    showApp();
}

// Handle Settings
function handleSettings() {
    const confirmed = confirm('Reset app configuration?\n\nThis will clear your saved Google Apps Script URL and you will need to re-enter it.');
    
    if (confirmed) {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.SCRIPT_URL);
        state.scriptUrl = null;
        elements.scriptUrlInput.value = '';
        showSetup();
    }
}

// Load Monthly Summary
async function loadMonthlySummary() {
    if (!state.scriptUrl) {
        console.log('No script URL configured');
        displayMonthlySummary(null);
        return;
    }
    
    // Show loading state
    if (elements.monthlyTotals) {
        elements.monthlyTotals.classList.add('loading');
    }
    
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        // Fetch monthly totals from Google Apps Script
        const url = `${state.scriptUrl}?action=monthlyTotals&year=${year}&month=${month}&t=${Date.now()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });
        
        const result = await response.json();
        
        // Check if we got the old API response (needs update)
        if (result.status === 'ok' && result.message && !result.success) {
            console.error('⚠️ OLD API VERSION DETECTED');
            showToast('⚠️ Please update your Google Apps Script', 'warning');
            displayMonthlySummary(null);
            return;
        }
        
        if (result.success && result.data) {
            displayMonthlySummary(result.data);
        } else {
            console.error('Failed to load monthly totals:', result.message);
            displayMonthlySummary(null);
        }
    } catch (error) {
        console.error('Error loading monthly totals:', error);
        displayMonthlySummary(null);
    } finally {
        // Remove loading state
        if (elements.monthlyTotals) {
            elements.monthlyTotals.classList.remove('loading');
        }
    }
}

// Display Monthly Summary
function displayMonthlySummary(data) {
    if (!data) {
        // Show empty state
        elements.monthName.textContent = getMonthName();
        elements.totalGBP.textContent = '£0.00';
        elements.totalEUR.textContent = '€0.00';
        elements.entryCount.textContent = '0 entries';
        return;
    }
    
    // Update month name
    elements.monthName.textContent = data.monthName;
    
    // Update totals
    elements.totalGBP.textContent = `£${data.totalGBP.toFixed(2)}`;
    elements.totalEUR.textContent = `€${data.totalEUR.toFixed(2)}`;
    
    // Update entry count
    const entryText = data.entryCount === 1 ? 'entry' : 'entries';
    elements.entryCount.textContent = `${data.entryCount} ${entryText} this month`;
}

// Get Current Month Name
function getMonthName() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
}

// Toggle Recent Entries Section
function toggleRecentEntries() {
    const recentEntries = document.getElementById('recentEntries');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (!recentEntries || !toggleIcon) return;
    
    const isCollapsed = recentEntries.classList.contains('collapsed');
    
    if (isCollapsed) {
        recentEntries.classList.remove('collapsed');
        toggleIcon.classList.add('expanded');
    } else {
        recentEntries.classList.add('collapsed');
        toggleIcon.classList.remove('expanded');
    }
}

// Register Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // Use relative path for GitHub Pages compatibility
            const registration = await navigator.serviceWorker.register('./service-worker.js');
            console.log('✅ Service Worker registered:', registration);
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
                console.log('🔄 Service Worker update found');
            });
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            // Non-critical error - app still works without SW
        }
    }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}