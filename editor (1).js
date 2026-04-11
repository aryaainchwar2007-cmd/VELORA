// ============================================================
// editor.js — Indigo Academy AI Coding Editor
// ============================================================

// ── Voice input (already in HTML inline – centralised here) ──
(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const inputEl   = document.getElementById('aiMentorInput');
  const micBtn    = document.getElementById('voiceMicBtn');
  const langSel   = document.getElementById('voiceLangSelect');
  const statusEl  = document.getElementById('voiceStatus');
  const badge     = document.getElementById('detectedLanguageBadge');

  if (!SpeechRecognition) {
    if (statusEl) statusEl.textContent = 'Voice input not supported. Use latest Chrome/Edge.';
    if (micBtn)  micBtn.disabled = true;
    return;
  }

  const LANG_LABELS = {
    'en-IN': 'English', 'hi-IN': 'Hindi', 'mr-IN': 'Marathi',
    'ta-IN': 'Tamil',   'te-IN': 'Telugu','kn-IN': 'Kannada',
    'ml-IN': 'Malayalam'
  };

  let listening = false, stopReq = false, activeRec = null;

  const setStatus = t => { if (statusEl) statusEl.textContent = t; };
  const showBadge = lang => {
    if (!badge) return;
    if (!lang) { badge.classList.add('hidden'); return; }
    badge.textContent = 'Detected: ' + (LANG_LABELS[lang] || lang);
    badge.classList.remove('hidden');
  };
  const setMic = on => {
    listening = on;
    if (!micBtn) return;
    micBtn.classList.toggle('text-error', on);
    micBtn.title = on ? 'Stop voice input' : 'Start voice input';
  };

  function recogniseOnce(lang, ms = 4500) {
    return new Promise(res => {
      const rec = new SpeechRecognition();
      let done = false, text = '', conf = 0, timer = null;
      const finish = r => { if (done) return; done = true; clearTimeout(timer); activeRec = null; res(r); };
      rec.lang = lang; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 1;
      activeRec = rec;
      rec.onresult = ev => {
        const segs = [];
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const alt = ev.results[i][0];
          if (ev.results[i].isFinal && alt?.transcript) { segs.push(alt.transcript.trim()); conf = Math.max(conf, alt.confidence || 0); }
        }
        text = segs.join(' ').trim();
      };
      rec.onerror = () => finish({ lang, text: '', confidence: 0 });
      rec.onend   = () => finish({ lang, text, confidence: conf });
      try { rec.start(); } catch { finish({ lang, text: '', confidence: 0 }); return; }
      timer = setTimeout(() => { try { rec.stop(); } catch {} }, ms);
    });
  }

  async function startListening() {
    if (listening) {
      stopReq = true;
      try { activeRec?.stop(); } catch {}
      setStatus('Stopping…');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      stopReq = false; setMic(true); showBadge(null);
      const lang = langSel?.value || 'en-IN';
      setStatus('Listening (' + (LANG_LABELS[lang] || lang) + ')…');
      const res = await recogniseOnce(lang, 6000);
      if (!stopReq && res.text) {
        if (inputEl) inputEl.value = res.text;
        showBadge(lang);
        setStatus('Voice captured');
      } else if (!stopReq) {
        setStatus('No speech detected, try again');
      }
    } catch {
      setStatus('Mic permission blocked. Please allow microphone access.');
    } finally { setMic(false); }
  }

  micBtn?.addEventListener('click', startListening);
})();

// ── Language tab switcher (Python / C++) ─────────────────────
document.querySelectorAll('.flex.bg-surface-container-high button').forEach(btn => {
  btn.addEventListener('click', function () {
    this.closest('.flex').querySelectorAll('button').forEach(b => {
      b.classList.remove('bg-primary-container', 'text-on-primary-container');
      b.classList.add('text-on-surface-variant');
    });
    this.classList.add('bg-primary-container', 'text-on-primary-container');
    this.classList.remove('text-on-surface-variant');
  });
});

// ── Run Code button ───────────────────────────────────────────
document.querySelector('button span.material-symbols-outlined')?.closest('button')?.
  addEventListener('click', () => {
    // Placeholder – replace with actual code execution API call
    alert('Code execution is not wired in this demo.\nConnect your backend runner here.');
  });

// ── Teach Me popup close ──────────────────────────────────────
document.querySelector('.absolute.bottom-10 button')?.addEventListener('click', function () {
  this.closest('.absolute').style.display = 'none';
});

// ── Teach Me "Next" step ─────────────────────────────────────
(function () {
  let step = 1;
  const steps = [
    { title: 'Teach Me: Variables', body: 'Think of a <span class="text-primary font-bold">Variable</span> like a box with a label. 📦<br/><br/>You put information (data) inside it so you can use it later by just calling its name!' },
    { title: 'Teach Me: Types',     body: 'Variables can hold different <span class="text-primary font-bold">Types</span> of data — numbers, text, or true/false values. Python figures out the type automatically!' },
    { title: 'Teach Me: Scope',     body: 'A variable created inside a function is only <span class="text-primary font-bold">visible</span> inside that function. Outside, it\'s invisible — just like a secret 🤫' },
  ];
  const popup = document.querySelector('.absolute.bottom-10');
  const nextBtn  = popup?.querySelector('button:last-child');
  const stepBtn  = popup?.querySelector('button:first-child');
  const bodyEl   = popup?.querySelector('p');
  const titleEl  = popup?.querySelector('span.font-bold');

  nextBtn?.addEventListener('click', () => {
    step = (step % steps.length) + 1;
    const s = steps[step - 1];
    if (titleEl) titleEl.textContent = s.title;
    if (bodyEl)  bodyEl.innerHTML   = s.body;
    if (stepBtn) stepBtn.textContent = `Step ${step}/${steps.length}`;
  });
})();

// ── AI Mentor chat send ───────────────────────────────────────
(function () {
  const input   = document.getElementById('aiMentorInput');
  const sendBtn = input?.closest('div')?.querySelector('button:last-child');
  const chatEl  = document.querySelector('.flex-1.overflow-y-auto.p-6.space-y-6');

  function appendMessage(text, isUser = true) {
    if (!chatEl) return;
    const div = document.createElement('div');
    div.className = isUser ? 'flex flex-col items-end gap-2' : 'flex items-start gap-3 max-w-[90%]';
    div.innerHTML = isUser
      ? `<div class="bg-surface-container-high px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%]"><p class="text-sm text-on-surface">${text}</p></div>`
      : `<div class="flex flex-col gap-2"><div class="bg-surface-variant/40 backdrop-blur-md px-4 py-3 rounded-2xl rounded-tl-none border-l-2 border-primary"><p class="text-sm text-on-surface leading-relaxed">${text}</p></div></div>`;
    chatEl.appendChild(div);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  async function sendMessage() {
    const q = input?.value?.trim();
    if (!q) return;
    input.value = '';
    appendMessage(q, true);
    // Placeholder AI response — connect to /v1/messages here
    setTimeout(() => appendMessage('AI Mentor is thinking… (connect to Anthropic API)', false), 600);
  }

  sendBtn?.addEventListener('click', sendMessage);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
})();

// ── Nav link routing ──────────────────────────────────────────
document.querySelectorAll('header nav a, aside a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const map = { 'Dashboard': 'dashboard.html', 'Practice': 'practice.html', 'Projects': 'project.html' };
    const t = link.textContent.trim();
    if (map[t]) window.location.href = map[t];
  });
});
