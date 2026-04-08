// ========== CONFIGURATION ==========
const WEDDING_DATE = new Date('2027-09-04T14:00:00');
const ADMIN_PASSWORD = 'alice&dimitri2027';

// ========== NAVBAR SCROLL ==========
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
});

// ========== DATA STORE (localStorage) ==========
function getGuests() {
    return JSON.parse(localStorage.getItem('wedding_guests') || '[]');
}

function saveGuests(guests) {
    localStorage.setItem('wedding_guests', JSON.stringify(guests));
}

function getCurrentGuest() {
    return JSON.parse(localStorage.getItem('wedding_current_guest') || 'null');
}

function setCurrentGuest(guest) {
    localStorage.setItem('wedding_current_guest', JSON.stringify(guest));
}

// ========== PAGE NAVIGATION ==========
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
        // Re-trigger animation
        page.style.animation = 'none';
        page.offsetHeight; // force reflow
        page.style.animation = '';
    }
}

// ========== RSVP FORM ==========
const rsvpForm = document.getElementById('rsvp-form');

rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('guest-name').value.trim();
    const email = document.getElementById('guest-email').value.trim();

    if (!name || !email) return;

    const guest = {
        id: Date.now().toString(),
        name,
        email,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    // Save to guest list
    const guests = getGuests();
    guests.push(guest);
    saveGuests(guests);

    // Save current guest reference
    setCurrentGuest({ id: guest.id, email: guest.email });

    // Show pending page
    showPendingPage(guest);

    // Reset form
    rsvpForm.reset();
});

function showPendingPage(guest) {
    const info = document.getElementById('pending-info');
    info.innerHTML = `Inscrit(e) : ${guest.name}`;
    showPage('page-pending');
}

// ========== CHECK GUEST STATUS ON LOAD ==========
function checkGuestStatus() {
    const current = getCurrentGuest();
    if (!current) return;

    const guests = getGuests();
    const guest = guests.find(g => g.id === current.id);

    if (!guest) return;

    switch (guest.status) {
        case 'pending':
            showPendingPage(guest);
            break;
        case 'accepted':
            showCountdownPage(guest);
            break;
        case 'refused':
            showPage('page-refused');
            break;
    }
}

// ========== COUNTDOWN ==========
function showCountdownPage(guest) {
    const welcomeMsg = document.getElementById('welcome-message');
    welcomeMsg.textContent = `Bienvenue ${guest.name}, nous avons hâte de vous retrouver !`;
    showPage('page-countdown');
    startCountdown();
}

function startCountdown() {
    function update() {
        const now = new Date();
        const diff = WEDDING_DATE - now;

        const days = diff <= 0 ? 0 : Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = diff <= 0 ? 0 : Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = diff <= 0 ? 0 : Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = diff <= 0 ? 0 : Math.floor((diff % (1000 * 60)) / 1000);

        // Update countdown page
        const daysEl = document.getElementById('days');
        if (daysEl) daysEl.textContent = days;
        const hoursEl = document.getElementById('hours');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        const minutesEl = document.getElementById('minutes');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        const secondsEl = document.getElementById('seconds');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

        // Update inline banner countdown
        const daysInline = document.getElementById('days-inline');
        if (daysInline) daysInline.textContent = days;
        const hoursInline = document.getElementById('hours-inline');
        if (hoursInline) hoursInline.textContent = hours.toString().padStart(2, '0');
        const minutesInline = document.getElementById('minutes-inline');
        if (minutesInline) minutesInline.textContent = minutes.toString().padStart(2, '0');
        const secondsInline = document.getElementById('seconds-inline');
        if (secondsInline) secondsInline.textContent = seconds.toString().padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}

// Start countdown immediately on page load
startCountdown();

// ========== ADMIN ==========
document.getElementById('show-admin').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('page-admin-login');
});

document.getElementById('admin-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    if (password === ADMIN_PASSWORD) {
        showPage('page-admin');
        renderGuestList('pending');
    } else {
        alert('Mot de passe incorrect');
    }
    document.getElementById('admin-password').value = '';
});

document.getElementById('btn-admin-back').addEventListener('click', () => {
    showPage('page-welcome');
});

document.getElementById('btn-admin-logout').addEventListener('click', () => {
    showPage('page-welcome');
});

// Admin tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderGuestList(btn.dataset.tab);
    });
});

function renderGuestList(filter) {
    const guests = getGuests();
    const container = document.getElementById('guest-list');

    const filtered = guests.filter(g => g.status === filter);

    if (filtered.length === 0) {
        const messages = {
            pending: 'Aucune inscription en attente',
            accepted: 'Aucun invité accepté pour le moment',
            refused: 'Aucun invité refusé'
        };
        container.innerHTML = `<div class="empty-list">${messages[filter]}</div>`;
        return;
    }

    container.innerHTML = filtered.map(guest => `
        <div class="guest-card">
            <div class="guest-card-header">
                <div>
                    <div class="guest-card-name">${escapeHtml(guest.name)}</div>
                    <div class="guest-card-email">${escapeHtml(guest.email)}</div>
                </div>
                ${filter !== 'pending' ? `
                    <span class="guest-card-status ${filter === 'accepted' ? 'status-accepted' : 'status-refused'}">
                        ${filter === 'accepted' ? 'Accepté' : 'Refusé'}
                    </span>
                ` : ''}
            </div>
            <div class="guest-card-companion">Inscrit(e) le ${new Date(guest.createdAt).toLocaleDateString('fr-FR')}</div>
            ${filter === 'pending' ? `
                <div class="guest-card-actions">
                    <button class="btn btn-accept" onclick="updateGuestStatus('${guest.id}', 'accepted')">Accepter</button>
                    <button class="btn btn-refuse" onclick="updateGuestStatus('${guest.id}', 'refused')">Refuser</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function updateGuestStatus(guestId, status) {
    const guests = getGuests();
    const guest = guests.find(g => g.id === guestId);
    if (guest) {
        guest.status = status;
        saveGuests(guests);

        // Re-render current tab
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        renderGuestList(activeTab);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== BACK BUTTONS ==========
document.getElementById('btn-back-home').addEventListener('click', () => {
    localStorage.removeItem('wedding_current_guest');
    showPage('page-welcome');
});

document.getElementById('btn-back-countdown').addEventListener('click', () => {
    const current = getCurrentGuest();
    if (current) {
        const guests = getGuests();
        const guest = guests.find(g => g.id === current.id);
        if (guest) {
            guest.status = 'accepted';
            // Guest themselves is still welcome
            showCountdownPage(guest);
            return;
        }
    }
    showPage('page-welcome');
});

// ========== SPLASH SCREEN (SVG drawing animation) ==========
function initSplash() {
    const splash = document.getElementById('splash-screen');
    const paths = document.querySelectorAll('.draw-path');

    // Calculate actual path lengths and set correct dasharray
    paths.forEach(path => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
    });

    // After drawing completes (~3.5s), fade out
    setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
        }, 1000);
    }, 3500);
}

// ========== INIT ==========
initSplash();
checkGuestStatus();
