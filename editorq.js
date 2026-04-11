(function () {
  const API_BASE_URL = 'http://127.0.0.1:8000';

  const runBtn = document.getElementById('runCodeBtn');
  const codeEditor = document.getElementById('codeEditor');
  const codeInput = document.getElementById('codeInput');
  const lineNumbers = document.getElementById('lineNumbers');
  const codeOutput = document.getElementById('codeOutput');

  const difficultyEl = document.getElementById('questionDifficulty');
  const titleEl = document.getElementById('questionTitle');
  const codeEl = document.getElementById('questionCode');
  const statementEl = document.getElementById('questionStatement');
  const testCasesEl = document.getElementById('questionTestCases');
  const keywordsEl = document.getElementById('questionKeywords');

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
          stdin: codeInput?.value || '',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        throw new Error(detail || 'Run request failed.');
      }

      if (data.error) {
        setOutput(data.error, true);
      } else if (typeof data.output === 'string' && data.output.length) {
        setOutput(data.output);
      } else {
        setOutput('(No output)');
      }
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
  updateLineNumbers();
  loadProblem();
})();
