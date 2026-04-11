// ============================================================
// velora.js — Indigo Academy Dashboard Interactivity
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ── 1. SEARCH BAR ──────────────────────────────────────────
  const searchInput = document.querySelector("input[placeholder='Search curriculum...']");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) showToast(`🔍 Searching for "${query}"...`, "primary");
        searchInput.blur();
      }
    });
  }

  // ── 2. NOTIFICATION BELL ──────────────────────────────────
  const notifIcon = document.querySelector('[data-icon="notifications"]');
  if (notifIcon) {
    notifIcon.addEventListener("click", () => {
      showToast("🔔 You have 3 new notifications!", "primary");
    });
  }

  // ── 3. PREMIUM / WORKSPACE ICON ───────────────────────────
  const premiumIcon = document.querySelector('[data-icon="workspace_premium"]');
  if (premiumIcon) {
    premiumIcon.addEventListener("click", () => {
      showToast("⭐ Upgrade to Indigo Pro for unlimited access!", "tertiary");
    });
  }

  // ── 4. PROFILE HEADER ─────────────────────────────────────
  const profileArea = document.querySelector("header .flex.items-center.gap-2.pl-4");
  if (profileArea) {
    profileArea.style.cursor = "pointer";
    profileArea.addEventListener("click", () => {
      showToast("👤 Opening your profile...", "secondary");
    });
  }

  // ── 5. SIDEBAR NAV LINKS ──────────────────────────────────
  const navLinks = document.querySelectorAll("nav a");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      // Remove active style from all
      navLinks.forEach((l) => {
        l.classList.remove(
          "bg-gradient-to-r", "from-[#4F46E5]/20", "to-transparent",
          "text-[#c3c0ff]", "border-l-4", "border-[#4F46E5]", "translate-x-1"
        );
        l.classList.add("text-slate-500");
      });
      // Apply active style to clicked
      link.classList.add(
        "bg-gradient-to-r", "from-[#4F46E5]/20", "to-transparent",
        "text-[#c3c0ff]", "border-l-4", "border-[#4F46E5]", "translate-x-1"
      );
      link.classList.remove("text-slate-500");

      const label = link.querySelector("span:last-child")?.textContent?.trim();
      if (label) showToast(`📂 Navigating to ${label}`, "primary");
    });
  });

  // ── 6. VOICE HELP BUTTON ──────────────────────────────────
  const voiceBtn = document.querySelector("button[class*='Voice Help'], nav button");
  if (voiceBtn) {
    voiceBtn.addEventListener("click", () => {
      showToast("🎤 Voice Help activated! Say a command...", "primary");
    });
  }

  // ── 7. SETTINGS & SUPPORT LINKS ───────────────────────────
  const settingsLink = document.querySelector('[data-icon="settings"]')?.closest("a");
  const supportLink = document.querySelector('[data-icon="help"]')?.closest("a");
  if (settingsLink) {
    settingsLink.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("⚙️ Opening Settings...", "primary");
    });
  }
  if (supportLink) {
    supportLink.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("🆘 Opening Support Center...", "secondary");
    });
  }

  // ── 8. CONTINUE LESSON BUTTON ─────────────────────────────
  const continueBtn = document.querySelector("button.indigo-gradient");
  if (continueBtn && continueBtn.textContent.trim() === "Continue Lesson") {
    continueBtn.addEventListener("click", () => {
      showToast("📘 Resuming Data Structures — Chapter 4!", "primary");
    });
  }

  // ── 9. PRACTICE ARENA — JOIN ROOM ─────────────────────────
  const joinRoomBtn = document.querySelector("button.text-secondary");
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener("click", () => {
      showToast("⚔️ Joining today's Algorithm Challenge room...", "secondary");
    });
  }

  // ── 10. PROJECT HUB — EXPLORE REPOS ──────────────────────
  const exploreBtn = document.querySelector("button.text-tertiary");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      showToast("🗂️ Opening Project Hub repositories...", "tertiary");
    });
  }

  // ── 11. PROGRESS HUB — MORE ICON ─────────────────────────
  const moreIcon = document.querySelector('[data-icon="more_horiz"]');
  if (moreIcon) {
    moreIcon.addEventListener("click", () => {
      showToast("📊 Full progress report coming soon!", "primary");
    });
  }

  // ── 12. AI RECOMMENDATION CARD ───────────────────────────
  const aiCard = document.querySelector(".glass-card");
  if (aiCard) {
    aiCard.style.cursor = "pointer";
    aiCard.addEventListener("click", () => {
      showToast("🤖 Loading: Solve Linked List in Hindi (12 min)...", "primary");
    });
  }

  // ── 13. QUICK STATS — RANK & TIME ─────────────────────────
  const statCards = document.querySelectorAll(".bg-surface-container-low.p-4.rounded-xl");
  statCards.forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const label = card.querySelector("p.text-\\[10px\\]")?.textContent?.trim() || "Stat";
      const value = card.querySelector("p.text-sm")?.textContent?.trim() || "";
      showToast(`📈 ${label}: ${value}`, "secondary");
    });
  });

  // ── 14. FAB ROCKET BUTTON ─────────────────────────────────
  const fab = document.querySelector("button[class*='fixed bottom-8']");
  if (fab) {
    fab.addEventListener("click", () => {
      showToast("🚀 Launching your next challenge!", "primary");
      // Animate the button
      fab.classList.add("scale-125");
      setTimeout(() => fab.classList.remove("scale-125"), 300);
    });
  }

  // ── 15. ACTIVITY FEED ITEMS ───────────────────────────────
  const activityItems = document.querySelectorAll(".space-y-4 .group");
  activityItems.forEach((item) => {
    item.style.cursor = "pointer";
    item.addEventListener("click", () => {
      const text = item.querySelector("p.text-sm")?.textContent?.trim() || "Activity";
      showToast(`🕒 ${text}`, "secondary");
    });
  });

  // ── 16. STREAK / POINTS / BADGES STATS ───────────────────
  const headerStats = document.querySelectorAll("header .flex.items-center.gap-2:not(.gap-8):not(.gap-6):not(.gap-4.pl-4)");
  headerStats.forEach((stat) => {
    stat.style.cursor = "pointer";
    stat.addEventListener("click", () => {
      const label = stat.querySelector("p.text-\\[10px\\]")?.textContent?.trim();
      const value = stat.querySelector("p.text-lg")?.textContent?.trim();
      if (label && value) showToast(`${label}: ${value}`, "tertiary");
    });
  });

  // ── TOAST NOTIFICATION SYSTEM ─────────────────────────────
  function showToast(message, type = "primary") {
    // Remove existing toasts
    document.querySelectorAll(".velora-toast").forEach(t => t.remove());

    const colors = {
      primary: { bg: "#4f46e5", border: "#c3c0ff" },
      secondary: { bg: "#00a572", border: "#4edea3" },
      tertiary: { bg: "#885500", border: "#ffb95f" },
    };
    const { bg, border } = colors[type] || colors.primary;

    const toast = document.createElement("div");
    toast.className = "velora-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: ${bg}ee;
      border: 1px solid ${border}44;
      color: #fff;
      padding: 12px 24px;
      border-radius: 999px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      z-index: 9999;
      backdrop-filter: blur(16px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      max-width: 90vw;
      text-align: center;
      white-space: nowrap;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(-50%) translateY(0)";
      });
    });

    // Auto-dismiss
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

});