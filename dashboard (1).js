// ============================================================
// dashboard.js — Indigo Academy Student Dashboard
// ============================================================

// ── Navigation routing ───────────────────────────────────────
document.querySelectorAll('nav a, aside a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const text = link.querySelector('span:last-child')?.textContent?.trim() || '';
    const routes = {
      'Dashboard': 'dashboard.html',
      'Practice':  'practice.html',
      'Projects':  'project.html',
      'Profile':   'profile.html',
    };
    if (routes[text]) window.location.href = routes[text];
  });
});

// ── Greeting (time-aware) ────────────────────────────────────
(function updateGreeting() {
  const h1 = document.querySelector('main > header h1');
  if (!h1) return;
  const hour = new Date().getHours();
  const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  h1.textContent = h1.textContent.replace(/^(Morning|Afternoon|Evening)/, period);
})();

// ── Continue Lesson button ────────────────────────────────────
document.querySelector('button.indigo-gradient')?.addEventListener('click', () => {
  window.location.href = 'EDITOR.html';
});

// ── Practice Arena card ───────────────────────────────────────
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'Join Room') {
    btn.addEventListener('click', () => (window.location.href = 'practice.html'));
  }
  if (btn.textContent.trim() === 'Explore Repos') {
    btn.addEventListener('click', () => (window.location.href = 'project.html'));
  }
});

// ── FAB (rocket) scroll-to-top / quick action ────────────────
document.querySelector('button.fixed.bottom-8')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Search input ──────────────────────────────────────────────
const searchInput = document.querySelector('input[placeholder="Search curriculum..."]');
searchInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && searchInput.value.trim()) {
    alert(`Searching for: "${searchInput.value.trim()}"\n(Wire up to your search API here)`);
  }
});

// ── Notifications bell ────────────────────────────────────────
document.querySelector('[data-icon="notifications"]')?.addEventListener('click', () => {
  alert('No new notifications.');
});

// ── Progress ring animation (CSS stroke-dashoffset on load) ──
document.querySelectorAll('circle.text-primary, circle.text-secondary').forEach(circle => {
  const original = circle.getAttribute('stroke-dashoffset');
  circle.setAttribute('stroke-dashoffset', '251.2'); // start at 0 %
  requestAnimationFrame(() => {
    circle.style.transition = 'stroke-dashoffset 1s ease';
    circle.setAttribute('stroke-dashoffset', original);
  });
});

// ── Teach Me popup close (EDITOR page reuses this component) ─
// (kept here in case dashboard embeds it)
document.querySelectorAll('button span.material-symbols-outlined').forEach(btn => {
  if (btn.textContent === 'close') {
    btn.closest('.absolute')?.querySelector('button')?.addEventListener('click', function () {
      this.closest('.absolute').style.display = 'none';
    });
  }
});
