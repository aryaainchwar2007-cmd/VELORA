(function () {
  const AUTH_STORE_KEY = "velora_auth";
  const LEGACY_NAME_KEYS = ["Luminescent Scholar", "Arjun Mehta"];
  const ROUTES = {
    dashboard: "dashboard.html",
    practice: "practice.html",
    projects: "project.html",
    profile: "profile.html",
    editor: "EDITOR.html",
    welcome: "welcome.html",
  };

  function readAuth() {
    const raw = localStorage.getItem(AUTH_STORE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function getUser() {
    return readAuth()?.user ?? null;
  }

  function getToken() {
    return readAuth()?.token?.access_token ?? null;
  }

  function replaceLegacyNames(fullName) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      const parent = node.parentElement;
      if (!parent) return;
      const tag = parent.tagName.toLowerCase();
      if (tag === "script" || tag === "style") return;

      let value = node.nodeValue || "";
      LEGACY_NAME_KEYS.forEach((legacy) => {
        if (value.includes(legacy)) {
          value = value.replaceAll(legacy, fullName);
        }
      });
      node.nodeValue = value;
    });
  }

  function applyUserName() {
    const user = getUser();
    if (!user) return;
    const fullName = user.full_name || user.name;
    if (!fullName) return;

    document.querySelectorAll("[data-user-name]").forEach((el) => {
      el.textContent = fullName;
    });

    replaceLegacyNames(fullName);
  }

  function logout() {
    localStorage.removeItem(AUTH_STORE_KEY);
    window.location.href = "welcome.html";
  }

  function go(routeKey) {
    const target = ROUTES[routeKey];
    if (target) {
      window.location.href = target;
    }
  }

  function routeFromText(text) {
    const t = (text || "").toLowerCase();
    if (t.includes("dashboard") || t.includes("home")) return "dashboard";
    if (t.includes("practice")) return "practice";
    if (t.includes("project")) return "projects";
    if (t.includes("profile")) return "profile";
    if (t.includes("editor")) return "editor";
    if (t.includes("continue lesson")) return "editor";
    if (t.includes("voice help")) return "editor";
    if (t.includes("join room")) return "practice";
    if (t.includes("explore repos")) return "projects";
    if (t.includes("solve now")) return "editor";
    if (t.includes("initialize project")) return "editor";
    if (t.includes("start building")) return "editor";
    if (t.includes("new project")) return "editor";
    if (t.includes("settings")) return "profile";
    if (t.includes("support")) return "welcome";
    return null;
  }

  function wireNavigation() {
    const clickable = document.querySelectorAll("a, button, [role='button'], .cursor-pointer");
    clickable.forEach((el) => {
      if (el.tagName === "BUTTON" && (el.getAttribute("type") || "").toLowerCase() === "submit") {
        return;
      }

      const href = el.getAttribute("href");
      const explicit = el.getAttribute("data-route");
      const text = (el.textContent || "").trim();
      const iconText = el.querySelector(".material-symbols-outlined")?.textContent || "";
      const combined = (text + " " + iconText).trim();
      const routeKey = explicit || routeFromText(combined);

      const shouldHandle = Boolean(routeKey) || href === "#" || href === "";
      if (!shouldHandle) return;

      el.addEventListener("click", function (event) {
        if (routeKey) {
          event.preventDefault();
          go(routeKey);
        } else if (href === "#" || href === "") {
          event.preventDefault();
        }
      });
    });
  }

  window.VeloraSession = {
    getUser,
    getToken,
    applyUserName,
    logout,
    wireNavigation,
  };

  document.addEventListener("DOMContentLoaded", function () {
    applyUserName();
    wireNavigation();
  });
})();
