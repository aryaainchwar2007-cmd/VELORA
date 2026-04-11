// ============================================================
// dashboard.js â€” Indigo Academy Student Dashboard
// ============================================================

// â”€â”€ Navigation routing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Greeting (time-aware) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(function updateGreeting() {
  const h1 = document.querySelector('main > header h1');
  if (!h1) return;
  const hour = new Date().getHours();
  const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  h1.textContent = h1.textContent.replace(/^(Morning|Afternoon|Evening)/, period);
})();

// â”€â”€ Continue Lesson button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelectorAll('button').forEach((btn) => {
  if ((btn.textContent || '').trim() === 'Continue Lesson') {
    btn.addEventListener('click', () => {
      window.location.href = 'course.html';
    });
  }
});

// â”€â”€ Practice Arena card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'Join Room') {
    btn.addEventListener('click', () => (window.location.href = 'practice.html'));
  }
  if (btn.textContent.trim() === 'Explore Repos') {
    btn.addEventListener('click', () => (window.location.href = 'project.html'));
  }
});

// â”€â”€ FAB (rocket) scroll-to-top / quick action â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelector('button.fixed.bottom-8')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// â”€â”€ Search input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const searchInput = document.querySelector('input[placeholder="Search curriculum..."]');
searchInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && searchInput.value.trim()) {
    alert(`Searching for: "${searchInput.value.trim()}"\n(Wire up to your search API here)`);
  }
});

// â”€â”€ Notifications bell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelector('[data-icon="notifications"]')?.addEventListener('click', () => {
  alert('No new notifications.');
});

// â”€â”€ Progress ring animation (CSS stroke-dashoffset on load) â”€â”€
document.querySelectorAll('circle.text-primary, circle.text-secondary').forEach(circle => {
  const original = circle.getAttribute('stroke-dashoffset');
  circle.setAttribute('stroke-dashoffset', '251.2'); // start at 0 %
  requestAnimationFrame(() => {
    circle.style.transition = 'stroke-dashoffset 1s ease';
    circle.setAttribute('stroke-dashoffset', original);
  });
});

// â”€â”€ Teach Me popup close (EDITOR page reuses this component) â”€
// (kept here in case dashboard embeds it)
document.querySelectorAll('button span.material-symbols-outlined').forEach(btn => {
  if (btn.textContent === 'close') {
    btn.closest('.absolute')?.querySelector('button')?.addEventListener('click', function () {
      this.closest('.absolute').style.display = 'none';
    });
  }
});

