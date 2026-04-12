// ============================================================
// profile (1).js — CODE SAGE Profile & Achievements
// ============================================================

(function () {
  const API_BASE_URL = 'http://127.0.0.1:8000';
  const AUTH_STORE_KEY = 'velora_auth';

  function goTo(route) {
    window.location.href = route;
  }

  // Top/side nav routing
  document.querySelectorAll('nav a, aside a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const map = {
        Dashboard: 'dashboard.html',
        Practice: 'practice.html',
        Projects: 'project.html',
        Profile: 'profile.html',
      };
      const text = (link.textContent || '').trim();
      if (map[text]) goTo(map[text]);
    });
  });

  // Mobile bottom nav routing
  document.querySelectorAll('.md\\:hidden.fixed.bottom-0 a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const map = {
        Dashboard: 'dashboard.html',
        Practice: 'practice.html',
        Profile: 'profile.html',
        Settings: '#',
      };
      const text = link.querySelector('span:last-child')?.textContent?.trim();
      if (text && map[text]) goTo(map[text]);
    });
  });

  function getAccessToken() {
    try {
      const raw = localStorage.getItem(AUTH_STORE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data?.token?.access_token || null;
    } catch (_) {
      return null;
    }
  }

  async function authFetch(path, options = {}) {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Login required. Please sign in from welcome page.');
    }
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    if (response.status === 401) {
      localStorage.removeItem(AUTH_STORE_KEY);
      throw new Error('Session expired. Please login again.');
    }
    return response;
  }

  function extractFilename(response, fallback = 'certificate.pdf') {
    const contentDisposition = response.headers.get('content-disposition') || '';
    const match = /filename\*?=(?:UTF-8''|\")?([^\";]+)/i.exec(contentDisposition);
    if (!match || !match[1]) return fallback;
    return decodeURIComponent(match[1].replace(/^\"|\"$/g, '')).trim() || fallback;
  }

  function triggerDownload(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }

  async function downloadCertificate(courseName) {
    try {
      const response = await authFetch('/generate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course: courseName }),
      });

      if (!response.ok) {
        let detail = 'Failed to generate certificate.';
        try {
          const data = await response.json();
          if (typeof data?.detail === 'string') detail = data.detail;
        } catch (_) {}
        throw new Error(detail);
      }

      const blob = await response.blob();
      const fallbackName = `${courseName.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'certificate'}.pdf`;
      const fileName = extractFilename(response, fallbackName);
      triggerDownload(blob, fileName);
    } catch (err) {
      const message = err?.message || 'Certificate download failed.';
      alert(message);
      if (message.toLowerCase().includes('login')) {
        setTimeout(() => goTo('welcome.html'), 500);
      }
    }
  }

  // Individual certificate download buttons
  const certificateCards = Array.from(document.querySelectorAll('.lg\\:col-span-7 .space-y-4 > div'));
  certificateCards.forEach((card) => {
    const title = (card.querySelector('h4')?.textContent || '').trim().replace(/\s+/g, ' ');
    const btn = card.querySelector('button');
    if (btn && title) {
      btn.dataset.course = title;
    }
  });

  document.querySelectorAll('button span.material-symbols-outlined').forEach((icon) => {
    if ((icon.textContent || '').trim() !== 'download') return;
    const button = icon.closest('button');
    if (!button) return;

    button.addEventListener('click', async () => {
      const courseName = (button.dataset.course || '').trim();
      if (!courseName) {
        alert('Course name not found for this certificate.');
        return;
      }
      const original = button.innerHTML;
      button.disabled = true;
      button.classList.add('opacity-60');
      button.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span>';
      try {
        await downloadCertificate(courseName);
      } finally {
        button.disabled = false;
        button.classList.remove('opacity-60');
        button.innerHTML = original;
      }
    });
  });

  // Download All (ZIP) currently downloads each listed certificate one-by-one as PDF
  document.querySelectorAll('button').forEach((btn) => {
    if ((btn.textContent || '').trim() !== 'Download All (ZIP)') return;
    btn.addEventListener('click', async () => {
      const courseNames = certificateCards
        .map((card) => {
          const button = card.querySelector('button');
          if (button?.dataset.course) return button.dataset.course.trim();
          return (card.querySelector('h4')?.textContent || '').trim().replace(/\s+/g, ' ');
        })
        .filter(Boolean);

      if (!courseNames.length) {
        alert('No certificates found.');
        return;
      }

      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Preparing...';

      try {
        for (const courseName of courseNames) {
          await downloadCertificate(courseName);
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  });

  // Badge tooltip
  document.querySelectorAll('.group .w-16.h-16').forEach((badge) => {
    const title = badge.parentElement?.querySelector('p')?.textContent || 'Badge';
    badge.parentElement?.setAttribute('title', title);
  });

  // Heatmap generation
  (function generateHeatmap() {
    const grid = document.querySelector('.grid.grid-flow-col.grid-rows-7');
    if (!grid) return;
    grid.innerHTML = '';
    const levels = [
      'bg-surface-container-highest',
      'bg-primary/20',
      'bg-primary/40',
      'bg-primary/60',
      'bg-primary/80',
      'bg-primary',
    ];

    for (let i = 0; i < 364; i += 1) {
      const cell = document.createElement('div');
      const idx = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * levels.length);
      cell.className = `w-3 h-3 rounded-[2px] ${levels[idx]} transition-transform hover:scale-125`;
      cell.title = `${Math.floor(Math.random() * 8)} contributions`;
      grid.appendChild(cell);
    }
  })();

  // Leaderboard "View All"
  document.querySelectorAll('span.text-primary.font-bold').forEach((el) => {
    if ((el.textContent || '').trim() === 'View All') {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => alert('Full leaderboard coming soon!'));
    }
  });

  // Voice Help
  document.querySelectorAll('button').forEach((btn) => {
    if ((btn.textContent || '').trim() === 'Voice Help') {
      btn.addEventListener('click', () => alert('Voice Help: coming soon!'));
    }
  });
})();

