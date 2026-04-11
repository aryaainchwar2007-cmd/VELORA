// ============================================================
// profile.js — Indigo Academy Profile & Achievements
// ============================================================

// ── Nav routing ───────────────────────────────────────────────
document.querySelectorAll('nav a, aside a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const map = {
      Dashboard: 'dashboard.html',
      Practice:  'practice.html',
      Projects:  'project.html',
      Profile:   'profile.html',
    };
    const t = link.textContent.trim();
    if (map[t]) window.location.href = map[t];
  });
});

// ── Mobile bottom-nav routing ─────────────────────────────────
document.querySelectorAll('.md\\:hidden.fixed.bottom-0 a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const map = {
      Dashboard: 'dashboard.html',
      Practice:  'practice.html',
      Profile:   'profile.html',
      Settings:  '#',
    };
    const t = link.querySelector('span:last-child')?.textContent?.trim();
    if (map[t]) window.location.href = map[t];
  });
});

// ── Certificate download (placeholder) ───────────────────────
document.querySelectorAll('button span.material-symbols-outlined').forEach(icon => {
  if (icon.textContent === 'download') {
    icon.parentElement.addEventListener('click', function () {
      const cert = this.closest('.flex.items-center')?.querySelector('h4')?.textContent;
      alert(`Downloading certificate:\n"${cert}"\n\n(Wire up to your file server here)`);
    });
  }
});

// ── Download All ZIP ─────────────────────────────────────────
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'Download All (ZIP)') {
    btn.addEventListener('click', () => alert('Bundling certificates… (connect to backend)'));
  }
});

// ── Badge hover tooltip ───────────────────────────────────────
document.querySelectorAll('.group .w-16.h-16').forEach(badge => {
  badge.parentElement.setAttribute('title',
    badge.parentElement.querySelector('p')?.textContent || 'Badge');
});

// ── Heatmap dynamic generation (replaces static HTML cells) ──
(function generateHeatmap() {
  const grid = document.querySelector('.grid.grid-flow-col.grid-rows-7');
  if (!grid) return;

  // Build 52 weeks × 7 days = 364 cells
  grid.innerHTML = '';
  const levels = ['bg-surface-container-highest', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary/80', 'bg-primary'];
  for (let i = 0; i < 364; i++) {
    const cell = document.createElement('div');
    const idx = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * levels.length);
    cell.className = `w-3 h-3 rounded-[2px] ${levels[idx]} transition-transform hover:scale-125`;
    cell.title = `${Math.floor(Math.random() * 8)} contributions`;
    grid.appendChild(cell);
  }
})();

// ── Leaderboard "View All" ────────────────────────────────────
document.querySelectorAll('span.text-primary.font-bold').forEach(el => {
  if (el.textContent.trim() === 'View All') {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => alert('Full leaderboard coming soon!'));
  }
});

// ── Voice Help ────────────────────────────────────────────────
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'Voice Help') {
    btn.addEventListener('click', () => alert('Voice Help: coming soon!'));
  }
});
