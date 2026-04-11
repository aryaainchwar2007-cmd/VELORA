/**
 * ============================================================
 *  VELORA — Indigo Academy Shared JS
 *  Interconnects: welcome, dashboard, practice, EDITOR,
 *                 project, profile
 * ============================================================
 */

/* ─────────────────────────────────────────────
   1. ROUTING — page navigation between HTML files
   ───────────────────────────────────────────── */
const VELORA_ROUTES = {
  welcome:   'welcome.html',
  dashboard: 'dashboard.html',
  practice:  'practice.html',
  editor:    'EDITOR.html',
  projects:  'project.html',
  profile:   'profile.html',
};

/**
 * Navigate to another page, optionally passing state via sessionStorage.
 * @param {string} page  - key from VELORA_ROUTES
 * @param {object} [state] - optional data to pass to the target page
 */
function veloraNavigate(page, state = {}) {
  if (Object.keys(state).length) {
    sessionStorage.setItem('velora_nav_state', JSON.stringify(state));
  }
  const route = VELORA_ROUTES[page];
  if (route) {
    window.location.href = route;
  } else {
    console.warn(`[Velora] Unknown route: ${page}`);
  }
}

/** Retrieve state passed by the previous page (consumed once). */
function veloraGetNavState() {
  const raw = sessionStorage.getItem('velora_nav_state');
  if (!raw) return {};
  sessionStorage.removeItem('velora_nav_state');
  try { return JSON.parse(raw); } catch { return {}; }
}

/* ─────────────────────────────────────────────
   2. SHARED USER STORE (localStorage)
   ───────────────────────────────────────────── */
const VELORA_STORE_KEY = 'velora_user';

const VeloraUser = {
  /** Default user profile */
  defaults: {
    name:              'Luminescent Scholar',
    level:             12,
    xp:                4200,
    xpToNext:          5000,
    rank:              'Top 5%',
    streak:            14,
    timeThisMonth:     42,          // hours
    language:          'Hindi',
    branch:            'CS',
    year:              '2nd Year',
    badges:            ['Beginner Coder', 'AI Explorer', 'Hackathon Ready'],
    solvedProblems:    ['Two Sum', 'Check for Palindrome'],
    bookmarkedProblems:[],
    activeProjects:    ['Kernel-Level Memory Manager', 'Neural Style Transfer API'],
    completedProjects: ['React Portfolio v2', 'Graph Theory Sandbox'],
    notifications:     [],
    courseProgress:    { 'C Programming': 75, 'Python Basics': 40 },
    isLoggedIn:        false,
  },

  load() {
    const raw = localStorage.getItem(VELORA_STORE_KEY);
    if (!raw) return { ...this.defaults };
    try { return { ...this.defaults, ...JSON.parse(raw) }; }
    catch { return { ...this.defaults }; }
  },

  save(data) {
    localStorage.setItem(VELORA_STORE_KEY, JSON.stringify(data));
  },

  get() { return this.load(); },

  update(patch) {
    const user = this.load();
    const updated = { ...user, ...patch };
    this.save(updated);
    return updated;
  },

  /** Add XP and auto-level when threshold crossed. Returns updated user. */
  addXP(amount) {
    const user = this.load();
    user.xp += amount;
    if (user.xp >= user.xpToNext) {
      user.xp -= user.xpToNext;
      user.level += 1;
      user.xpToNext = Math.floor(user.xpToNext * 1.3);
      VeloraNotify.push(`🎉 Level Up! You are now Level ${user.level}`, 'success');
    }
    this.save(user);
    return user;
  },

  /** Mark a problem as solved; award XP by difficulty. */
  solveProblem(title, difficulty = 'Medium') {
    const xpMap = { Easy: 100, Medium: 250, Hard: 500 };
    const user = this.load();
    if (!user.solvedProblems.includes(title)) {
      user.solvedProblems.push(title);
      this.save(user);
      this.addXP(xpMap[difficulty] ?? 150);
      VeloraNotify.push(`✅ Problem "${title}" solved! +${xpMap[difficulty] ?? 150} XP`, 'success');
    }
  },

  /** Toggle bookmark on a problem. */
  toggleBookmark(title) {
    const user = this.load();
    const idx = user.bookmarkedProblems.indexOf(title);
    if (idx === -1) {
      user.bookmarkedProblems.push(title);
    } else {
      user.bookmarkedProblems.splice(idx, 1);
    }
    this.save(user);
    return user.bookmarkedProblems.includes(title);
  },

  /** Register the user from the welcome page sign-up form. */
  register({ name, branch, year, language }) {
    const user = this.update({ name, branch, year, language, isLoggedIn: true });
    VeloraNotify.push(`Welcome, ${name}! 🚀 Your journey begins now.`, 'success');
    return user;
  },

  logout() {
    const user = this.update({ isLoggedIn: false });
    VeloraNotify.push('Logged out successfully.', 'info');
    veloraNavigate('welcome');
    return user;
  },
};

