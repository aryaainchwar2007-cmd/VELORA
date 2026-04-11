// ============================================================
// practice.js â€” Indigo Academy Practice Arena
// ============================================================

// â”€â”€ Nav routing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Difficulty filter tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Topic filter pills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Solve Now â†’ EDITOR navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'Solve Now') {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      const card = btn.closest('.bg-surface-container-low');
      const qNode = card?.querySelector('span.text-xs.font-mono');
      const raw = (qNode?.textContent || '').trim();
      const questionNo = Number.parseInt(raw, 10);
      if (Number.isFinite(questionNo) && questionNo > 0) {
        window.location.href = `editorq.html?question_no=${questionNo}`;
      } else {
        window.location.href = 'editorq.html';
      }
    }, true);
  }
});

// â”€â”€ Bookmark toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelectorAll('button span.material-symbols-outlined').forEach(icon => {
  if (icon.textContent === 'bookmark') {
    icon.parentElement.addEventListener('click', function () {
      const filled = this.querySelector('span').textContent === 'bookmark';
      this.querySelector('span').textContent = filled ? 'bookmark_added' : 'bookmark';
      this.classList.toggle('text-tertiary', filled);
    });
  }
});

// â”€â”€ Search input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelector('input[placeholder*="Find problems"]')
  ?.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('.bg-surface-container-low.p-6.rounded-xl').forEach(card => {
      const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
      card.style.display = title.includes(q) ? '' : 'none';
    });
  });

// â”€â”€ FAB â†’ quick challenge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelector('button.fixed.bottom-8')?.addEventListener('click', () => {
  window.location.href = 'EDITOR.html';
});

// â”€â”€ Voice Help button in sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'Voice Help') {
    btn.addEventListener('click', () => alert('Voice Help: coming soon!'));
  }
});

// â”€â”€ Recommended path item click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelectorAll('.flex.items-center.justify-between.p-4.bg-surface-container').forEach(row => {
  row.addEventListener('click', () => (window.location.href = 'EDITOR.html'));
  row.style.cursor = 'pointer';
});

// â”€â”€ View Study Plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'View Study Plan') {
    btn.addEventListener('click', () => alert('Study plan feature coming soon!'));
  }
});


