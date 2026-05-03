const API_BASE = 'http://localhost:5000/api';

// State
let state = {
    currency: 'ALL',
    models: [],
    selectedModel: null,
    condition: {
        storage: null,
        batteryHealth: 90,
        damageLevel: null
    },
    valuation: null,
    shops: [],
    user: null,
    token: null
};

// Elements
const appContainer = document.getElementById('app-container');
const currencyBtns = document.querySelectorAll('.currency-btn');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Load auth from local storage
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
        state.token = savedToken;
        state.user = JSON.parse(savedUser);
    }

    setupHeader();
    setupCurrencyToggles();
    
    // Route based on auth state
    if (state.user && state.user.role === 'shop') {
        renderShopDashboard();
    } else {
        renderLanding();
    }
});

function setupHeader() {
    const btnLogin = document.getElementById('btn-show-login');
    const btnSignup = document.getElementById('btn-show-signup');
    const btnLogout = document.getElementById('btn-logout');
    const btnLogo = document.getElementById('btn-logo');
    
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userNameDisplay = document.getElementById('user-name-display');
    const currencyToggle = document.getElementById('currency-toggle-container');

    // Logo click goes home
    btnLogo.addEventListener('click', () => {
        if (state.user && state.user.role === 'shop') {
            renderShopDashboard();
        } else {
            renderLanding();
        }
    });

    if (state.user) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userNameDisplay.textContent = state.user.name;
        
        // Show currency toggle only if seller
        currencyToggle.style.display = state.user.role === 'seller' ? 'flex' : 'none';
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
        currencyToggle.style.display = 'flex';
    }

    btnLogin.addEventListener('click', () => renderAuth('login'));
    btnSignup.addEventListener('click', () => renderAuth('signup'));
    
    btnLogout.addEventListener('click', () => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setupHeader();
        renderLanding();
    });
}

function setupCurrencyToggles() {
    currencyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currency = e.target.dataset.currency;
            setCurrency(currency);
        });
    });
}

function setCurrency(currency) {
    state.currency = currency;
    currencyBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.currency === currency);
    });
    
    // Update UI if we're on results page
    const resultsScreen = document.querySelector('.results-screen');
    if (resultsScreen && state.valuation) {
        // Refetch valuation or just recalculate frontend?
        // Since API returns ALL/EUR, let's re-evaluate using the API
        fetchValuation();
    }
}

// Render Functions
function renderLanding() {
    const template = document.getElementById('tpl-landing').content.cloneNode(true);
    appContainer.innerHTML = '';
    appContainer.appendChild(template);
    
    // Fetch models and setup search
    fetchModels();
}

function renderQuestionnaire() {
    const template = document.getElementById('tpl-questionnaire').content.cloneNode(true);
    appContainer.innerHTML = '';
    appContainer.appendChild(template);
    
    document.getElementById('q-model-name').textContent = state.selectedModel.name;
    document.getElementById('btn-back-landing').addEventListener('click', renderLanding);
    
    // Reset condition
    state.condition = { storage: null, batteryHealth: 90, damageLevel: null };
    
    setupStorageStep();
}

function renderResults() {
    const template = document.getElementById('tpl-results').content.cloneNode(true);
    appContainer.innerHTML = '';
    appContainer.appendChild(template);
    
    document.getElementById('btn-back-q').addEventListener('click', renderQuestionnaire);
    
    updateResultsUI();
    fetchValuation(); // This will chain into fetchShops
}

function renderAuth(tab = 'login') {
    const template = document.getElementById('tpl-auth').content.cloneNode(true);
    appContainer.innerHTML = '';
    appContainer.appendChild(template);

    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    function switchTab(target) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.target === target));
        forms.forEach(f => f.classList.toggle('active', f.id === `form-${target}`));
    }

    tabs.forEach(t => {
        t.addEventListener('click', (e) => switchTab(e.target.dataset.target));
    });

    switchTab(tab);
    setupAuthForms();
}

function renderShopDashboard() {
    const template = document.getElementById('tpl-shop-dashboard').content.cloneNode(true);
    appContainer.innerHTML = '';
    appContainer.appendChild(template);
    
    document.getElementById('shop-welcome').textContent = `Welcome back, ${state.user.name}!`;
    document.getElementById('currency-toggle-container').style.display = 'none';
    
    document.getElementById('btn-view-inventory').addEventListener('click', renderShopInventory);
}

function renderShopInventory() {
    const template = document.getElementById('tpl-shop-inventory').content.cloneNode(true);
    appContainer.innerHTML = '';
    appContainer.appendChild(template);
    
    document.getElementById('btn-back-dashboard').addEventListener('click', renderShopDashboard);
    
    const contactBtns = document.querySelectorAll('.inventory-screen .btn-contact');
    contactBtns.forEach(btn => {
        btn.addEventListener('click', () => alert('Contacting seller... (Demo feature)'));
    });
}

// Logic Functions

function setupAuthForms() {
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (data.error) {
                loginError.textContent = data.error;
            } else {
                handleLoginSuccess(data.token, data.user);
            }
        } catch (err) {
            loginError.textContent = "Failed to login. Please try again.";
        }
    });

    formSignup.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupError.textContent = '';
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const name = document.getElementById('signup-name').value;
        const role = document.getElementById('signup-role').value;

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, role })
            });
            const data = await res.json();
            
            if (data.error) {
                signupError.textContent = data.error;
            } else {
                // Auto login after signup
                const loginRes = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const loginData = await loginRes.json();
                handleLoginSuccess(loginData.token, loginData.user);
            }
        } catch (err) {
            signupError.textContent = "Failed to sign up. Please try again.";
        }
    });
}

