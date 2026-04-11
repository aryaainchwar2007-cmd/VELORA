document.addEventListener("DOMContentLoaded", () => {

  // -----------------------------
  // COURSE STATE
  // -----------------------------
  let progress = 0;
  const totalModules = 12;

  const progressText = document.querySelector(
    "span:has(.material-symbols-outlined[style*='FILL'])"
  );

  const progressBar = document.querySelector(
    ".bg-tertiary.h-full"
  );

  const startButtons = document.querySelectorAll("button");

  // -----------------------------
  // START LESSON BUTTON
  // -----------------------------
  startButtons.forEach(btn => {
    if (btn.innerText.includes("Start Lesson")) {
      btn.addEventListener("click", () => {
        progress++;

        if (progress > totalModules) progress = totalModules;

        updateProgress();
        unlockNextModule();

        btn.innerText = "Completed";
        btn.disabled = true;
        btn.classList.add("opacity-60");
      });
    }
  });

  // -----------------------------
  // UPDATE PROGRESS UI
  // -----------------------------
  function updateProgress() {
    const percent = Math.floor((progress / totalModules) * 100);

    // Update text
    const progressLabel = document.querySelectorAll("span")
    progressLabel.forEach(el => {
      if (el.textContent.includes("Course Progress")) {
        el.innerHTML = `
          <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">stars</span>
          Course Progress: ${percent}%
        `;
      }
    });

    // Update progress bar (achievement card)
    if (progressBar) {
      progressBar.style.width = percent + "%";
    }
  }

  // -----------------------------
  // UNLOCK NEXT MODULE
  // -----------------------------
  function unlockNextModule() {
    const lockedModules = document.querySelectorAll(".opacity-70");

    if (lockedModules.length > 0) {
      const next = lockedModules[0];

      next.classList.remove("opacity-70", "grayscale-[0.5]");

      const lockBadge = next.querySelector("span");
      if (lockBadge && lockBadge.innerText.includes("Locked")) {
        lockBadge.innerHTML = `
          <span class="material-symbols-outlined text-[14px]">bolt</span> Ready
        `;
        lockBadge.classList.remove("bg-surface-container-highest", "text-slate-400");
        lockBadge.classList.add("bg-secondary-container/20", "text-secondary");
      }
    }
  }

  // -----------------------------
  // NAVIGATION ACTIVE STATE
  // -----------------------------
  const navLinks = document.querySelectorAll("nav a");

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navLinks.forEach(l => l.classList.remove("text-white"));
      link.classList.add("text-white");
    });
  });

  // -----------------------------
  // VOICE HELP BUTTON
  // -----------------------------
  const voiceBtn = document.querySelector("button span.material-symbols-outlined.mic");

  const voiceHelpBtn = Array.from(document.querySelectorAll("button"))
    .find(btn => btn.innerText.includes("Voice Help"));

  if (voiceHelpBtn) {
    voiceHelpBtn.addEventListener("click", () => {
      alert("🎤 Voice assistant coming soon!");
    });
  }

  // -----------------------------
  // PROFILE CLICK
  // -----------------------------
  const profile = document.querySelector("img");

  if (profile) {
    profile.addEventListener("click", () => {
      alert("Opening profile...");
    });
  }

});