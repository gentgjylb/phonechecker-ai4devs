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
    token: null,
    mockInventory: [
        { model: 'iPhone 15 Pro Max • 256GB', condition: 'Mint', battery: 95, baseEur: 850 },
        { model: 'Samsung Galaxy S24 Ultra • 512GB', condition: 'Good', battery: 88, baseEur: 720 },
        { model: 'Xiaomi 14 Pro • 256GB', condition: 'Fair', battery: 82, baseEur: 410 }
    ]
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
    
    // Header Profile Click (Global)
    document.getElementById('user-menu').addEventListener('click', (e) => {
        if (e.target.id !== 'btn-logout') {
            renderProfilePage();
        }
    });
    
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
        
        const headerAvatar = document.getElementById('header-avatar');
        if (state.user.profile_picture) {
            headerAvatar.src = state.user.profile_picture;
            headerAvatar.style.display = 'block';
        } else {
            headerAvatar.style.display = 'none';
        }
        
        currencyToggle.style.display = 'flex';
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
        fetchValuation();
    }
    
    // Update UI if we're on inventory page
    const inventoryScreen = document.querySelector('.inventory-screen');
    if (inventoryScreen) {
        renderShopInventoryList();
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
    document.getElementById('btn-consult-ai').addEventListener('click', renderChatModal);
    
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
    document.getElementById('shop-location-display').textContent = state.user.address || 'Not provided';
    document.getElementById('shop-contact-display').textContent = state.user.contact_info || 'Not provided';
    
    document.getElementById('btn-view-inventory').addEventListener('click', renderShopInventory);
    
    // Edit Profile Logic
    document.getElementById('btn-edit-profile').addEventListener('click', renderProfilePage);
}

function renderProfilePage() {
    const template = document.getElementById('tpl-profile-page').content.cloneNode(true);
    appContainer.innerHTML = '';
    appContainer.appendChild(template);
    
    const btnBack = document.getElementById('btn-back-profile');
    const formEdit = document.getElementById('form-edit-profile');
    const errorDiv = document.getElementById('profile-error');
    const fileInput = document.getElementById('edit-profile-picture');
    const avatarPreview = document.getElementById('edit-profile-avatar-preview');
    
    let base64Image = state.user.profile_picture || '';
    
    // Pre-fill
    document.getElementById('edit-profile-name').value = state.user.name || '';
    document.getElementById('edit-profile-email').value = state.user.email || '';
    document.getElementById('edit-profile-address').value = state.user.address && state.user.address !== 'Not provided' ? state.user.address : '';
    document.getElementById('edit-profile-contact').value = state.user.contact_info && state.user.contact_info !== 'Not provided' ? state.user.contact_info : '';
    
    if (base64Image) {
        avatarPreview.src = base64Image;
        avatarPreview.style.display = 'block';
    }
    
    btnBack.addEventListener('click', () => {
        if (state.user.role === 'shop') {
            renderShopDashboard();
        } else {
            renderLanding();
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                base64Image = evt.target.result;
                avatarPreview.src = base64Image;
                avatarPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    formEdit.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.textContent = '';
        const btnSave = document.getElementById('btn-save-profile');
        btnSave.textContent = 'Saving...';
        btnSave.disabled = true;
        
        const newName = document.getElementById('edit-profile-name').value;
        const newEmail = document.getElementById('edit-profile-email').value;
        const newAddress = document.getElementById('edit-profile-address').value;
        const newContact = document.getElementById('edit-profile-contact').value;
        
        try {
            const res = await fetch(`${API_BASE}/auth/profile`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ 
                    name: newName, 
                    email: newEmail,
                    address: newAddress, 
                    contact_info: newContact,
                    profile_picture: base64Image
                })
            });
            
            const data = await res.json();
            if (data.error) {
                errorDiv.textContent = data.error;
            } else {
                state.user = data;
                localStorage.setItem('user', JSON.stringify(state.user));
                
                // Route back
                if (state.user.role === 'shop') {
                    renderShopDashboard();
                } else {
                    renderLanding();
                }
                setupHeader();
            }
        } catch (err) {
            errorDiv.textContent = 'Failed to update profile.';
        } finally {
            btnSave.textContent = 'Save Changes';
            btnSave.disabled = false;
        }
    });
}

function renderShopInventory() {
    const template = document.getElementById('tpl-shop-inventory').content.cloneNode(true);
    appContainer.innerHTML = '';
    appContainer.appendChild(template);
    
    document.getElementById('btn-back-dashboard').addEventListener('click', renderShopDashboard);
    
    renderShopInventoryList();
}

