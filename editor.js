// ===== editor.js (FINAL CLEAN VERSION) =====

document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // SELECT ELEMENTS
  // =========================
  const buttons = document.querySelectorAll("button");

  const runBtn = [...buttons].find(btn => btn.textContent.includes("Run Code"));
  const sendBtn = [...buttons].find(btn => btn.innerText.includes("send"));
  const micBtn = [...buttons].find(btn => btn.innerText.includes("mic"));
  const chatInput = document.querySelector("input");
  const chatArea = document.querySelector(".flex-1.overflow-y-auto.p-6.space-y-6");
  const codeArea = document.querySelector(".code-font .flex-1");

  // =========================
  // ADD CLEAR BUTTON
  // =========================
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear Code";
  clearBtn.style.cssText = `
    padding:6px 12px;
    background:#ff4d4d;
    color:white;
    border:none;
    border-radius:6px;
    font-size:12px;
    cursor:pointer;
  `;

  // Add beside Run Code
  if (runBtn) {
    runBtn.parentElement.appendChild(clearBtn);
  }

  // =========================
  // CLEAR CODE FUNCTION
  // =========================
  clearBtn.addEventListener("click", () => {
    if (codeArea) {
      codeArea.innerText = "";
      showToast("🧹 Code Cleared");
    }
  });

  // =========================
  // RUN CODE (FAKE OUTPUT)
  // =========================
  runBtn?.addEventListener("click", () => {
    showToast("⚙️ Running code...");
    setTimeout(() => {
      showToast("✅ Output Ready!");
    }, 1200);
  });

  // =========================
  // CHAT SYSTEM
  // =========================
  function addMessage(text, type = "user") {
    const div = document.createElement("div");

    if (type === "user") {
      div.className = "flex flex-col items-end gap-2";
      div.innerHTML = `
        <div class="bg-surface-container-high px-4 py-3 rounded-2xl">
          <p class="text-sm">${text}</p>
        </div>`;
    } else {
      div.className = "flex items-start gap-3";
      div.innerHTML = `
        <div>🤖</div>
        <div class="bg-surface-container-high px-4 py-3 rounded-2xl">
          <p class="text-sm">${text}</p>
        </div>`;
    }

    chatArea?.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  const AI = [
    "Try using loop.",
    "Check edge cases.",
    "Use recursion.",
    "Optimize with hashmap."
  ];

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    chatInput.value = "";

    setTimeout(() => {
      addMessage(AI[Math.floor(Math.random() * AI.length)], "ai");
    }, 600);
  }

  sendBtn?.addEventListener("click", sendMessage);
  chatInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  // =========================
  // VOICE INPUT (WORKING)
  // =========================
  function startVoice() {
    if (!("webkitSpeechRecognition" in window)) {
      showToast("❌ Voice not supported");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.start();

    showToast("🎙️ Listening...");

    recognition.onresult = (e) => {
      chatInput.value = e.results[0][0].transcript;
      showToast("✅ Voice input added");
    };
  }

  micBtn?.addEventListener("click", startVoice);

  // =========================
  // SIMPLE TOAST
  // =========================
  function showToast(msg) {
    const toast = document.createElement("div");
    toast.innerText = msg;

    toast.style.cssText = `
      position:fixed;
      top:80px;
      right:20px;
      background:#222;
      color:white;
      padding:10px 15px;
      border-radius:6px;
      z-index:9999;
      font-size:13px;
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

});