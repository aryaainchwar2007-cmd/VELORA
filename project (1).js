// ============================================================
// project.js — Indigo Academy Project Hub
// ============================================================

// ── Nav routing ───────────────────────────────────────────────
document.querySelectorAll('aside nav a, header + * nav a').forEach(link => {
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

// ── Mobile bottom-nav ─────────────────────────────────────────
document.querySelectorAll('nav.md\\:hidden a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const map = {
      Dashboard: 'dashboard.html', Practice: 'practice.html',
      Projects:  'project.html',  Profile: 'profile.html',
    };
    const t = link.querySelector('span:last-child')?.textContent?.trim();
    if (map[t]) window.location.href = map[t];
  });
});

// ── Link GitHub button ────────────────────────────────────────
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim().includes('Link GitHub')) {
    btn.addEventListener('click', () => {
      const repo = prompt('Enter your GitHub username:');
      if (repo) alert(`GitHub linked: github.com/${repo}\n(Connect to your OAuth flow here)`);
    });
  }
});

// ── AI Idea Generator ─────────────────────────────────────────
const ideas = [
  { title: 'Distributed File System with Raft Consensus', desc: 'Solidify your distributed computing knowledge after excelling in OS.' },
  { title: 'Real-Time Collaborative Code Editor',          desc: 'Build a VS Code-like editor with WebSockets and OT/CRDT.' },
  { title: 'Compiler for a Subset of C',                  desc: 'Implement lexer, parser, and code generator from scratch.' },
  { title: 'Graph Database from Scratch',                  desc: 'Implement property graphs, Cypher-like queries, and BFS/DFS.' },
];
let ideaIdx = 0;

document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'See Other Ideas') {
    btn.addEventListener('click', () => {
      ideaIdx = (ideaIdx + 1) % ideas.length;
      const idea = ideas[ideaIdx];
      const box = document.querySelector('.bg-surface-container-lowest.p-6.rounded-xl p');
      if (box) box.innerHTML = `<span class="text-primary font-bold">${idea.title}</span>. ${idea.desc}`;
    });
  }
  if (btn.textContent.trim() === 'Initialize Project') {
    btn.addEventListener('click', () => {
      const name = document.querySelector('.bg-surface-container-lowest.p-6 span.text-primary')?.textContent;
      alert(`Project initialised: "${name}"\n(Connect to your project creation API here)`);
    });
  }
});

// ── Progress bars animate on load ────────────────────────────
document.querySelectorAll('.h-full.bg-gradient-to-r').forEach(bar => {
  const target = bar.style.width;
  bar.style.width = '0';
  requestAnimationFrame(() => {
    bar.style.transition = 'width 1s ease';
    bar.style.width = target;
  });
});

// ── Completed project "open_in_new" ──────────────────────────
document.querySelectorAll('span[data-icon="open_in_new"]').forEach(icon => {
  icon.parentElement.style.cursor = 'pointer';
  icon.parentElement.addEventListener('click', function () {
    const name = this.querySelector('p.font-bold')?.textContent;
    alert(`Opening project: "${name}"\n(Link to your hosted demo / GitHub repo here)`);
  });
});

// ── Search bar ────────────────────────────────────────────────
document.querySelector('div[class*="hidden lg:flex items-center bg-surface"]')
  ?.addEventListener('click', () => {
    const q = prompt('Search projects:');
    if (q) alert(`Searching for "${q}" (connect to your backend)`);
  });

// ── View All link ─────────────────────────────────────────────
document.querySelectorAll('span.text-primary.font-semibold').forEach(el => {
  if (el.textContent.trim() === 'View All') {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => alert('Full project list coming soon!'));
  }
});

// ── Voice Help ────────────────────────────────────────────────
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'Voice Help') {
    btn.addEventListener('click', () => alert('Voice Help: coming soon!'));
  }
});
