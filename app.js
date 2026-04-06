// ========== CONFIGURATION ==========
const WEDDING_DATE = new Date('2027-09-04T14:00:00');
const ADMIN_PASSWORD = 'alice&dimitri2027';

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
const plusOneRadios = document.querySelectorAll('input[name="plus-one"]');
const companionGroup = document.getElementById('companion-group');

plusOneRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        const wantsPlusOne = document.querySelector('input[name="plus-one"]:checked').value === 'yes';
        companionGroup.style.display = wantsPlusOne ? 'block' : 'none';
        if (wantsPlusOne) {
            document.getElementById('companion-name').required = true;
        } else {
            document.getElementById('companion-name').required = false;
            document.getElementById('companion-name').value = '';
        }
    });
});

rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('guest-name').value.trim();
    const email = document.getElementById('guest-email').value.trim();
    const wantsPlusOne = document.querySelector('input[name="plus-one"]:checked').value === 'yes';
    const companionName = document.getElementById('companion-name').value.trim();

    if (!name || !email) return;
    if (wantsPlusOne && !companionName) return;

    const guest = {
        id: Date.now().toString(),
        name,
        email,
        wantsPlusOne,
        companionName: wantsPlusOne ? companionName : '',
        status: 'pending', // pending, accepted, refused
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
    companionGroup.style.display = 'none';
});

function showPendingPage(guest) {
    const info = document.getElementById('pending-info');
    let text = `Inscrit(e) : ${guest.name}`;
    if (guest.wantsPlusOne) {
        text += `<br>Accompagné(e) de : ${guest.companionName}`;
    }
    info.innerHTML = text;
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

        if (diff <= 0) {
            document.getElementById('days').textContent = '0';
            document.getElementById('hours').textContent = '0';
            document.getElementById('minutes').textContent = '0';
            document.getElementById('seconds').textContent = '0';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = days;
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}

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
            ${guest.wantsPlusOne ? `
                <div class="guest-card-companion">
                    Accompagné(e) de : <strong>${escapeHtml(guest.companionName)}</strong>
                </div>
            ` : '<div class="guest-card-companion">Vient seul(e)</div>'}
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

// ========== INIT ==========
checkGuestStatus();
