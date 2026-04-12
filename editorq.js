(function () {
  const API_BASE_URL = 'http://127.0.0.1:8000';
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const VOICE_LANG_LABELS = {
    'en-IN': 'English',
    'hi-IN': 'Hindi',
    'mr-IN': 'Marathi',
    'ta-IN': 'Tamil',
    'te-IN': 'Telugu',
    'kn-IN': 'Kannada',
    'ml-IN': 'Malayalam',
  };

  const runBtn = document.getElementById('runCodeBtn');
  const submitBtn = document.getElementById('submitCodeBtn');
  const codeEditor = document.getElementById('codeEditor');
  const codeInput = document.getElementById('codeInput');
  const questionPanel = document.getElementById('questionPanel');
  const questionResizeHandle = document.getElementById('questionResizeHandle');
  const lineNumbers = document.getElementById('lineNumbers');
  const codeOutput = document.getElementById('codeOutput');
  const consoleResizeHandle = document.getElementById('consoleResizeHandle');
  const mentorMessages = document.getElementById('mentorMessages');
  const mentorInput = document.getElementById('mentorInput');
  const mentorSendBtn = document.getElementById('mentorSendBtn');
  const mentorPanel = document.getElementById('mentorPanel');
  const mentorResizeHandle = document.getElementById('mentorResizeHandle');
  const mentorSuggestions = Array.from(document.querySelectorAll('[data-chat-suggestion]'));
  const mentorVoiceLangSelect = document.getElementById('mentorVoiceLangSelect');
  const mentorVoiceMicBtn = document.getElementById('mentorVoiceMicBtn');
  const mentorVoiceStatus = document.getElementById('mentorVoiceStatus');
  const mentorDetectedLanguageBadge = document.getElementById('mentorDetectedLanguageBadge');

  const difficultyEl = document.getElementById('questionDifficulty');
  const titleEl = document.getElementById('questionTitle');
  const codeEl = document.getElementById('questionCode');
  const statementEl = document.getElementById('questionStatement');
  const testCasesEl = document.getElementById('questionTestCases');
  const keywordsEl = document.getElementById('questionKeywords');
  const PRACTICE_COURSE_SLUG = 'python-foundations';
  const EASY_PROGRESS_KEY = 'velora_easy_correct_count';
  const EASY_PROGRESS_TARGET = 3;

  let chatSessionId = null;
  let chatSessionPromise = null;
  let currentProblem = null;
  let incorrectAttempts = 0;
  let easyCorrectCount = Number.parseInt(localStorage.getItem(EASY_PROGRESS_KEY) || '0', 10);
  let successModalEl = null;
  let failModalEl = null;
  let levelChoiceModalEl = null;
  let mentorListening = false;
  let mentorStopRequested = false;
  let mentorActiveRecognition = null;
  let mentorTranscriptBaseText = '';
  let mentorFinalTranscript = '';
  let mentorMediaRecorder = null;
  let mentorAudioChunks = [];
  let mentorAudioStream = null;

  function getQuestionNoFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const q = Number.parseInt(params.get('question_no') || '1', 10);
    return Number.isFinite(q) && q > 0 ? q : 1;
  }

  function updateLineNumbers() {
    if (!codeEditor || !lineNumbers) return;
    const total = codeEditor.value.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: total }, (_, i) => `${i + 1}`).join('<br/>');
    lineNumbers.scrollTop = codeEditor.scrollTop;
  }

  function setOutput(message, isError = false) {
    if (!codeOutput) return;
    codeOutput.textContent = message;
    codeOutput.classList.toggle('text-error', isError);
    codeOutput.classList.toggle('text-outline/50', !isError);
    codeOutput.classList.remove('italic');
  }

  function initLinkedConsoleResize() {
    if (!consoleResizeHandle || !codeInput || !codeOutput) return;

    const MIN_HEIGHT = 64;
    const MAX_HEIGHT = 260;
    let linkedHeight = 176;
    let dragging = false;
    let startY = 0;
    let startHeight = linkedHeight;

    const clamp = (value) => Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, value));
    const applyHeight = (nextHeight) => {
      linkedHeight = clamp(nextHeight);
      codeInput.style.height = `${linkedHeight}px`;
      codeOutput.style.height = `${linkedHeight}px`;
    };

    const onPointerMove = (event) => {
      if (!dragging) return;
      const delta = startY - event.clientY;
      applyHeight(startHeight + delta);
    };

    const stopDragging = () => {
      dragging = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };

    consoleResizeHandle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      dragging = true;
      startY = event.clientY;
      startHeight = linkedHeight;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
    });

    applyHeight(linkedHeight);
  }

  function initQuestionPanelResize() {
    if (!questionPanel || !questionResizeHandle) return;

    const MIN_WIDTH = 280;
    const MAX_WIDTH = 620;
    let currentWidth = Math.round(questionPanel.getBoundingClientRect().width || 380);
    let dragging = false;
    let startX = 0;
    let startWidth = currentWidth;

    const clamp = (value) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
    const shouldResize = () => window.matchMedia('(min-width: 768px)').matches;

    const applyWidth = (nextWidth) => {
      currentWidth = clamp(nextWidth);
      questionPanel.style.width = `${currentWidth}px`;
      questionPanel.style.minWidth = `${currentWidth}px`;
      questionPanel.style.maxWidth = `${currentWidth}px`;
      localStorage.setItem('velora_question_panel_width', String(currentWidth));
    };

    const onPointerMove = (event) => {
      if (!dragging) return;
      const delta = event.clientX - startX;
      applyWidth(startWidth + delta);
    };

    const stopDragging = () => {
      dragging = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };

    questionResizeHandle.addEventListener('pointerdown', (event) => {
      if (!shouldResize()) return;
      event.preventDefault();
      dragging = true;
      startX = event.clientX;
      startWidth = currentWidth;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
    });

    const savedWidth = Number.parseInt(localStorage.getItem('velora_question_panel_width') || '', 10);
    if (Number.isFinite(savedWidth) && savedWidth > 0) {
      applyWidth(savedWidth);
    } else {
      applyWidth(currentWidth);
    }
  }

  function initMentorPanelResize() {
    if (!mentorPanel || !mentorResizeHandle) return;

    const MIN_WIDTH = 280;
    const MAX_WIDTH = 620;
    let currentWidth = Math.round(mentorPanel.getBoundingClientRect().width || 360);
    let dragging = false;
    let startX = 0;
    let startWidth = currentWidth;

    const clamp = (value) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
    const shouldResize = () => window.matchMedia('(min-width: 1024px)').matches;

    const applyWidth = (nextWidth) => {
      currentWidth = clamp(nextWidth);
      mentorPanel.style.width = `${currentWidth}px`;
      mentorPanel.style.minWidth = `${currentWidth}px`;
      mentorPanel.style.maxWidth = `${currentWidth}px`;
      localStorage.setItem('velora_mentor_panel_width', String(currentWidth));
    };

    const onPointerMove = (event) => {
      if (!dragging) return;
      const delta = startX - event.clientX;
      applyWidth(startWidth + delta);
    };

    const stopDragging = () => {
      dragging = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };

    mentorResizeHandle.addEventListener('pointerdown', (event) => {
      if (!shouldResize()) return;
      event.preventDefault();
      dragging = true;
      startX = event.clientX;
      startWidth = currentWidth;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
    });

    const savedWidth = Number.parseInt(localStorage.getItem('velora_mentor_panel_width') || '', 10);
    if (Number.isFinite(savedWidth) && savedWidth > 0) {
      applyWidth(savedWidth);
    } else {
      applyWidth(currentWidth);
    }
  }

  function normalizeOutput(value) {
    return String(value ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+$/gm, '')
      .trim();
  }

  function shouldRetryWithSplitInput(errorText, stdin) {
    const rawError = String(errorText || '');
    const rawInput = String(stdin || '');
    if (!rawInput.trim()) return false;
    if (rawInput.includes('\n')) return false;
    if (!/\s+/.test(rawInput.trim())) return false;

    // Common beginner mismatch: testcase is "3 5" but code uses int(input()) twice.
    return /ValueError|EOFError|invalid literal for int\(\)/i.test(rawError);
  }

  function ensureSuccessModal() {
    if (successModalEl) return successModalEl;

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-primary/30 bg-surface-container-high p-6 shadow-2xl shadow-primary/15">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
            <span class="material-symbols-outlined">emoji_events</span>
          </div>
          <h3 class="text-lg font-headline font-extrabold text-on-surface">Well done!</h3>
        </div>
        <p class="text-sm text-on-surface-variant mb-5">Your answer is correct. Ready for the next challenge?</p>
        <button id="nextQuestionModalBtn" type="button" class="w-full px-4 py-2.5 rounded-xl font-semibold bg-primary-container text-white hover:opacity-90 transition-all duration-150 active:scale-95">
          Next Question
        </button>
      </div>
    `;

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
      }
    });

    document.body.appendChild(overlay);
    const nextBtn = overlay.querySelector('#nextQuestionModalBtn');
    nextBtn?.addEventListener('click', () => {
      redirectToNextQuestion();
    });

    successModalEl = overlay;
    return overlay;
  }

  function showSuccessModal() {
    const modal = ensureSuccessModal();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function ensureFailModal() {
    if (failModalEl) return failModalEl;

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-error/40 bg-surface-container-high p-6 shadow-2xl shadow-error/10">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-error-container/30 flex items-center justify-center text-error">
            <span class="material-symbols-outlined">error</span>
          </div>
          <h3 class="text-lg font-headline font-extrabold text-on-surface">Incorrect Output</h3>
        </div>
        <p class="text-sm text-on-surface-variant mb-5">You have reached 3 attempts. Let’s revise the matching lesson first.</p>
        <button id="goToLessonModalBtn" type="button" class="w-full px-4 py-2.5 rounded-xl font-semibold bg-primary-container text-white hover:opacity-90 transition-all duration-150 active:scale-95">
          Go to lesson
        </button>
      </div>
    `;

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
      }
    });

    document.body.appendChild(overlay);
    const goBtn = overlay.querySelector('#goToLessonModalBtn');
    goBtn?.addEventListener('click', async () => {
      if (!(goBtn instanceof HTMLButtonElement)) return;
      goBtn.disabled = true;
      goBtn.textContent = 'Opening lesson...';
      try {
        await redirectToKeywordLesson(currentProblem);
      } catch (_) {
        goBtn.disabled = false;
        goBtn.textContent = 'Go to lesson';
      }
    });

    failModalEl = overlay;
    return overlay;
  }

  function showFailModal() {
    const modal = ensureFailModal();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const goBtn = modal.querySelector('#goToLessonModalBtn');
    if (goBtn instanceof HTMLButtonElement) {
      goBtn.disabled = false;
      goBtn.textContent = 'Go to lesson';
    }
  }

  function normalizeDifficulty(value) {
    return String(value || 'easy').trim().toLowerCase();
  }

  function getNextDifficulty(currentDifficulty) {
    const current = normalizeDifficulty(currentDifficulty);
    if (current === 'easy') return 'medium';
    if (current === 'medium') return 'hard';
    return 'hard';
  }

  function ensureLevelChoiceModal() {
    if (levelChoiceModalEl) return levelChoiceModalEl;

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-primary/30 bg-surface-container-high p-6 shadow-2xl shadow-primary/15">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
            <span class="material-symbols-outlined">trophy</span>
          </div>
          <h3 class="text-lg font-headline font-extrabold text-on-surface">Great Progress!</h3>
        </div>
        <p class="text-sm text-on-surface-variant mb-5">You solved 3 Easy questions correctly. Choose your next step.</p>
        <div class="grid grid-cols-1 gap-3">
          <button id="staySameLevelBtn" type="button" class="w-full px-4 py-2.5 rounded-xl font-semibold bg-surface-container-lowest border border-outline-variant/20 text-on-surface hover:bg-surface-container-highest transition-all duration-150 active:scale-95">
            Stay on Easy
          </button>
          <button id="goNextLevelBtn" type="button" class="w-full px-4 py-2.5 rounded-xl font-semibold bg-primary-container text-white hover:opacity-90 transition-all duration-150 active:scale-95">
            Go to Medium
          </button>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
      }
    });

    document.body.appendChild(overlay);

    const stayBtn = overlay.querySelector('#staySameLevelBtn');
    const nextBtn = overlay.querySelector('#goNextLevelBtn');

    stayBtn?.addEventListener('click', async () => {
      if (!(stayBtn instanceof HTMLButtonElement) || !(nextBtn instanceof HTMLButtonElement)) return;
      stayBtn.disabled = true;
      nextBtn.disabled = true;
      stayBtn.textContent = 'Opening...';
      await redirectToDifficultyQuestion('easy');
      stayBtn.disabled = false;
      nextBtn.disabled = false;
      stayBtn.textContent = 'Stay on Easy';
    });

    nextBtn?.addEventListener('click', async () => {
      if (!(stayBtn instanceof HTMLButtonElement) || !(nextBtn instanceof HTMLButtonElement)) return;
      stayBtn.disabled = true;
      nextBtn.disabled = true;
      nextBtn.textContent = 'Opening...';
      await redirectToDifficultyQuestion(getNextDifficulty(currentProblem?.difficulty || 'easy'));
      stayBtn.disabled = false;
      nextBtn.disabled = false;
      nextBtn.textContent = 'Go to Medium';
    });

    levelChoiceModalEl = overlay;
    return overlay;
  }

  function showLevelChoiceModal() {
    const modal = ensureLevelChoiceModal();
    const nextBtn = modal.querySelector('#goNextLevelBtn');
    if (nextBtn instanceof HTMLButtonElement) {
      const nextDifficulty = getNextDifficulty(currentProblem?.difficulty || 'easy');
      nextBtn.textContent = `Go to ${nextDifficulty.charAt(0).toUpperCase()}${nextDifficulty.slice(1)}`;
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function getConsoleInput() {
    return (codeInput?.value || '').trim();
  }

  function getAuthToken() {
    return window.VeloraSession?.getToken?.() || null;
  }

  function getPreferredLanguage() {
    const supported = new Set(['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam']);
    const user = window.VeloraSession?.getUser?.();
    const rawLanguage = user?.language || user?.preferred_language || localStorage.getItem('velora_language') || 'English';
    const normalized = String(rawLanguage).trim();
    return supported.has(normalized) ? normalized : 'English';
  }

  function parseApiError(data, fallbackMessage) {
    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    return fallbackMessage;
  }

  function detectLanguageFromText(text) {
    if (!text) return null;
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN';
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN';
    if (/[\u0900-\u097F]/.test(text)) {
      const normalized = text.toLowerCase();
      const marathiHints = /\b(आहे|आहेत|मला|तुला|तुम्ही|काय|नाही|आणि|होय|मी)\b/;
      const hindiHints = /\b(है|हूँ|हैं|मैं|आप|क्यों|नहीं|और|क्या)\b/;
      if (marathiHints.test(normalized) && !hindiHints.test(normalized)) return 'mr-IN';
      return 'hi-IN';
    }
    return 'en-IN';
  }

  function updateMentorLanguageBadge(langCode) {
    if (!mentorDetectedLanguageBadge) return;
    if (!langCode) {
      mentorDetectedLanguageBadge.classList.add('hidden');
      mentorDetectedLanguageBadge.textContent = '';
      return;
    }
    mentorDetectedLanguageBadge.textContent = `Detected: ${VOICE_LANG_LABELS[langCode] || langCode}`;
    mentorDetectedLanguageBadge.classList.remove('hidden');
  }

  function setMentorVoiceStatus(text) {
    if (mentorVoiceStatus) mentorVoiceStatus.textContent = text;
  }

  function setMentorMicVisualState(isListening) {
    mentorListening = isListening;
    if (!mentorVoiceMicBtn) return;
    mentorVoiceMicBtn.classList.toggle('text-error', isListening);
    mentorVoiceMicBtn.title = isListening ? 'Stop voice input' : 'Start voice input';
  }

  async function ensureMicPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('This browser does not support microphone access.');
    }
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }

  async function transcribeMentorAudio(audioBlob, languageCode) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'mentor-recording.webm');
    formData.append('language', languageCode);

    const response = await fetch(`${API_BASE_URL}/speech-to-text`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(parseApiError(data, 'Speech transcription failed.'));
    }
    return data;
  }

  async function startMentorVoiceInput() {
    if (!mentorVoiceMicBtn || !mentorInput || !mentorVoiceLangSelect) return;

    if (mentorMediaRecorder && mentorMediaRecorder.state === 'recording') {
      setMentorVoiceStatus('Stopping...');
      mentorMediaRecorder.stop();
      return;
    }

    try {
      mentorAudioStream = await ensureMicPermission();
      mentorAudioChunks = [];
      setMentorMicVisualState(true);
      updateMentorLanguageBadge(null);

      const selectedLanguage = mentorVoiceLangSelect.value || 'en-IN';
      setMentorVoiceStatus(`Recording (${VOICE_LANG_LABELS[selectedLanguage] || selectedLanguage})... click mic again to stop`);

      mentorMediaRecorder = new MediaRecorder(mentorAudioStream);
      mentorMediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          mentorAudioChunks.push(event.data);
        }
      };

      mentorMediaRecorder.onstop = async () => {
        setMentorMicVisualState(false);
        setMentorVoiceStatus('Transcribing audio...');

        const audioBlob = new Blob(mentorAudioChunks, { type: mentorMediaRecorder?.mimeType || 'audio/webm' });
        mentorAudioChunks = [];

        try {
          const data = await transcribeMentorAudio(audioBlob, selectedLanguage);
          if (data.text) {
            const baseText = mentorInput.value.trim();
            mentorInput.value = [baseText, data.text].filter(Boolean).join(baseText && data.text ? '\n' : '');
            const detectedLang = detectLanguageFromText(data.text) || selectedLanguage;
            updateMentorLanguageBadge(detectedLang);
            setMentorVoiceStatus('Voice captured');
          } else {
            setMentorVoiceStatus('No speech detected, try again');
          }
        } catch (error) {
          setMentorVoiceStatus(error?.message || 'Speech transcription failed.');
        } finally {
          mentorAudioStream?.getTracks().forEach((track) => track.stop());
          mentorAudioStream = null;
          mentorMediaRecorder = null;
          mentorInput.focus();
        }
      };

      mentorMediaRecorder.start();
    } catch (_) {
      setMentorVoiceStatus('Mic permission blocked. Please allow microphone access.');
      setMentorMicVisualState(false);
    }
  }

  function handleUnauthorized(detail) {
    addMentorMessage('assistant', 'Your session expired. Please sign in again to keep using AI Mentor.');
    if (window.VeloraSession?.logout) {
      setTimeout(() => {
        window.VeloraSession.logout();
      }, 1200);
    }
    throw new Error(detail || 'Session expired.');
  }

  function buildMentorPayloadMessage(message) {
    const title = titleEl?.textContent?.trim() || 'Practice Problem';
    const code = codeEl?.textContent?.trim() || 'Unknown';
    const statement = statementEl?.textContent?.trim() || 'Problem statement unavailable.';
    const editorCode = codeEditor?.value?.trim() || '';
    const stdin = getConsoleInput();
    const testCases = Array.from(testCasesEl?.querySelectorAll('div') || [])
      .map((node) => node.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 3);

    const parts = [
      `Problem: ${title}`,
      `Problem Code: ${code}`,
      `Statement: ${statement}`,
    ];

    if (testCases.length) {
      parts.push(`Sample Tests: ${testCases.join(' | ')}`);
    }

    if (editorCode) {
      parts.push(`Current Code:\n${editorCode}`);
    }

    if (stdin) {
      parts.push(`Custom Input:\n${stdin}`);
    }

    parts.push(`Student Question: ${message}`);
    return parts.join('\n');
  }

  function scrollMentorToBottom() {
    if (!mentorMessages) return;
    mentorMessages.scrollTop = mentorMessages.scrollHeight;
  }

  function formatTimeLabel() {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function createMessageElement(role, content, timeLabel = formatTimeLabel()) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col gap-2';

    const bubble = document.createElement('div');
    bubble.className =
      role === 'user'
        ? 'self-end max-w-[95%] bg-primary text-white p-3 rounded-2xl rounded-tr-none text-[11px] leading-relaxed whitespace-pre-wrap'
        : 'self-start max-w-[95%] bg-surface-container-highest p-3 rounded-2xl rounded-tl-none text-[11px] leading-relaxed text-on-surface-variant whitespace-pre-wrap';
    bubble.textContent = content;

    const meta = document.createElement('span');
    meta.className = role === 'user' ? 'text-[8px] text-outline mr-1 uppercase font-bold self-end' : 'text-[8px] text-outline ml-1 uppercase font-bold';
    meta.textContent = timeLabel;

    wrapper.appendChild(bubble);
    wrapper.appendChild(meta);
    return wrapper;
  }

  function addMentorMessage(role, content, timeLabel) {
    if (!mentorMessages) return null;
    const node = createMessageElement(role, content, timeLabel);
    mentorMessages.appendChild(node);
    scrollMentorToBottom();
    return node;
  }

  function setMentorPending(isPending) {
    if (mentorSendBtn) mentorSendBtn.disabled = isPending;
    if (mentorInput) mentorInput.disabled = isPending;
    mentorSuggestions.forEach((button) => {
      button.disabled = isPending;
    });
  }

  async function ensureChatSession() {
    if (chatSessionId) return chatSessionId;
    if (chatSessionPromise) return chatSessionPromise;

    const token = getAuthToken();
    if (!token) {
      throw new Error('Please sign in again to use AI Mentor.');
    }

    chatSessionPromise = fetch(`${API_BASE_URL}/chat/session/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          handleUnauthorized(parseApiError(data, 'Invalid or expired access token'));
        }
        if (!response.ok) {
          const detail = parseApiError(data, 'Failed to start chat session.');
          throw new Error(detail);
        }
        chatSessionId = data.session_id;
        return chatSessionId;
      })
      .finally(() => {
        chatSessionPromise = null;
      });

    return chatSessionPromise;
  }

  async function sendMentorMessage(prefilledMessage) {
    const message = (prefilledMessage ?? mentorInput?.value ?? '').trim();
    if (!message) return;

    const token = getAuthToken();
    if (!token) {
      addMentorMessage('assistant', 'Please sign in again to use AI Mentor.');
      return;
    }

    setMentorPending(true);
    addMentorMessage('user', message);
    if (mentorInput) mentorInput.value = '';
    const thinkingNode = addMentorMessage('assistant', 'AI Mentor is thinking...');

    try {
      const sessionId = await ensureChatSession();
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: buildMentorPayloadMessage(message),
          language: getPreferredLanguage(),
          session_id: sessionId,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        handleUnauthorized(parseApiError(data, 'Invalid or expired access token'));
      }
      if (!response.ok) {
        const detail = parseApiError(data, 'AI Mentor request failed.');
        throw new Error(detail);
      }

      if (thinkingNode) {
        thinkingNode.remove();
      }
      addMentorMessage('assistant', data.reply || 'I could not generate a response just now.');
    } catch (error) {
      if (thinkingNode) {
        thinkingNode.remove();
      }
      const errorMessage = error?.message || String(error);
      if (!/session expired|invalid or expired access token/i.test(errorMessage)) {
        addMentorMessage('assistant', `I hit a problem while contacting the mentor API: ${errorMessage}`);
      }
    } finally {
      setMentorPending(false);
      mentorInput?.focus();
    }
  }

  async function runCode() {
    if (!codeEditor) return;
    const code = codeEditor.value.trim();
    if (!code) {
      setOutput('Editor is empty. Write code first.', true);
      return;
    }

    if (runBtn) runBtn.disabled = true;
    setOutput('Running code...');

    try {
      const data = await executeCodeWithInput(getConsoleInput());

      const stdout = typeof data.output === 'string' ? data.output : '';
      const stderr = typeof data.error === 'string' ? data.error : '';
      const fullText = [stdout, stderr].filter(Boolean).join('\n');
      setOutput(fullText || '(No output)', Boolean(stderr));
    } catch (error) {
      setOutput(`Could not run code: ${error?.message || error}`, true);
    } finally {
      if (runBtn) runBtn.disabled = false;
    }
  }

  async function executeCodeWithInput(stdin) {
    const response = await fetch(`${API_BASE_URL}/run-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: codeEditor?.value || '',
        language_id: 71,
        stdin: stdin ?? '',
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      throw new Error(detail || 'Run request failed.');
    }
    return data;
  }

  function redirectToNextQuestion() {
    const nextQuestion = getQuestionNoFromUrl() + 1;
    window.location.href = `editorq.html?question_no=${encodeURIComponent(nextQuestion)}`;
  }

  async function findNextQuestionByDifficulty(targetDifficulty) {
    const startQuestionNo = getQuestionNoFromUrl();
    const wanted = normalizeDifficulty(targetDifficulty);
    const maxLookAhead = 120;

    for (let step = 1; step <= maxLookAhead; step += 1) {
      const questionNo = startQuestionNo + step;
      try {
        const response = await fetch(`${API_BASE_URL}/practice-problems/${questionNo}`);
        if (!response.ok) continue;
        const data = await response.json().catch(() => ({}));
        if (normalizeDifficulty(data?.difficulty) === wanted) {
          return questionNo;
        }
      } catch (_) {
        // Try next available question number.
      }
    }
    return null;
  }

  async function redirectToDifficultyQuestion(targetDifficulty) {
    const questionNo = await findNextQuestionByDifficulty(targetDifficulty);
    if (questionNo) {
      window.location.href = `editorq.html?question_no=${encodeURIComponent(questionNo)}`;
      return;
    }
    redirectToNextQuestion();
  }

  async function findBestLessonByKeywords(keywords) {
    const safeKeywords = (Array.isArray(keywords) ? keywords : [])
      .map((k) => String(k || '').trim().toLowerCase())
      .filter(Boolean);

    if (!safeKeywords.length) return null;

    const listResponse = await fetch(`${API_BASE_URL}/courses/${encodeURIComponent(PRACTICE_COURSE_SLUG)}/lessons`);
    if (!listResponse.ok) return null;

    const listData = await listResponse.json().catch(() => ({}));
    const lessons = Array.isArray(listData?.lessons) ? listData.lessons : [];
    if (!lessons.length) return null;

    let bestOrder = null;
    let bestScore = 0;

    for (const lesson of lessons) {
      const order = Number(lesson?.order);
      if (!Number.isFinite(order) || order <= 0) continue;

      const detailResponse = await fetch(
        `${API_BASE_URL}/courses/${encodeURIComponent(PRACTICE_COURSE_SLUG)}/lessons/${encodeURIComponent(order)}`
      );
      if (!detailResponse.ok) continue;

      const detail = await detailResponse.json().catch(() => ({}));
      const haystack = `${lesson?.title || ''}\n${detail?.content || ''}`.toLowerCase();
      const score = safeKeywords.reduce((total, keyword) => (haystack.includes(keyword) ? total + 1 : total), 0);

      if (score > bestScore) {
        bestScore = score;
        bestOrder = order;
      }
    }

    return bestScore > 0 ? bestOrder : null;
  }

  async function redirectToKeywordLesson(problem) {
    const linkedOrders = Array.isArray(problem?.linked_lesson_orders) ? problem.linked_lesson_orders : [];
    const firstLinked = Number(linkedOrders.find((value) => Number.isFinite(Number(value)) && Number(value) > 0));
    if (Number.isFinite(firstLinked) && firstLinked > 0) {
      window.location.href = `EDITOR.html?course=${encodeURIComponent(PRACTICE_COURSE_SLUG)}&lesson=${encodeURIComponent(firstLinked)}`;
      return;
    }

    const keywordOrder = await findBestLessonByKeywords(problem?.common_keywords || []);
    if (keywordOrder) {
      window.location.href = `EDITOR.html?course=${encodeURIComponent(PRACTICE_COURSE_SLUG)}&lesson=${encodeURIComponent(keywordOrder)}`;
      return;
    }

    window.location.href = `course.html?course=${encodeURIComponent(PRACTICE_COURSE_SLUG)}`;
  }

  async function submitCode() {
    if (!codeEditor) return;

    const code = codeEditor.value.trim();
    if (!code) {
      setOutput('Editor is empty. Write code first.', true);
      return;
    }

    const testCases = Array.isArray(currentProblem?.test_cases) ? currentProblem.test_cases : [];
    if (!testCases.length) {
      setOutput('No test cases available for this question.', true);
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    setOutput('Submitting solution...');

    try {
      let failedCase = null;

      for (let idx = 0; idx < testCases.length; idx += 1) {
        const testCase = testCases[idx] || {};
        const primaryInput = String(testCase.input ?? '');
        let result = await executeCodeWithInput(primaryInput);

        if (result?.error && shouldRetryWithSplitInput(result.error, primaryInput)) {
          const retryInput = primaryInput.trim().split(/\s+/).join('\n');
          result = await executeCodeWithInput(retryInput);
        }

        if (result?.error) {
          failedCase = {
            caseNumber: idx + 1,
            actual: String(result.error),
            expected: String(testCase.output ?? ''),
            isRuntimeError: true,
          };
          break;
        }

        const actual = normalizeOutput(result?.output);
        const expected = normalizeOutput(testCase.output);
        if (actual !== expected) {
          failedCase = {
            caseNumber: idx + 1,
            actual,
            expected,
            isRuntimeError: false,
          };
          break;
        }
      }

      if (!failedCase) {
        incorrectAttempts = 0;
        if (normalizeDifficulty(currentProblem?.difficulty) === 'easy') {
          easyCorrectCount = Number.isFinite(easyCorrectCount) ? easyCorrectCount + 1 : 1;
          localStorage.setItem(EASY_PROGRESS_KEY, String(easyCorrectCount));
          if (easyCorrectCount >= EASY_PROGRESS_TARGET) {
            easyCorrectCount = 0;
            localStorage.setItem(EASY_PROGRESS_KEY, '0');
            setOutput('Correct output. You solved 3 Easy questions. Choose your next level.');
            showLevelChoiceModal();
            return;
          }
        }
        setOutput('Correct output. Great job!');
        showSuccessModal();
        return;
      }

      incorrectAttempts += 1;
      const baseMessage = failedCase.isRuntimeError
        ? `Try again. Runtime error on case ${failedCase.caseNumber}: ${failedCase.actual}`
        : `Try again. Wrong output on case ${failedCase.caseNumber}. Expected "${failedCase.expected}" but got "${failedCase.actual}".`;

      if (incorrectAttempts < 3) {
        setOutput(`${baseMessage} Attempt ${incorrectAttempts}/3.`, true);
        return;
      }

      setOutput('Incorrect output. You have reached 3 attempts.', true);
      showFailModal();
    } catch (error) {
      setOutput(`Could not submit code: ${error?.message || error}`, true);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function setDifficultyBadge(difficulty) {
    if (!difficultyEl) return;
    const value = (difficulty || 'Easy').trim();
    difficultyEl.textContent = value;

    difficultyEl.classList.remove(
      'bg-secondary-container/20',
      'text-secondary',
      'bg-tertiary-container/20',
      'text-tertiary',
      'bg-error-container/20',
      'text-error'
    );

    if (value.toLowerCase() === 'medium') {
      difficultyEl.classList.add('bg-tertiary-container/20', 'text-tertiary');
    } else if (value.toLowerCase() === 'difficult' || value.toLowerCase() === 'hard') {
      difficultyEl.classList.add('bg-error-container/20', 'text-error');
    } else {
      difficultyEl.classList.add('bg-secondary-container/20', 'text-secondary');
    }
  }

  function renderTestCases(testCases) {
    if (!testCasesEl) return;
    testCasesEl.innerHTML = '';

    const list = Array.isArray(testCases) ? testCases : [];
    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'text-xs text-outline';
      empty.textContent = 'No test cases available.';
      testCasesEl.appendChild(empty);
      return;
    }

    list.forEach((tc, idx) => {
      const box = document.createElement('div');
      box.className = 'bg-surface-container-lowest p-3 rounded-xl font-mono text-xs border-l-4 border-primary';

      const title = document.createElement('p');
      title.className = 'text-outline uppercase tracking-wider text-[10px] mb-1';
      title.textContent = `Case ${idx + 1}`;

      const input = document.createElement('p');
      input.innerHTML = `<span class="text-outline">Input:</span> ${tc?.input ?? ''}`;
      const output = document.createElement('p');
      output.innerHTML = `<span class="text-outline">Output:</span> ${tc?.output ?? ''}`;

      box.appendChild(title);
      box.appendChild(input);
      box.appendChild(output);
      testCasesEl.appendChild(box);
    });
  }

  function renderKeywords(keywords, linkedLessons) {
    if (!keywordsEl) return;
    keywordsEl.innerHTML = '';

    const keys = Array.isArray(keywords) ? keywords : [];
    const lessons = Array.isArray(linkedLessons) ? linkedLessons : [];

    keys.forEach((kw) => {
      const chip = document.createElement('span');
      chip.className = 'px-2 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary';
      chip.textContent = kw;
      keywordsEl.appendChild(chip);
    });

    lessons.forEach((lessonOrder) => {
      const chip = document.createElement('span');
      chip.className = 'px-2 py-1 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary';
      chip.textContent = `Lesson ${lessonOrder}`;
      keywordsEl.appendChild(chip);
    });

    if (!keys.length && !lessons.length) {
      const empty = document.createElement('span');
      empty.className = 'text-xs text-outline';
      empty.textContent = 'No keywords available.';
      keywordsEl.appendChild(empty);
    }
  }

  function renderProblem(problem) {
    currentProblem = problem || null;
    incorrectAttempts = 0;
    if (titleEl) titleEl.textContent = problem?.title || 'Practice Problem';
    if (codeEl) codeEl.textContent = problem?.problem_code || '';
    if (statementEl) statementEl.textContent = problem?.problem_statement || 'Problem statement not available.';
    setDifficultyBadge(problem?.difficulty || 'Easy');
    renderTestCases(problem?.test_cases || []);
    renderKeywords(problem?.common_keywords || [], problem?.linked_lesson_orders || []);
  }

  async function loadProblem() {
    const questionNo = getQuestionNoFromUrl();
    try {
      const response = await fetch(`${API_BASE_URL}/practice-problems/${questionNo}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data?.detail === 'string' ? data.detail : 'Failed to load practice problem.');
      }
      renderProblem(data);
    } catch (error) {
      renderProblem({
        title: 'Problem Load Error',
        problem_code: `Q${String(questionNo).padStart(3, '0')}`,
        difficulty: 'Easy',
        problem_statement: `Could not load problem from database: ${error?.message || error}`,
        test_cases: [],
        common_keywords: [],
        linked_lesson_orders: [],
      });
    }
  }

  if (codeEditor) {
    codeEditor.addEventListener('input', updateLineNumbers);
    codeEditor.addEventListener('scroll', () => {
      if (lineNumbers) lineNumbers.scrollTop = codeEditor.scrollTop;
    });
    codeEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        codeEditor.value = `${codeEditor.value.substring(0, start)}    ${codeEditor.value.substring(end)}`;
        codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
        updateLineNumbers();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
    });
  }

  runBtn?.addEventListener('click', runCode);
  submitBtn?.addEventListener('click', submitCode);
  mentorSendBtn?.addEventListener('click', () => {
    sendMentorMessage();
  });
  mentorInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMentorMessage();
    }
  });
  mentorSuggestions.forEach((button) => {
    button.addEventListener('click', () => {
      sendMentorMessage(button.dataset.chatSuggestion || button.textContent || '');
    });
  });

  if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
    setMentorVoiceStatus('Voice input not supported. Use latest Chrome/Edge.');
    if (mentorVoiceMicBtn) mentorVoiceMicBtn.disabled = true;
  } else {
    const isSecureContextAvailable =
      window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isSecureContextAvailable) {
      setMentorVoiceStatus('Voice needs secure context. Open via http://localhost.');
    }
    mentorVoiceMicBtn?.addEventListener('click', startMentorVoiceInput);
  }

  updateLineNumbers();
  initLinkedConsoleResize();
  initQuestionPanelResize();
  initMentorPanelResize();
  loadProblem();
})();