/* ─────────────────────────────────────────────
   3. NOTIFICATION SYSTEM
   ───────────────────────────────────────────── */
const VeloraNotify = {
  container: null,

  _ensureContainer() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'velora-notify';
    Object.assign(this.container.style, {
      position:      'fixed',
      top:           '80px',
      right:         '24px',
      zIndex:        '9999',
      display:       'flex',
      flexDirection: 'column',
      gap:           '10px',
      maxWidth:      '320px',
      pointerEvents: 'none',
    });
    document.body.appendChild(this.container);
  },

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'info'|'error'|'warning'} [type]
   * @param {number} [duration] ms
   */
  push(message, type = 'info', duration = 4000) {
    this._ensureContainer();

    const colors = {
      success: { bg: '#1b2e24', border: '#4edea3', icon: 'check_circle' },
      info:    { bg: '#1a1929', border: '#c3c0ff', icon: 'info'         },
      error:   { bg: '#2e1b1b', border: '#ffb4ab', icon: 'error'        },
      warning: { bg: '#2e2618', border: '#ffb95f', icon: 'warning'      },
    };
    const c = colors[type] ?? colors.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
      background:${c.bg};border-left:4px solid ${c.border};
      color:#e4e1ee;padding:12px 16px;border-radius:8px;
      font-size:13px;font-family:Inter,sans-serif;
      display:flex;align-items:center;gap:10px;
      box-shadow:0 8px 30px rgba(0,0,0,0.4);
      pointer-events:all;opacity:0;
      transform:translateX(40px);
      transition:all 0.3s ease;
    `;
    toast.innerHTML = `
      <span class="material-symbols-outlined" style="color:${c.border};font-size:18px">${c.icon}</span>
      <span>${message}</span>
    `;

    this.container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 350);
    }, duration);
  },
};

/* ─────────────────────────────────────────────
   4. NAV LINK WIRING — attaches href to all nav items
      across every page automatically
   ───────────────────────────────────────────── */
const NAV_MAP = [
  { labels: ['dashboard', 'home'],    route: 'dashboard' },
  { labels: ['practice', 'terminal'], route: 'practice'  },
  { labels: ['projects'],             route: 'projects'  },
  { labels: ['profile'],              route: 'profile'   },
  { labels: ['editor'],               route: 'editor'    },
];

function wireNavLinks() {
  const allLinks = document.querySelectorAll('a[href="#"], a[href=""], nav a, aside a, .bottomnav a');

  allLinks.forEach(link => {
    const text = link.textContent.trim().toLowerCase();
    const icon = link.querySelector('.material-symbols-outlined');
    const iconName = icon ? icon.textContent.trim().toLowerCase() : '';
    const combined = text + ' ' + iconName;

    for (const entry of NAV_MAP) {
      if (entry.labels.some(label => combined.includes(label))) {
        link.href = VELORA_ROUTES[entry.route];
        link.addEventListener('click', e => {
          e.preventDefault();
          veloraNavigate(entry.route);
        });
        break;
      }
    }
  });

  // "Solve Now" buttons → editor page
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.trim() === 'Solve Now') {
      const card = btn.closest('[class*="rounded"]');
      const title = card?.querySelector('h3')?.textContent?.trim() ?? 'Unknown Problem';
      btn.addEventListener('click', () => {
        veloraNavigate('editor', { problem: title });
      });
    }
  });

  // "Join Room" / Practice Arena button on dashboard
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.trim().includes('Join Room')) {
      btn.addEventListener('click', () => veloraNavigate('practice'));
    }
    if (btn.textContent.trim().includes('Explore Repos')) {
      btn.addEventListener('click', () => veloraNavigate('projects'));
    }
  });
}

/* ─────────────────────────────────────────────
   5. WELCOME PAGE — sign-up form logic
   ───────────────────────────────────────────── */
function initWelcomePage() {
  // "Get Started" button already triggers modal via inline onclick — we just
  // enhance the form submission.
  const form = document.querySelector('#signup-modal form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name     = form.querySelector('input[type="text"]')?.value?.trim();
    const selects  = form.querySelectorAll('select');
    const branch   = selects[0]?.value ?? 'CS';
    const year     = selects[1]?.value ?? '1st Year';
    const language = selects[2]?.value ?? 'Hindi';

    if (!name) {
      VeloraNotify.push('Please enter your full name.', 'error');
      return;
    }

    VeloraUser.register({ name, branch, year, language });
    setTimeout(() => veloraNavigate('dashboard'), 1200);
  });

  // Bottom nav buttons on welcome
  const bottomBtns = document.querySelectorAll('nav.md\\:hidden button');
  const routes = ['dashboard', 'practice', 'projects', 'profile'];
  bottomBtns.forEach((btn, i) => {
    if (routes[i]) btn.addEventListener('click', () => veloraNavigate(routes[i]));
  });
}

/* ─────────────────────────────────────────────
   6. DASHBOARD PAGE — dynamic data population
   ───────────────────────────────────────────── */
function initDashboardPage() {
  const user = VeloraUser.get();

  // Update sidebar user info
  const nameEl = document.querySelector('h3.font-headline.font-bold');
  if (nameEl && nameEl.textContent === 'Luminescent Scholar') {
    nameEl.textContent = user.name;
  }

  // XP / level display
  const levelEls = document.querySelectorAll('[class*="Level"]');
  levelEls.forEach(el => {
    if (el.textContent.includes('Level')) {
      el.textContent = `Level ${user.level} Developer`;
    }
  });

  // Rank card
  const rankEl = document.querySelector('p.text-sm.font-headline.font-bold');
  if (rankEl && rankEl.textContent === 'Top 5%') {
    rankEl.textContent = user.rank;
  }

  // Time this month
  const allBolds = document.querySelectorAll('p.text-sm.font-headline.font-bold');
  allBolds.forEach(el => {
    if (el.textContent === '42h This Mo.') {
      el.textContent = `${user.timeThisMonth}h This Mo.`;
    }
  });

  // FAB rocket → navigate to practice
  const fab = document.querySelector('button.fixed.bottom-8.right-8');
  if (fab) fab.addEventListener('click', () => veloraNavigate('practice'));

  // Profile avatar click → profile page
  const profileLink = document.querySelector('header .flex.items-center.gap-2.pl-4');
  if (profileLink) profileLink.addEventListener('click', () => veloraNavigate('profile'));
}

/* ─────────────────────────────────────────────
   7. PRACTICE PAGE — bookmark + solve buttons
   ───────────────────────────────────────────── */
function initPracticePage() {
  const user = VeloraUser.get();

  // Bookmark buttons — each problem card
  document.querySelectorAll('[class*="rounded-xl"].bg-surface-container-low').forEach(card => {
    const titleEl = card.querySelector('h3');
    if (!titleEl) return;
    const title = titleEl.textContent.trim();
    const bookmarkBtn = card.querySelector('button:has(.material-symbols-outlined)');
    if (!bookmarkBtn) return;

    const icon = bookmarkBtn.querySelector('.material-symbols-outlined');
    // Restore bookmark state
    if (user.bookmarkedProblems.includes(title)) {
      icon.style.fontVariationSettings = "'FILL' 1";
      bookmarkBtn.style.color = '#ffb95f';
    }

    bookmarkBtn.addEventListener('click', () => {
      const isNowBookmarked = VeloraUser.toggleBookmark(title);
      icon.style.fontVariationSettings = isNowBookmarked ? "'FILL' 1" : "'FILL' 0";
      bookmarkBtn.style.color = isNowBookmarked ? '#ffb95f' : '';
      VeloraNotify.push(
        isNowBookmarked ? `Bookmarked "${title}"` : `Removed bookmark for "${title}"`,
        'info'
      );
    });
  });

  // FAB bolt → open random recommended problem in editor
  const fab = document.querySelector('button.fixed.bottom-8.right-8');
  if (fab) {
    fab.addEventListener('click', () => {
      const problems = ['Valid Anagram', 'Merge Sorted Lists', 'Two Sum'];
      const pick = problems[Math.floor(Math.random() * problems.length)];
      veloraNavigate('editor', { problem: pick });
    });
  }

  // AI Study Plan button
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.trim() === 'View Study Plan') {
      btn.addEventListener('click', () => {
        VeloraNotify.push('📚 Study plan updated based on your recent activity.', 'info');
      });
    }
  });
}

/* ─────────────────────────────────────────────
   8. EDITOR PAGE — run code, AI mentor chat,
      teach-me popup, problem title injection
   ───────────────────────────────────────────── */
function initEditorPage() {
  const navState = veloraGetNavState();

  // Show problem title if navigated from practice
  if (navState.problem) {
    const titleEl = document.querySelector('span.text-xs.text-outline.font-medium');
    if (titleEl) titleEl.textContent = navState.problem;
    VeloraNotify.push(`Solving: ${navState.problem}`, 'info');
  }

  // ── Run Code button ──
  const runBtn = document.querySelector('button:has(span[class*="play_arrow"])') ??
                 [...document.querySelectorAll('button')].find(b => b.textContent.includes('Run Code'));
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      VeloraNotify.push('⚙️ Running code… Output ready!', 'info', 2500);

      // Simulate solve + XP when run is clicked (demo behaviour)
      const problem = navState.problem ?? 'Fibonacci';
      setTimeout(() => {
        VeloraUser.solveProblem(problem, 'Medium');
      }, 1500);
    });
  }

  // ── AI Mentor chat ──
  const chatInput = document.querySelector('input[placeholder*="AI Mentor"]');
  const sendBtn   = document.querySelector('button:has(span[class*="send"])');
  const chatArea  = document.querySelector('.flex-1.overflow-y-auto.p-6.space-y-6');

  function appendUserMessage(text) {
    if (!chatArea) return;
    const div = document.createElement('div');
    div.className = 'flex flex-col items-end gap-2';
    div.innerHTML = `
      <div class="bg-surface-container-high px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%]">
        <p class="text-sm text-on-surface">${escapeHTML(text)}</p>
      </div>`;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function appendAIMessage(text) {
    if (!chatArea) return;
    const div = document.createElement('div');
    div.className = 'flex items-start gap-3 max-w-[90%]';
    div.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
        <span class="material-symbols-outlined text-on-primary text-sm" style="font-variation-settings:'FILL' 1">smart_toy</span>
      </div>
      <div class="flex flex-col gap-2">
        <div class="bg-surface-variant/40 backdrop-blur-md px-4 py-3 rounded-2xl rounded-tl-none border-l-2 border-primary">
          <p class="text-sm text-on-surface leading-relaxed">${text}</p>
        </div>
        <span class="text-[10px] text-outline px-2">Just now • AI Mentor</span>
      </div>`;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  const AI_RESPONSES = [
    'Great question! Think of it step by step — break the problem into smaller sub-problems. 🧩',
    'Bilkul sahi! Yeh concept <span class="text-primary font-bold">recursion</span> ka ek perfect example hai. Try to trace the call stack mentally.',
    'Time complexity: O(n). Kya aap O(log n) solution soch sakte ho? Hint: binary search! 🔍',
    'You\'re on the right track. Remember: edge cases bhi handle karo — empty array aur single element.',
    'Python mein <code class="bg-surface-container px-1 rounded text-primary">list comprehension</code> use karo — code 60% chhota ho jayega! 💡',
    'Interesting approach! Consider using a <span class="text-secondary font-medium">hash map</span> for O(1) lookups instead of nested loops.',
  ];

  function handleSend() {
    const text = chatInput?.value?.trim();
    if (!text) return;
    appendUserMessage(text);
    if (chatInput) chatInput.value = '';

    // Simulate AI thinking
    setTimeout(() => {
      const response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
      appendAIMessage(response);
    }, 800);
  }

  sendBtn?.addEventListener('click', handleSend);
  chatInput?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });

  // ── Teach Me popup close ──
  const closeTeachMe = document.querySelector('.absolute.bottom-10 button');
  const teachMePopup = document.querySelector('.absolute.bottom-10');
  if (closeTeachMe && teachMePopup) {
    closeTeachMe.addEventListener('click', () => teachMePopup.remove());
  }

  // ── "Next" inside teach-me ──
  const nextBtn = document.querySelector('.absolute.bottom-10 button:last-child');
  const stepEl  = document.querySelector('.absolute.bottom-10 .rounded-full:first-child');
  let step = 1;
  const steps = [
    { label: 'Step 1/3', text: 'Think of a <span class="text-primary font-bold">Variable</span> like a box with a label. 📦<br><br>You put information (data) inside it so you can use it later by just calling its name!' },
    { label: 'Step 2/3', text: 'A <span class="text-primary font-bold">Function</span> is like a recipe. 🍳<br><br>You give it ingredients (parameters), follow the steps (body), and get a result (return value).' },
    { label: 'Step 3/3', text: '<span class="text-primary font-bold">Loops</span> let you repeat an action many times. 🔁<br><br>Instead of writing the same line 10 times, just say "do this 10 times" with a for/while loop.' },
  ];

  if (nextBtn && stepEl && teachMePopup) {
    nextBtn.addEventListener('click', () => {
      step++;
      if (step > steps.length) { teachMePopup.remove(); return; }
      const s = steps[step - 1];
      stepEl.textContent = s.label;
      const pEl = teachMePopup.querySelector('p.text-xs');
      if (pEl) pEl.innerHTML = s.text;
      if (step === steps.length) nextBtn.textContent = 'Done';
    });
  }

  // ── Voice Help FAB ──
  const voiceFab = document.querySelector('button.fixed.bottom-8.right-8');
  if (voiceFab) {
    voiceFab.addEventListener('click', () => {
      VeloraNotify.push('🎙️ Voice Help activated. Speak your question…', 'info');
    });
  }

  // ── Side nav icon links ──
  const sideIcons = document.querySelectorAll('aside .p-3');
  const sideRoutes = ['editor', 'dashboard', 'projects', 'profile'];
  sideIcons.forEach((icon, i) => {
    if (sideRoutes[i]) {
      icon.style.cursor = 'pointer';
      icon.addEventListener('click', () => veloraNavigate(sideRoutes[i]));
    }
  });
}

