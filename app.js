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
        page.style.animation = 'none';
        page.offsetHeight; // force reflow
        page.style.animation = '';
    }
}

// ========== SIDEBAR SECTION SCROLL ==========
function scrollToSection(id) {
    showPage('page-welcome');
    if (!id) {
        document.getElementById('main-content').scrollTop = 0;
        return;
    }
    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
}

// ========== RSVP FORM ==========
const rsvpForm = document.getElementById('rsvp-form');

rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstname = document.getElementById('guest-firstname').value.trim();
    const name = document.getElementById('guest-name').value.trim();
    const email = document.getElementById('guest-email').value.trim();
    const message = document.getElementById('guest-message') ? document.getElementById('guest-message').value.trim() : '';

    if (!firstname || !name || !email) return;

    const guest = {
        id: Date.now().toString(),
        name: firstname + ' ' + name,
        email,
        message,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    const guests = getGuests();
    guests.push(guest);
    saveGuests(guests);

    setCurrentGuest({ id: guest.id, email: guest.email });

    showPendingPage(guest);

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

        const daysEl = document.getElementById('days');
        if (daysEl) daysEl.textContent = days;
        const hoursEl = document.getElementById('hours');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        const minutesEl = document.getElementById('minutes');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        const secondsEl = document.getElementById('seconds');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

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
        container.innerHTML = `<div class="text-center py-10 text-[#A8907A] italic text-sm">${messages[filter]}</div>`;
        return;
    }

    container.innerHTML = filtered.map(guest => `
        <div class="bg-white border border-[#EDE8E0] p-5 mb-3 hover:shadow-sm transition-shadow">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="text-base font-semibold text-[#2C1D13] font-serif">${escapeHtml(guest.name)}</div>
                    <div class="text-xs text-[#A8907A] italic">${escapeHtml(guest.email)}</div>
                </div>
                ${filter !== 'pending' ? `
                    <span class="inline-block px-3 py-1 text-xs font-medium ${filter === 'accepted' ? 'bg-[#E8F0E4] text-[#5A7A4F]' : 'bg-[#F0E4E4] text-[#8B3E3E]'}">
                        ${filter === 'accepted' ? 'Accepté' : 'Refusé'}
                    </span>
                ` : ''}
            </div>
            <div class="text-sm text-[#7A5C4F] mt-1">Inscrit(e) le ${new Date(guest.createdAt).toLocaleDateString('fr-FR')}</div>
            ${filter === 'pending' ? `
                <div class="mt-3 flex gap-2">
                    <button class="px-4 py-2 bg-[#6B8F5E] text-white text-xs font-semibold tracking-wide uppercase hover:bg-[#5A7A4F] transition-colors" onclick="updateGuestStatus('${guest.id}', 'accepted')">Accepter</button>
                    <button class="px-4 py-2 bg-[#A05050] text-white text-xs font-semibold tracking-wide uppercase hover:bg-[#8B3E3E] transition-colors" onclick="updateGuestStatus('${guest.id}', 'refused')">Refuser</button>
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
            showCountdownPage(guest);
            return;
        }
    }
    showPage('page-welcome');
});

// ========== SPLASH SCREEN (Airelles-style drawing reveal) ==========
function initSplash() {
    const splash = document.getElementById('splash-screen');
    const logo = document.getElementById('splash-logo');

    const duration = 5500;
    const startTime = performance.now();

    function animateDraw(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const reveal = eased * 100;
        const edge = 12;

        const maskValue = `linear-gradient(to bottom, #000 0%, #000 ${reveal}%, transparent ${reveal + edge}%, transparent 100%)`;
        logo.style.webkitMaskImage = maskValue;
        logo.style.maskImage = maskValue;

        if (progress < 1) {
            requestAnimationFrame(animateDraw);
        } else {
            setTimeout(() => {
                splash.classList.add('fade-out');
                setTimeout(() => {
                    splash.style.display = 'none';
                }, 1000);
            }, 600);
        }
    }

    requestAnimationFrame(animateDraw);
}

// ========== INIT ==========
initSplash();
checkGuestStatus();
