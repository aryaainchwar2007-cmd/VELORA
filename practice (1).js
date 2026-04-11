// ============================================================
// practice.js — Indigo Academy Practice Arena
// ============================================================

// ── Nav routing ───────────────────────────────────────────────
document.querySelectorAll('aside nav a, header nav a').forEach(link => {
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

// ── Difficulty filter tabs ────────────────────────────────────
(function () {
  const diffBtns = Array.from(
    document.querySelectorAll('button')
  ).filter(b => ['Easy', 'Medium', 'Hard'].includes(b.textContent.trim()));

  diffBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      diffBtns.forEach(b => {
        b.classList.remove('bg-secondary-container', 'text-on-secondary');
        b.classList.add('bg-surface-container-high', 'text-on-surface-variant');
      });
      this.classList.remove('bg-surface-container-high', 'text-on-surface-variant');
      this.classList.add('bg-secondary-container', 'text-on-secondary');
      filterByDifficulty(this.textContent.trim());
    });
  });

  function filterByDifficulty(diff) {
    document.querySelectorAll('.bg-surface-container-low.p-6.rounded-xl').forEach(card => {
      const badge = card.querySelector('[class*="rounded-full"]')?.textContent?.trim()?.toUpperCase();
      card.style.display = (!badge || badge === diff.toUpperCase()) ? '' : 'none';
    });
  }
})();

// ── Topic filter pills ────────────────────────────────────────
(function () {
  const topicBtns = Array.from(
    document.querySelectorAll('button')
  ).filter(b => ['All Topics', 'Loops', 'Arrays', 'Recursion', 'Trees', 'Dynamic Programming'].includes(b.textContent.trim()));

  topicBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      topicBtns.forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary');
        b.classList.add('bg-surface-container-high', 'text-on-surface-variant');
      });
      this.classList.remove('bg-surface-container-high', 'text-on-surface-variant');
      this.classList.add('bg-primary', 'text-on-primary');
    });
  });
})();

// ── Solve Now → EDITOR navigation ────────────────────────────
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'Solve Now') {
    btn.addEventListener('click', () => (window.location.href = 'EDITOR.html'));
  }
});

// ── Bookmark toggle ───────────────────────────────────────────
document.querySelectorAll('button span.material-symbols-outlined').forEach(icon => {
  if (icon.textContent === 'bookmark') {
    icon.parentElement.addEventListener('click', function () {
      const filled = this.querySelector('span').textContent === 'bookmark';
      this.querySelector('span').textContent = filled ? 'bookmark_added' : 'bookmark';
      this.classList.toggle('text-tertiary', filled);
    });
  }
});

// ── Search input ──────────────────────────────────────────────
document.querySelector('input[placeholder*="Find problems"]')
  ?.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('.bg-surface-container-low.p-6.rounded-xl').forEach(card => {
      const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
      card.style.display = title.includes(q) ? '' : 'none';
    });
  });

// ── FAB → quick challenge ─────────────────────────────────────
document.querySelector('button.fixed.bottom-8')?.addEventListener('click', () => {
  window.location.href = 'EDITOR.html';
});

// ── Voice Help button in sidebar ─────────────────────────────
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'Voice Help') {
    btn.addEventListener('click', () => alert('Voice Help: coming soon!'));
  }
});

// ── Recommended path item click ───────────────────────────────
document.querySelectorAll('.flex.items-center.justify-between.p-4.bg-surface-container').forEach(row => {
  row.addEventListener('click', () => (window.location.href = 'EDITOR.html'));
  row.style.cursor = 'pointer';
});

// ── View Study Plan ───────────────────────────────────────────
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'View Study Plan') {
    btn.addEventListener('click', () => alert('Study plan feature coming soon!'));
  }
});