/* ─────────────────────────────────────────────
   9. PROJECT PAGE
   ───────────────────────────────────────────── */
function initProjectPage() {
  // "Open in New" completed projects
  document.querySelectorAll('.material-symbols-outlined').forEach(el => {
    if (el.textContent.trim() === 'open_in_new') {
      el.closest('[class*="rounded"]')?.addEventListener('click', () => {
        VeloraNotify.push('📂 Opening project… (demo mode)', 'info');
      });
    }
  });

  // Progress bars — animate on load
  document.querySelectorAll('.h-full.bg-gradient-to-r').forEach(bar => {
    const width = bar.style.width;
    bar.style.width = '0';
    setTimeout(() => { bar.style.transition = 'width 1s ease'; bar.style.width = width; }, 300);
  });

  // "New Project" / "See Other Ideas" buttons
  document.querySelectorAll('button').forEach(btn => {
    const t = btn.textContent.trim();
    if (t === 'New Project' || t.includes('Start Building')) {
      btn.addEventListener('click', () => {
        VeloraUser.update({ streak: VeloraUser.get().streak });
        VeloraNotify.push('🚀 New project started! Good luck!', 'success');
        veloraNavigate('editor');
      });
    }
    if (t === 'See Other Ideas') {
      btn.addEventListener('click', () => VeloraNotify.push('💡 Loading more project ideas…', 'info'));
    }
  });
}

