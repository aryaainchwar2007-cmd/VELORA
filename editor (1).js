// ============================================================
// editor (1).js — Indigo Academy AI Coding Editor
// ============================================================

(function () {
  const editor = document.getElementById('codeEditor');
  const lineNumbers = document.getElementById('lineNumbers');
  const outputEl = document.getElementById('codeOutput');
  const runBtn = document.getElementById('runCodeBtn');
  const teachMeToggleBtn = document.getElementById('teachMeToggleBtn');
  const resizer = document.getElementById('paneResizer');
  const rightPane = document.getElementById('aiRightPane');
  const leftPane = document.getElementById('editorLeftPane');
  const chatInput = document.getElementById('aiMentorInput');
  const chatContainer = document.querySelector('.flex-1.overflow-y-auto.p-6.space-y-6');
  const sendBtn = chatInput?.closest('.relative')?.querySelector('button:last-child');
  const chatSpeakBtn = document.getElementById('chatSpeakBtn');
  const langSelect = document.getElementById('voiceLangSelect');
  const refreshAiBtn = Array.from(document.querySelectorAll('button')).find((b) =>
    (b.textContent || '').toUpperCase().includes('REFRESH AI')
  );
  const chatHistoryBtn = Array.from(document.querySelectorAll('button')).find((b) =>
    (b.textContent || '').toUpperCase().includes('CHAT HISTORY')
  );
  const AUTH_STORE_KEY = 'velora_auth';
  const CHAT_SESSION_KEY = 'velora_chat_session_id';
  const API_BASE_URL = 'http://127.0.0.1:8000';
  const LESSON_DEFAULT_COURSE = 'python-foundations';
  let chatSessionId = sessionStorage.getItem(CHAT_SESSION_KEY) || null;
  let latestBotReply = '';
  let ttsAudio = null;

  if (!editor || !lineNumbers) return;

  if (resizer && rightPane && leftPane) {
    let isResizing = false;
    const minRight = 320;
    const maxRight = 900;

    const onMove = (e) => {
      if (!isResizing) return;
      const rightWidth = Math.min(maxRight, Math.max(minRight, window.innerWidth - e.clientX));
      rightPane.style.flex = '0 0 auto';
      rightPane.style.width = `${rightWidth}px`;
      leftPane.style.flex = '1 1 auto';
    };

    const stopResize = () => {
      isResizing = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', stopResize);
    };

    resizer.addEventListener('mousedown', (e) => {
      if (window.innerWidth < 768) return;
      e.preventDefault();
      isResizing = true;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', stopResize);
    });
  }

  const defaultCode = `def calculate_fibonacci(n):
    # Fibonacci sequence generator
    sequence = [0, 1]

    while len(sequence) < n:
        next_val = sequence[-1] + sequence[-2]
        sequence.append(next_val)

    return sequence

n_terms = 10
result = calculate_fibonacci(n_terms)
print(f"The first {n_terms} terms: {result}")`;

  editor.value = localStorage.getItem('editorCode') || defaultCode;

  function updateLineNumbers() {
    const lines = editor.value.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('<br/>');
  }

  function setOutput(message, isError = false) {
    if (!outputEl) return;
    outputEl.textContent = message;
    outputEl.classList.toggle('text-error', isError);
    outputEl.classList.toggle('text-on-surface', !isError);
  }

  function simplifyAiExplanation(text) {
    if (!text) return 'No AI explanation available.';
    const lines = String(text).split('\n');
    const blocked = [/^\s*Mistake\s*:/i, /^\s*Fix\s*:/i, /^\s*Improved\s*Code\s*:/i, /^\s*Working\s*Code\s*:/i];
    const kept = [];
    for (const line of lines) {
      if (blocked.some((r) => r.test(line))) {
        break;
      }
      kept.push(line);
    }
    const cleaned = kept.join('\n').trim();
    return cleaned || 'No AI explanation available.';
  }

  function getLessonSelectionFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const course = (params.get('course') || LESSON_DEFAULT_COURSE).trim();
    const lessonNum = Number(params.get('lesson') || '1');
    const lesson = Number.isFinite(lessonNum) && lessonNum > 0 ? lessonNum : 1;
    return { course, lesson };
  }

  function chunkLessonContent(text, maxChunkLength = 420) {
    const lines = String(text || '')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) return ['No lesson content available.'];

    const chunks = [];
    let current = '';
    const splitLongLine = (line) => {
      const parts = [];
      let rest = line;
      while (rest.length > maxChunkLength) {
        parts.push(rest.slice(0, maxChunkLength));
        rest = rest.slice(maxChunkLength);
      }
      if (rest.length) parts.push(rest);
      return parts;
    };

    for (const line of lines) {
      for (const piece of splitLongLine(line)) {
        const candidate = current ? `${current}\n\n${piece}` : piece;
        if (candidate.length > maxChunkLength && current) {
          chunks.push(current);
          current = piece;
        } else {
          current = candidate;
        }
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  function parseLessonByLanguage(content) {
    const supported = ['ENGLISH', 'HINDI', 'MARATHI', 'TAMIL', 'TELUGU', 'KANNADA', 'MALAYALAM'];
    const sections = Object.fromEntries(supported.map((lang) => [lang, '']));
    const lines = String(content || '').split('\n');
    let currentLang = 'ENGLISH';

    for (const rawLine of lines) {
      const line = rawLine || '';
      const normalized = line.toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
      const matched = supported.find((lang) => normalized === lang || normalized.endsWith(` ${lang}`) || normalized.startsWith(`${lang} `));
      if (matched) {
        currentLang = matched;
        continue;
      }
      sections[currentLang] = (sections[currentLang] ? `${sections[currentLang]}\n` : '') + line;
    }

    return sections;
  }

  editor.addEventListener('input', () => {
    updateLineNumbers();
    localStorage.setItem('editorCode', editor.value);
  });

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 4;
      updateLineNumbers();
      localStorage.setItem('editorCode', editor.value);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
  });

  editor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = editor.scrollTop;
  });

  window.clearCode = function () {
    editor.value = '';
    localStorage.removeItem('editorCode');
    updateLineNumbers();
    setOutput('Run code to see output.');
    editor.focus();
  };

  window.resetCode = function () {
    editor.value = defaultCode;
    localStorage.setItem('editorCode', defaultCode);
    updateLineNumbers();
    setOutput('Run code to see output.');
    editor.focus();
  };

  async function runCode() {
    const code = editor.value.trim();
    if (!code) {
      setOutput('Editor is empty. Please write code first.', true);
      return;
    }

    if (runBtn) {
      runBtn.disabled = true;
      runBtn.classList.add('opacity-70');
    }
    setOutput('Running code...');

    try {
      const response = await fetch('http://127.0.0.1:8000/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language_id: 71 }),
      });

      const data = await response.json();
      if (!response.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        throw new Error(detail || 'Run request failed.');
      }

      if (data.error) {
        const evalResp = await fetch('http://127.0.0.1:8000/evaluate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language_id: 71 }),
        });

        const evalData = await evalResp.json();
        if (!evalResp.ok) {
          const evalDetail = typeof evalData.detail === 'string' ? evalData.detail : JSON.stringify(evalData.detail);
          throw new Error(evalDetail || 'AI evaluation failed.');
        }

        const aiExplanation = simplifyAiExplanation(evalData.ai_explanation);
        const pretty = [
          'Execution Error (AI Analysis)',
          '-----------------------------',
          evalData.error ? `Error: ${evalData.error}` : 'Error: Unknown',
          '',
          aiExplanation,
        ].join('\n');
        setOutput(pretty, true);
      } else if (typeof data.output === 'string' && data.output.length) {
        setOutput(data.output);
      } else {
        setOutput('(No output)');
      }
    } catch (err) {
      setOutput(`Could not run code: ${err.message || err}`, true);
    } finally {
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.classList.remove('opacity-70');
      }
    }
  }

  runBtn?.addEventListener('click', runCode);

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
      throw new Error('Login required. Please sign in again from welcome page.');
    }
    const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    if (response.status === 401) {
      localStorage.removeItem(AUTH_STORE_KEY);
      sessionStorage.removeItem(CHAT_SESSION_KEY);
      chatSessionId = null;
      setTimeout(() => {
        window.location.href = 'welcome.html';
      }, 500);
      throw new Error('Session expired. Please login again.');
    }
    return response;
  }

  async function startChatSession() {
    const response = await authFetch('/chat/session/start', { method: 'POST' });
    const data = await response.json();
    if (!response.ok) {
      const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      throw new Error(detail || 'Could not start chat session.');
    }
    chatSessionId = data.session_id;
    sessionStorage.setItem(CHAT_SESSION_KEY, chatSessionId);
    if (chatContainer) chatContainer.innerHTML = '';
  }

  async function loadChatHistory() {
    if (!chatSessionId) return;
    const response = await authFetch(`/chat/history?session_id=${encodeURIComponent(chatSessionId)}`);
    const data = await response.json();
    if (!response.ok) {
      const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      throw new Error(detail || 'Could not load chat history.');
    }
    if (chatContainer) chatContainer.innerHTML = '';
    (data.messages || []).forEach((m) => {
      if (m.role === 'user') appendUserMessage(m.content || '');
      if (m.role === 'assistant') appendBotMessage(m.content || '');
    });
  }

  async function endChatSession() {
    if (!chatSessionId) return;
    try {
      await authFetch(`/chat/session/end?session_id=${encodeURIComponent(chatSessionId)}`, { method: 'POST', keepalive: true });
    } catch (_) {}
    sessionStorage.removeItem(CHAT_SESSION_KEY);
    chatSessionId = null;
  }

  function selectedChatLanguage() {
    const code = langSelect?.value || 'en-IN';
    const map = {
      'en-IN': 'English',
      'hi-IN': 'Hindi',
      'mr-IN': 'Marathi',
      'ta-IN': 'Tamil',
      'te-IN': 'Telugu',
      'kn-IN': 'Kannada',
      'ml-IN': 'Malayalam',
    };
    return map[code] || 'English';
  }

  function appendUserMessage(text) {
    if (!chatContainer) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col items-end gap-2';
    wrapper.innerHTML = `
      <div class="bg-surface-container-high px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%]">
        <p class="text-sm text-on-surface"></p>
      </div>
    `;
    wrapper.querySelector('p').textContent = text;
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function appendBotMessage(text) {
    if (!chatContainer) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-start gap-3 max-w-[90%]';
    wrapper.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
        <span class="material-symbols-outlined text-on-primary text-sm" style="font-variation-settings: 'FILL' 1;">smart_toy</span>
      </div>
      <div class="flex flex-col gap-2">
        <div class="bg-surface-variant/40 backdrop-blur-md px-4 py-3 rounded-2xl rounded-tl-none border-l-2 border-primary">
          <p class="text-sm text-on-surface leading-relaxed whitespace-pre-wrap"></p>
        </div>
        <span class="text-[10px] text-outline px-2">Just now • Code Sage</span>
      </div>
    `;
    wrapper.querySelector('p').textContent = text;
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    if (text && !/^typing\.\.\.$/i.test(text.trim())) {
      latestBotReply = text;
    }
  }

  function setSpeakButtonLoading(isLoading) {
    if (!chatSpeakBtn) return;
    chatSpeakBtn.disabled = isLoading;
    chatSpeakBtn.classList.toggle('opacity-70', isLoading);
    const icon = chatSpeakBtn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = isLoading ? 'hourglass_top' : 'volume_up';
  }

  function stopActiveSpeech() {
    if (ttsAudio) {
      ttsAudio.pause();
      ttsAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakButtonLoading(false);
  }

  function speakWithBrowser(text) {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      appendBotMessage('Speech not supported in this browser.');
      return;
    }
    stopActiveSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langSelect?.value || 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakButtonLoading(false);
    utterance.onerror = () => setSpeakButtonLoading(false);
    setSpeakButtonLoading(true);
    window.speechSynthesis.speak(utterance);
  }

  async function speakLatestBotReply() {
    const text = (latestBotReply || '').trim();
    if (!text) {
      appendBotMessage('No AI response available to read yet.');
      return;
    }

    stopActiveSpeech();
    setSpeakButtonLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/legacy/chat/text-to-speech?text=${encodeURIComponent(text)}&language=${encodeURIComponent(
          selectedChatLanguage()
        )}`,
        { method: 'POST' }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.audio_url) {
        throw new Error(data?.error || data?.detail || 'Legacy TTS request failed.');
      }

      ttsAudio = new Audio(`${data.audio_url}${data.audio_url.includes('?') ? '&' : '?'}t=${Date.now()}`);
      ttsAudio.onended = () => setSpeakButtonLoading(false);
      ttsAudio.onerror = () => {
        setSpeakButtonLoading(false);
        speakWithBrowser(text);
      };
      await ttsAudio.play();
    } catch (_) {
      speakWithBrowser(text);
    }
  }

  async function sendChat() {
    const message = (chatInput?.value || '').trim();
    if (!message) return;

    try {
      if (!chatSessionId) {
        await startChatSession();
      }

      appendUserMessage(message);
      chatInput.value = '';

      const typingId = 'typing-' + Date.now();
      appendBotMessage('Typing...');
      const typingEl = chatContainer?.lastElementChild;
      if (typingEl) typingEl.id = typingId;

      const response = await authFetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          language: selectedChatLanguage(),
          session_id: chatSessionId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        throw new Error(detail || 'Chat request failed.');
      }

      const typingNode = document.getElementById(typingId);
      if (typingNode) typingNode.remove();
      appendBotMessage(data.reply || 'No response from assistant.');
    } catch (err) {
      const typingNode = chatContainer?.querySelector('[id^="typing-"]');
      if (typingNode) typingNode.remove();
      appendBotMessage(`Chat error: ${err.message || err}`);
    }
  }

  sendBtn?.addEventListener('click', sendChat);
  chatSpeakBtn?.addEventListener('click', speakLatestBotReply);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendChat();
    }
  });

  refreshAiBtn?.addEventListener('click', async () => {
    await endChatSession();
    await startChatSession();
  });
  chatHistoryBtn?.addEventListener('click', async () => {
    try {
      await loadChatHistory();
    } catch (e) {
      appendBotMessage(`History error: ${e.message || e}`);
    }
  });

  window.addEventListener('beforeunload', () => {
    endChatSession();
  });

  // Teach Me popup driven by selected lesson content
  const teachMePopup = document.querySelector('.absolute.bottom-10.left-10');
  if (teachMePopup) {
    const closeBtn = document.getElementById('teachMeCloseBtn') || teachMePopup.querySelector('.flex.items-start.justify-between.mb-3 button');
    const stepBtn = document.getElementById('teachMeStepBtn');
    const prevBtn = document.getElementById('teachMePrevBtn');
    const nextBtn = document.getElementById('teachMeNextBtn');
    const languageSelect = document.getElementById('teachMeLangSelect');
    const titleEl = teachMePopup.querySelector('.font-bold.text-sm');
    const bodyEl = document.getElementById('teachMeBody') || teachMePopup.querySelector('p.text-xs');
    let teachIndex = 0;
    let teachPages = [];
    let teachTitle = 'Lesson';
    let lessonLanguageSections = {};
    let selectedTeachLanguage = 'ENGLISH';

    function setTeachMeVisible(visible) {
      teachMePopup.style.display = visible ? '' : 'none';
    }

    closeBtn?.addEventListener('click', () => {
      setTeachMeVisible(false);
    });
    teachMeToggleBtn?.addEventListener('click', () => {
      const hidden = getComputedStyle(teachMePopup).display === 'none';
      setTeachMeVisible(hidden);
    });

    function renderTeachPage() {
      if (!teachPages.length) {
        teachPages = ['No lesson content available.'];
        teachIndex = 0;
      }
      if (titleEl) titleEl.textContent = `Teach Me: ${teachTitle}`;
      if (bodyEl) {
        bodyEl.classList.add('whitespace-pre-wrap');
        bodyEl.classList.add('overflow-y-auto');
        bodyEl.textContent = teachPages[teachIndex];
      }
      if (stepBtn) stepBtn.textContent = `Step ${teachIndex + 1}/${teachPages.length}`;
    }

    nextBtn?.addEventListener('click', () => {
      if (!teachPages.length) return;
      teachIndex = teachIndex >= teachPages.length - 1 ? 0 : teachIndex + 1;
      renderTeachPage();
    });
    prevBtn?.addEventListener('click', () => {
      if (!teachPages.length) return;
      teachIndex = teachIndex <= 0 ? teachPages.length - 1 : teachIndex - 1;
      renderTeachPage();
    });

    function applyTeachLanguage(language) {
      selectedTeachLanguage = language || 'ENGLISH';
      const sectionText = (lessonLanguageSections[selectedTeachLanguage] || '').trim();
      const fallbackText = (lessonLanguageSections.ENGLISH || '').trim();
      const finalText = sectionText || fallbackText || 'Lesson plan could not be loaded for selected language.';
      teachPages = chunkLessonContent(finalText);
      teachIndex = 0;
      renderTeachPage();
    }

    languageSelect?.addEventListener('change', () => {
      applyTeachLanguage(languageSelect.value);
    });

    async function loadTeachMeFromSelectedLesson() {
      const selected = getLessonSelectionFromUrl();
      const response = await fetch(
        `${API_BASE_URL}/courses/${encodeURIComponent(selected.course)}/lessons/${encodeURIComponent(selected.lesson)}`
      );
      if (!response.ok) {
        throw new Error('Could not load lesson plan from database.');
      }
      const lesson = await response.json();
      teachTitle = lesson?.title || `Lesson ${selected.lesson}`;
      lessonLanguageSections = parseLessonByLanguage(lesson?.content || '');
      const preferred = languageSelect?.value || 'ENGLISH';
      applyTeachLanguage(preferred);
    }

    loadTeachMeFromSelectedLesson().catch(() => {
      teachTitle = 'Lesson';
      lessonLanguageSections = {};
      applyTeachLanguage(languageSelect?.value || 'ENGLISH');
    });
  }

  // optional language tab visual switch
  document.querySelectorAll('.flex.bg-surface-container-high button').forEach((btn) => {
    btn.addEventListener('click', function () {
      this.closest('.flex').querySelectorAll('button').forEach((b) => {
        b.classList.remove('bg-primary-container', 'text-on-primary-container');
        b.classList.add('text-on-surface-variant');
      });
      this.classList.add('bg-primary-container', 'text-on-primary-container');
      this.classList.remove('text-on-surface-variant');
    });
  });

  updateLineNumbers();
  setOutput('Run code to see output.');

  (async () => {
    try {
      if (!chatSessionId) {
        await startChatSession();
      } else {
        await loadChatHistory();
      }
    } catch (e) {
      try {
        await startChatSession();
      } catch (inner) {
        appendBotMessage(`Chat session error: ${inner.message || inner}`);
      }
    }
  })();
})();
