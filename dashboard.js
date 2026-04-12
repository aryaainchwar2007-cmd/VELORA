// ============================================================
// velora.js â€” CODE SAGE Dashboard Interactivity
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // â”€â”€ 1. SEARCH BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const searchInput = document.querySelector("input[placeholder='Search curriculum...']");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) showToast(`ðŸ” Searching for "${query}"...`, "primary");
        searchInput.blur();
      }
    });
  }

  // â”€â”€ 2. NOTIFICATION BELL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const notifIcon = document.querySelector('[data-icon="notifications"]');
  if (notifIcon) {
    notifIcon.addEventListener("click", () => {
      showToast("ðŸ”” You have 3 new notifications!", "primary");
    });
  }

  // â”€â”€ 3. PREMIUM / WORKSPACE ICON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const premiumIcon = document.querySelector('[data-icon="workspace_premium"]');
  if (premiumIcon) {
    premiumIcon.addEventListener("click", () => {
      showToast("â­ Upgrade to Indigo Pro for unlimited access!", "tertiary");
    });
  }

  // â”€â”€ 4. PROFILE HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const profileArea = document.querySelector("header .flex.items-center.gap-2.pl-4");
  if (profileArea) {
    profileArea.style.cursor = "pointer";
    profileArea.addEventListener("click", () => {
      showToast("ðŸ‘¤ Opening your profile...", "secondary");
    });
  }

  // â”€â”€ 5. SIDEBAR NAV LINKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      if (label) showToast(`ðŸ“‚ Navigating to ${label}`, "primary");
    });
  });

  // â”€â”€ 6. VOICE HELP BUTTON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const voiceBtn = document.querySelector("button[class*='Voice Help'], nav button");
  if (voiceBtn) {
    voiceBtn.addEventListener("click", () => {
      showToast("ðŸŽ¤ Voice Help activated! Say a command...", "primary");
    });
  }

  // â”€â”€ 7. SETTINGS & SUPPORT LINKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const settingsLink = document.querySelector('[data-icon="settings"]')?.closest("a");
  const supportLink = document.querySelector('[data-icon="help"]')?.closest("a");
  if (settingsLink) {
    settingsLink.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("âš™ï¸ Opening Settings...", "primary");
    });
  }
  if (supportLink) {
    supportLink.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("ðŸ†˜ Opening Support Center...", "secondary");
    });
  }

  // â”€â”€ 8. CONTINUE LESSON BUTTON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const continueBtn = document.querySelector("button.indigo-gradient");
  if (continueBtn && continueBtn.textContent.trim() === "Continue Lesson") {
    continueBtn.addEventListener("click", () => {
      showToast("ðŸ“˜ Resuming Data Structures â€” Chapter 4!", "primary");
    });
  }

  // â”€â”€ 9. PRACTICE ARENA â€” JOIN ROOM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const joinRoomBtn = document.querySelector("button.text-secondary");
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener("click", () => {
      showToast("âš”ï¸ Joining today's Algorithm Challenge room...", "secondary");
    });
  }

  // â”€â”€ 10. PROJECT HUB â€” EXPLORE REPOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const exploreBtn = document.querySelector("button.text-tertiary");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      showToast("ðŸ—‚ï¸ Opening Project Hub repositories...", "tertiary");
    });
  }

  // â”€â”€ 11. PROGRESS HUB â€” MORE ICON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const moreIcon = document.querySelector('[data-icon="more_horiz"]');
  if (moreIcon) {
    moreIcon.addEventListener("click", () => {
      showToast("ðŸ“Š Full progress report coming soon!", "primary");
    });
  }

  // â”€â”€ 12. AI RECOMMENDATION CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const aiCard = document.querySelector(".glass-card");
  if (aiCard) {
    aiCard.style.cursor = "pointer";
    aiCard.addEventListener("click", () => {
      showToast("ðŸ¤– Loading: Solve Linked List in Hindi (12 min)...", "primary");
    });
  }

  // â”€â”€ 13. QUICK STATS â€” RANK & TIME â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const statCards = document.querySelectorAll(".bg-surface-container-low.p-4.rounded-xl");
  statCards.forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const label = card.querySelector("p.text-\\[10px\\]")?.textContent?.trim() || "Stat";
      const value = card.querySelector("p.text-sm")?.textContent?.trim() || "";
      showToast(`ðŸ“ˆ ${label}: ${value}`, "secondary");
    });
  });

  // â”€â”€ 14. FAB ROCKET BUTTON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fab = document.querySelector("button[class*='fixed bottom-8']");
  if (fab) {
    fab.addEventListener("click", () => {
      showToast("ðŸš€ Launching your next challenge!", "primary");
      // Animate the button
      fab.classList.add("scale-125");
      setTimeout(() => fab.classList.remove("scale-125"), 300);
    });
  }

  // â”€â”€ 15. ACTIVITY FEED ITEMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const activityItems = document.querySelectorAll(".space-y-4 .group");
  activityItems.forEach((item) => {
    item.style.cursor = "pointer";
    item.addEventListener("click", () => {
      const text = item.querySelector("p.text-sm")?.textContent?.trim() || "Activity";
      showToast(`ðŸ•’ ${text}`, "secondary");
    });
  });

  // â”€â”€ 16. STREAK / POINTS / BADGES STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const headerStats = document.querySelectorAll("header .flex.items-center.gap-2:not(.gap-8):not(.gap-6):not(.gap-4.pl-4)");
  headerStats.forEach((stat) => {
    stat.style.cursor = "pointer";
    stat.addEventListener("click", () => {
      const label = stat.querySelector("p.text-\\[10px\\]")?.textContent?.trim();
      const value = stat.querySelector("p.text-lg")?.textContent?.trim();
      if (label && value) showToast(`${label}: ${value}`, "tertiary");
    });
  });

  // â”€â”€ TOAST NOTIFICATION SYSTEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