/* ─────────────────────────────────────────────
   10. PROFILE PAGE
   ───────────────────────────────────────────── */
function initProfilePage() {
  const user = VeloraUser.get();

  // Populate name
  document.querySelectorAll('h1, h2, h3').forEach(el => {
    if (el.textContent.trim() === 'Luminescent Scholar') el.textContent = user.name;
  });

  // Download All certificates button
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.includes('Download All')) {
      btn.addEventListener('click', () => {
        VeloraNotify.push('📥 Downloading certificates ZIP…', 'info');
      });
    }
  });

  // Individual download buttons
  document.querySelectorAll('button:has(.material-symbols-outlined)').forEach(btn => {
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon?.textContent.trim() === 'download') {
      const cert = btn.closest('[class*="rounded"]')?.querySelector('h4')?.textContent;
      btn.addEventListener('click', () => {
        VeloraNotify.push(`📄 Downloading "${cert ?? 'Certificate'}"…`, 'info');
      });
    }
  });

  // Badge hover tooltips (add title attr)
  document.querySelectorAll('[class*="Badge Wall"] ~ div .group, .grid.grid-cols-2 .group').forEach(badgeEl => {
    const name = badgeEl.querySelector('p.text-sm')?.textContent;
    if (name) badgeEl.title = name;
  });
}