function renderShopInventoryList() {
    const container = document.querySelector('.shop-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 104.5 is the mock exchange rate from app.py
    const EUR_TO_ALL_RATE = 104.5;
    
    state.mockInventory.forEach(item => {
        let displayPrice = item.baseEur;
        if (state.currency === 'ALL') {
            displayPrice = item.baseEur * EUR_TO_ALL_RATE;
        }
        
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div class="shop-info">
                <h4>${item.model}</h4>
                <p>Condition: ${item.condition} • Battery: ${item.battery}%</p>
            </div>
            <div class="shop-offer" style="display: flex; gap: 8px; align-items: center;">
                <span class="price" style="margin-right: 12px;">${displayPrice.toLocaleString()} ${state.currency}</span>
                <button class="btn-outline btn-invoice" data-index="${state.mockInventory.indexOf(item)}" data-price="${displayPrice}" style="padding: 6px 12px; font-size: 0.85rem;">📄 Invoice</button>
                <button class="btn-contact">Contact Seller</button>
            </div>
        `;
        container.appendChild(div);
    });
    
    const contactBtns = document.querySelectorAll('.inventory-screen .btn-contact');
    contactBtns.forEach(btn => {
        btn.addEventListener('click', () => alert('Contacting seller... (Demo feature)'));
    });

    const invoiceBtns = document.querySelectorAll('.inventory-screen .btn-invoice');
    invoiceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            const price = parseFloat(e.target.dataset.price);
            const item = state.mockInventory[index];
            generateInvoice(item, price, state.currency);
        });
    });
}

function generateInvoice(item, price, currency) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 64, 175); // A nice blue
    doc.text("INVOICE", 105, 20, { align: "center" });
    
    // Invoice Meta
    const invoiceId = "INV-" + Math.floor(10000 + Math.random() * 90000);
    const date = new Date().toLocaleDateString();
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice No: ${invoiceId}`, 150, 30);
    doc.text(`Date: ${date}`, 150, 35);
    
    // Shop Details (Biller)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Billed By:", 20, 50);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Shop Name: ${state.user.name || "N/A"}`, 20, 58);
    doc.text(`Location: ${state.user.address && state.user.address !== 'Not provided' ? state.user.address : "N/A"}`, 20, 64);
    doc.text(`Contact: ${state.user.contact_info && state.user.contact_info !== 'Not provided' ? state.user.contact_info : "N/A"}`, 20, 70);
    
    // Line Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 80, 190, 80);
    
    // Item Details
    doc.setFont("helvetica", "bold");
    doc.text("Item Details", 20, 95);
    
    doc.setFont("helvetica", "normal");
    doc.text("Description", 20, 105);
    doc.text("Amount", 160, 105);
    
    doc.line(20, 108, 190, 108); // Header line
    
    // Item Row
    doc.text(`${item.model}`, 20, 118);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Condition: ${item.condition} | Battery: ${item.battery}%`, 20, 124);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${price.toLocaleString()} ${currency}`, 160, 118);
    
    doc.line(20, 130, 190, 130); // Footer line
    
    // Total
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 120, 140);
    doc.text(`${price.toLocaleString()} ${currency}`, 160, 140);
    
    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your business!", 105, 280, { align: "center" });
    
    // Save PDF
    doc.save(`${invoiceId}.pdf`);
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

    // AI Auto-Scan Logic
    const fileInput = document.getElementById('ai-condition-upload');
    const indicator = document.getElementById('ai-scan-indicator');
    const errorDiv = document.getElementById('ai-scan-error');

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            errorDiv.style.display = 'none';
            indicator.style.display = 'block';

            const reader = new FileReader();
            reader.onload = async (evt) => {
                const base64Image = evt.target.result;
                
                try {
                    const res = await fetch(`${API_BASE}/scan-condition`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: base64Image })
                    });
                    
                    const data = await res.json();
                    
                    if (data.error) {
                        errorDiv.textContent = data.error;
                        errorDiv.style.display = 'block';
                    } else if (data.conditionLevel) {
                        // Find the corresponding option and select it automatically
                        state.condition.damageLevel = parseInt(data.conditionLevel);
                        indicator.style.display = 'none';
                        renderResults();
                    }
                } catch (err) {
                    errorDiv.textContent = "Connection error. Could not reach AI.";
                    errorDiv.style.display = 'block';
                } finally {
                    indicator.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        });
    }
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
    const listContainer = document.getElementById('shop-container');
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
    const listContainer = document.getElementById('shop-container');
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

// --- AI Chat Logic ---

function renderChatModal() {
    const template = document.getElementById('tpl-ai-chat').content.cloneNode(true);
    document.body.appendChild(template);
    
    const chatModal = document.getElementById('chat-modal');
    const btnClose = document.getElementById('btn-close-chat');
    const btnSend = document.getElementById('btn-send-chat');
    const chatInput = document.getElementById('chat-input');
    
    btnClose.addEventListener('click', () => {
        chatModal.remove();
    });
    
    btnSend.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Initial welcome message
    addChatMessage("Hi there! I'm your AI Valuation Consultant. I've analyzed your phone and the local offers. How can I help you decide today?", false);
}

function addChatMessage(text, isUser = false) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const div = document.createElement('div');
    div.className = `chat-bubble ${isUser ? 'chat-user' : 'chat-ai'}`;
    div.textContent = text;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const text = chatInput.value.trim();
    if (!text) return;
    
    addChatMessage(text, true);
    chatInput.value = '';
    
    // Add typing indicator
    const typingId = 'typing-' + Date.now();
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-bubble chat-ai';
    typingDiv.id = typingId;
    typingDiv.textContent = 'Typing...';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
        const res = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                valuationId: state.valuation?.valuationId,
                message: text
            })
        });
        const data = await res.json();
        
        document.getElementById(typingId)?.remove();
        
        if (data.reply) {
            addChatMessage(data.reply, false);
        } else {
            addChatMessage("Sorry, I encountered an error. Please try again.", false);
        }
    } catch (err) {
        document.getElementById(typingId)?.remove();
        addChatMessage("Connection error. Could not reach the AI.", false);
    }
}
