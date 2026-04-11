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
  const codeEditor = document.getElementById('codeEditor');
  const codeInput = document.getElementById('codeInput');
  const lineNumbers = document.getElementById('lineNumbers');
  const codeOutput = document.getElementById('codeOutput');
  const mentorMessages = document.getElementById('mentorMessages');
  const mentorInput = document.getElementById('mentorInput');
  const mentorSendBtn = document.getElementById('mentorSendBtn');
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

  let chatSessionId = null;
  let chatSessionPromise = null;
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
      const response = await fetch(`${API_BASE_URL}/run-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language_id: 71,
          stdin: getConsoleInput(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        throw new Error(detail || 'Run request failed.');
      }

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
  loadProblem();
})();