/* ─────────────────────────────────────────────
   11. GLOBAL SEARCH (all pages)
   ───────────────────────────────────────────── */
function initGlobalSearch() {
  const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"], input[placeholder*="Find"]');
  const SEARCH_INDEX = [
    { title: 'Dashboard',             route: 'dashboard', icon: 'dashboard'    },
    { title: 'Practice Arena',        route: 'practice',  icon: 'terminal'     },
    { title: 'Project Hub',           route: 'projects',  icon: 'account_tree' },
    { title: 'Profile & Badges',      route: 'profile',   icon: 'person'       },
    { title: 'AI Coding Editor',      route: 'editor',    icon: 'code'         },
    { title: 'Two Sum',               route: 'practice',  icon: 'terminal'     },
    { title: 'Binary Tree Traversal', route: 'editor',    icon: 'code'         },
    { title: 'Sudoku Solver',         route: 'editor',    icon: 'code'         },
    { title: 'C Programming Course',  route: 'dashboard', icon: 'school'       },
  ];

  searchInputs.forEach(input => {
    let dropdown = null;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (dropdown) { dropdown.remove(); dropdown = null; }
      if (!q) return;

      const results = SEARCH_INDEX.filter(r => r.title.toLowerCase().includes(q));
      if (!results.length) return;

      dropdown = document.createElement('div');
      dropdown.style.cssText = `
        position:absolute;background:#1f1f28;border:1px solid #464555;
        border-radius:8px;margin-top:6px;width:280px;z-index:9999;
        box-shadow:0 8px 30px rgba(0,0,0,0.5);overflow:hidden;
      `;
      results.slice(0, 5).forEach(r => {
        const item = document.createElement('div');
        item.style.cssText = 'padding:10px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;color:#e4e1ee;';
        item.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px;color:#c3c0ff">${r.icon}</span>${r.title}`;
        item.addEventListener('mouseenter', () => item.style.background = '#2a2933');
        item.addEventListener('mouseleave', () => item.style.background = '');
        item.addEventListener('click', () => veloraNavigate(r.route));
        dropdown.appendChild(item);
      });

      // Position relative to input
      const wrapper = input.closest('div') ?? input.parentElement;
      wrapper.style.position = 'relative';
      wrapper.appendChild(dropdown);
    });

    document.addEventListener('click', e => {
      if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
        dropdown.remove(); dropdown = null;
      }
    });
  });
}

