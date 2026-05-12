/* ===================================================
   EcoTrack AI – Leaderboard JS (leaderboard.js)
   =================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user) return;

    await loadLeaderboard(user);
    renderBadges(user);
});

// ── Load Leaderboard ──────────────────────────────────
async function loadLeaderboard(user) {
    try {
        const res = await apiFetch('/leaderboard');
        const data = res.leaderboard;
        const groups = res.groups || [];

        renderMyRankBanner(res.myRank, res.myScore);
        renderPodium(data);
        renderLeaderboardList(data);
        renderNGOTab(user, res.registeredNGOs || []);
    } catch (err) {
        console.error("Leaderboard load fail:", err);
        showGlobalToast("Failed to sync leaderboard with MongoDB");
    }
}

// ── My Rank Banner ────────────────────────────────────
function renderMyRankBanner(myRank, myScore) {
    const user = getCurrentUser();
    const rankEl = document.getElementById('myRankDisplay');
    const nameEl = document.getElementById('myRankName');
    const scoreEl = document.getElementById('myRankScore');
    const tillEl = document.getElementById('rankTillNext');

    if (rankEl) rankEl.textContent = '#' + (myRank || '--');
    if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName || ''}`;
    if (scoreEl) scoreEl.textContent = myScore || 0;
}

// ── Podium ────────────────────────────────────────────
function renderPodium(data) {
    const ids = ['p2', 'p1', 'p3']; // Order: 2nd, 1st, 3rd
    const placements = [data[1], data[0], data[2]];

    ids.forEach((id, i) => {
        const person = placements[i];
        if (!person) return;
        const nameEl = document.getElementById(id + 'name');
        const scoreEl = document.getElementById(id + 'score');
        if (nameEl) nameEl.textContent = person.name.split(' ')[0];
        if (scoreEl) scoreEl.textContent = person.score + ' pts';
    });
}

// ── Full Leaderboard List ─────────────────────────────
function renderLeaderboardList(data) {
    const list = document.getElementById('leaderboardList');
    if (!list) return;

    list.innerHTML = data.map((person, idx) => {
        const rank = person.rank;
        const isMe = person.isMe;
        const tier = getScoreTier(person.score);
        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
        const rankEmoji = rank;
        const initials = person.name.split(' ').map(n => n[0]).join('').toUpperCase();

        return `
      <div class="lb-row ${isMe ? 'my-row' : ''}" id="lb-row-${rank}">
        <div class="lb-rank-num ${rankClass}">${rankEmoji}</div>
        <div class="lb-avatar" style="background: ${isMe ? 'linear-gradient(135deg,#22c55e,#06b6d4)' : getAvatarGradient(idx)}">${initials}</div>
        <div class="lb-name-wrap">
          <div class="lb-name">${person.name} ${isMe ? '<span style="color:#22c55e;font-size:0.75rem">(You)</span>' : ''}</div>
          <div class="lb-location">${person.group || 'Individual'}</div>
        </div>
        <div style="text-align:right">
          <div class="lb-score">${person.score}</div>
          <div class="lb-tier" style="color:${tier.color}">${tier.tier.split(' ')[0]}</div>
        </div>
      </div>
    `;
    }).join('');
}



function getAvatarGradient(idx) {
    const gradients = ['#3b82f6', '#a855f7', '#f97316', '#ef4444', '#14b8a6'];
    return `linear-gradient(135deg, ${gradients[idx % gradients.length]}, #000000)`;
}

// ── Tab switching ─────────────────────────────────────
function switchLbTab(tab, btn) {
    document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-individual').style.display = tab === 'individual' ? 'block' : 'none';
    document.getElementById('tab-ngo').style.display = tab === 'ngo' ? 'block' : 'none';
    if (tab === 'ngo') {
        const user = getCurrentUser();
        loadLeaderboard(user); // Re-fetch to ensure fresh dynamic NGOs
    }
}

// ── Impact Share Card (Canvas) ────────────────────────
async function generateShareCard() {
    const user = getCurrentUser();
    const score = user.ecoScore || 0;

    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#00D4AA');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Decorative Blur Circles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath(); ctx.arc(900, 100, 300, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(100, 900, 200, 0, Math.PI * 2); ctx.fill();

    // Text & Branding
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    ctx.font = 'bold 120px Inter, sans-serif';
    ctx.fillText('EcoChampion', 540, 300);

    ctx.font = '40px Inter, sans-serif';
    ctx.fillText('This month, I reduced my footprint by 23%', 540, 400);

    // EcoScore Display
    ctx.font = 'bold 300px Inter, sans-serif';
    ctx.fillText(score, 540, 700);
    ctx.font = '50px Inter, sans-serif';
    ctx.fillText('POINTS', 540, 780);

    // Watermark
    ctx.font = 'bold 60px Inter, sans-serif';
    ctx.fillText(`@${user.firstName.toLowerCase()}_ecotrack`, 540, 950);

    ctx.font = '30px Inter, sans-serif';
    ctx.fillText('Powered by EcoTrack AI', 540, 1000);

    // Convert to image and show
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open();
    win.document.write(`<div style="display:flex; flex-direction:column; align-items:center; background:#121212; color:white; font-family:sans-serif; height:100vh; padding:2rem;">
        <h2>Your Impact Card is Ready!</h2>
        <p>Right-click (or long press) to save and share to Instagram</p>
        <img src="${dataUrl}" style="max-width:90%; border-radius:16px; box-shadow:0 30px 60px rgba(0,0,0,0.5)">
    </div>`);
}

function renderNGOTab(user, dynamicNGOs) {
    const grid = document.getElementById('ngoGrid');
    if (!grid) return;
    
    // Combine hardcoded sample NGOs with real registered ones
    const staticNGOs = [
        { icon: '🌱', name: 'Green India Foundation', tag: 'Reforestation' },
        { icon: '☀️', name: 'Solar Warriors', tag: 'Renewable' },
        { icon: '☁️', name: 'CSR CleanAir', tag: 'Corporate' }
    ];
    
    // Map dynamic ones to the same format
    const realNGOs = dynamicNGOs.map(ngo => ({
        icon: '🏢',
        name: ngo.name,
        tag: 'Partner Organization'
    }));

    const allNGOs = [...realNGOs, ...staticNGOs];
    
    const joinedNGOs = user.joinedNGOs || [];

    grid.innerHTML = allNGOs.map(org => {
        const isJoined = joinedNGOs.includes(org.name);
        return `
            <div class="ngo-card ${isJoined ? 'joined' : ''}">
              <div class="ngo-icon">${org.icon}</div>
              <div class="ngo-name">${org.name}</div>
              <div class="ngo-tag">${org.tag}</div>
              <button class="ngo-partner-btn" ${isJoined ? 'disabled' : ''} onclick="joinNGO('${org.name}')">
                ${isJoined ? '✓ Joined' : 'Join Partner'}
              </button>
            </div>
        `;
    }).join('');
}

async function joinNGO(name) {
    try {
        const res = await apiFetch('/ngo/join', {
            method: 'POST',
            body: JSON.stringify({ ngoName: name })
        });
        
        if (res.success) {
            showGlobalToast(res.message);
            // Update local user object
            const user = getCurrentUser();
            if (!user.joinedNGOs) user.joinedNGOs = [];
            if (!user.joinedNGOs.includes(name)) user.joinedNGOs.push(name);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
            
            // Refresh UI
            renderNGOTab(user);
            renderBadges(user);
        }
    } catch (err) {
        showGlobalToast(err.message, "error");
    }
}

// ── Badges ────────────────────────────────────────────
function renderBadges(user) {
    const grid = document.getElementById('badgesGrid');
    if (!grid) return;
    
    const hasJoinedNGO = user.joinedNGOs && user.joinedNGOs.length > 0;

    const badges = [
        { icon: '🚀', name: 'First Step', desc: 'Logged your first entry', earned: true },
        { icon: '🏆', name: 'EcoChampion', desc: 'EcoScore above 600', earned: user.ecoScore >= 600 },
        { icon: '🛡️', name: 'Earth Defender', desc: 'Tracked regularly', earned: true },
        { icon: '🤝', name: 'Eco-Partner', desc: 'Joined a green organization', earned: hasJoinedNGO }
    ];
    grid.innerHTML = badges.map(b => `
    <div class="badge-item ${b.earned ? 'earned' : 'locked'}">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc" style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">${b.desc}</div>
      <div style="font-size:0.75rem; margin-top:8px; font-weight:600; color:${b.earned ? 'var(--primary)' : 'var(--text-muted)'}">
        ${b.earned ? '✓ Earned' : '🔒 Locked'}
      </div>
    </div>
  `).join('');
}