function handleLoginSuccess(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    setupHeader();
    
    if (user.role === 'shop') {
        renderShopDashboard();
    } else {
        renderLanding();
    }
}
async function fetchModels() {
    try {
        const res = await fetch(`${API_BASE}/models`);
        const data = await res.json();
        state.models = data.items;
        
        setupSearchBox();
        setupPopularModels();
    } catch (err) {
        console.error("Failed to fetch models:", err);
    }
}

function setupSearchBox() {
    const input = document.getElementById('model-search');
    const resultsDiv = document.getElementById('search-results');
    
    input.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        resultsDiv.innerHTML = '';
        
        if (q.length < 2) {
            resultsDiv.classList.remove('active');
            return;
        }
        
        const filtered = state.models.filter(m => m.name.toLowerCase().includes(q));
        
        if (filtered.length > 0) {
            filtered.forEach(m => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.textContent = m.name;
                div.addEventListener('click', () => {
                    state.selectedModel = m;
                    renderQuestionnaire();
                });
                resultsDiv.appendChild(div);
            });
            resultsDiv.classList.add('active');
        } else {
            resultsDiv.classList.remove('active');
        }
    });
    
    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== resultsDiv) {
            resultsDiv.classList.remove('active');
        }
    });
}

function setupPopularModels() {
    const container = document.getElementById('popular-models');
    if (!container) return;
    
    const popular = state.models.slice(0, 4); // Just take first 4
    popular.forEach(m => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.textContent = m.name;
        chip.addEventListener('click', () => {
            state.selectedModel = m;
            renderQuestionnaire();
        });
        container.appendChild(chip);
    });
}

function setupStorageStep() {
    const options = document.querySelectorAll('#storage-options .option-card');
    const progress = document.getElementById('q-progress');
    progress.style.width = '33.33%';
    
    options.forEach(opt => {
        opt.addEventListener('click', (e) => {
            const card = e.currentTarget;
            state.condition.storage = card.dataset.value;
            
            document.getElementById('q-step-1').classList.remove('active');
            setupBatteryStep();
        });
    });
}

function setupBatteryStep() {
    document.getElementById('q-step-2').classList.add('active');
    const progress = document.getElementById('q-progress');
    progress.style.width = '66.66%';
    
    const range = document.getElementById('battery-range');
    const val = document.getElementById('battery-val');
    const btnNext = document.getElementById('btn-next-step2');
    
    range.addEventListener('input', (e) => {
        val.textContent = e.target.value;
        state.condition.batteryHealth = parseInt(e.target.value);
    });
    
    btnNext.addEventListener('click', () => {
        document.getElementById('q-step-2').classList.remove('active');
        setupDamageStep();
    });
}

function setupDamageStep() {
    document.getElementById('q-step-3').classList.add('active');
    const progress = document.getElementById('q-progress');
    progress.style.width = '100%';
    
    const options = document.querySelectorAll('#damage-options .option-card');
    
    options.forEach(opt => {
        opt.addEventListener('click', (e) => {
            const card = e.currentTarget;
            state.condition.damageLevel = parseInt(card.dataset.value);
            renderResults();
        });
    });
}

async function fetchValuation() {
    if (!state.selectedModel) return;
    
    try {
        const payload = {
            modelId: state.selectedModel.id,
            storage: state.condition.storage,
            batteryHealth: state.condition.batteryHealth,
            damageLevel: state.condition.damageLevel,
            currency: state.currency
        };
        
        const res = document.querySelectorAll('.currency-label');
        res.forEach(el => el.textContent = state.currency);
        
        const response = await fetch(`${API_BASE}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        state.valuation = data;
        
        updateResultsUI();
        fetchShops();
    } catch (err) {
        console.error("Failed to fetch valuation:", err);
    }
}

function updateResultsUI() {
    if (!state.valuation) return;
    
    document.getElementById('price-min').textContent = state.valuation.estimatedMin.toLocaleString();
    document.getElementById('price-max').textContent = state.valuation.estimatedMax.toLocaleString();
    
    const damageMap = {1: 'Mint', 2: 'Good', 3: 'Fair', 4: 'Cracked', 5: 'Broken'};
    const summary = `${state.selectedModel.name} • ${state.condition.storage} • ${state.condition.batteryHealth}% Battery • ${damageMap[state.condition.damageLevel]}`;
    document.getElementById('res-summary').textContent = summary;
}

async function fetchShops() {
    const listContainer = document.getElementById('shop-list');
    listContainer.innerHTML = '<div class="loader">Loading offers...</div>';
    
    try {
        // According to our mock API, we need modelId and currency
        const res = await fetch(`${API_BASE}/shops?modelId=${state.valuation.valuationId}&currency=${state.currency}`);
        const data = await res.json();
        state.shops = data.items;
        
        renderShopList();
    } catch (err) {
        console.error("Failed to fetch shops:", err);
        listContainer.innerHTML = '<div class="loader">Error loading offers.</div>';
    }
}

function renderShopList() {
    const listContainer = document.getElementById('shop-list');
    listContainer.innerHTML = '';
    
    if (state.shops.length === 0) {
        listContainer.innerHTML = '<p>No shops found.</p>';
        return;
    }
    
    state.shops.forEach(shop => {
        const item = document.createElement('div');
        item.className = 'shop-item';
        
        item.innerHTML = `
            <div class="shop-info">
                <h4>${shop.shopName}</h4>
                <p>${shop.location}</p>
            </div>
            <div class="shop-offer">
                <span class="price">${shop.offerPrice.toLocaleString()} ${state.currency}</span>
                <a href="tel:${shop.contact.replace(/\s+/g, '')}" class="btn-contact" style="text-decoration: none; display: inline-block;">Contact</a>
            </div>
        `;
        
        listContainer.appendChild(item);
    });
}