/* ─────────────────────────────────────────────
   12. NOTIFICATIONS BELL
   ───────────────────────────────────────────── */
function initNotificationBell() {
  document.querySelectorAll('.material-symbols-outlined').forEach(el => {
    if (el.textContent.trim() === 'notifications') {
      const btn = el.closest('button') ?? el;
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const user = VeloraUser.get();
        const msgs = user.notifications.length
          ? user.notifications.slice(-3).join('<br>')
          : 'No new notifications.';
        VeloraNotify.push(msgs, 'info', 4000);
      });
    }
  });
}

/* ─────────────────────────────────────────────
   13. UPGRADE / PRO BUTTON
   ───────────────────────────────────────────── */
function initProButton() {
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.trim().includes('Go Pro') || btn.closest('button')?.textContent.includes('workspace_premium')) {
      btn.addEventListener('click', () => VeloraNotify.push('⭐ Indigo Academy Pro coming soon! Stay tuned.', 'info'));
    }
  });
}

/* ─────────────────────────────────────────────
   14. UTILITY
   ───────────────────────────────────────────── */
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Detect which page is currently active based on <title> or body/pathname */
function detectPage() {
  const title = document.title.toLowerCase();
  const path  = window.location.pathname.toLowerCase();

  if (title.includes('dashboard') || path.includes('dashboard'))   return 'dashboard';
  if (title.includes('editor')    || path.includes('editor'))      return 'editor';
  if (title.includes('practice')  || path.includes('practice'))    return 'practice';
  if (title.includes('project')   || path.includes('project'))     return 'projects';
  if (title.includes('profile')   || path.includes('profile'))     return 'profile';
  if (title.includes('welcome')   || title.includes('master cod')
      || path.includes('welcome'))                                  return 'welcome';
  return 'unknown';
}

/* ─────────────────────────────────────────────
   15. BOOTSTRAP — runs on every page
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const page = detectPage();

  // Always run
  wireNavLinks();
  initGlobalSearch();
  initNotificationBell();
  initProButton();

  // Page-specific
  switch (page) {
    case 'welcome':   initWelcomePage();   break;
    case 'dashboard': initDashboardPage(); break;
    case 'practice':  initPracticePage();  break;
    case 'editor':    initEditorPage();    break;
    case 'projects':  initProjectPage();   break;
    case 'profile':   initProfilePage();   break;
  }

  console.log(`[Velora] ✅ Initialized on page: ${page}`);
});