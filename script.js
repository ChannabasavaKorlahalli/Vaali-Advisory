// Back to Top button appears only after cursor activity.
document.addEventListener("DOMContentLoaded", () => {
  const backToTopBtn = document.getElementById("backToTop");
  if (!backToTopBtn) return;

  const minScrollY = 120;
  const idleDelayMs = 1200;
  let idleTimerId = null;
  let pointerUpdatePending = false;

  const updateVisibility = (isActivePointer = false) => {
    const canBeVisible = window.scrollY > minScrollY;
    backToTopBtn.classList.toggle("is-visible", canBeVisible);
    backToTopBtn.classList.toggle("is-awake", canBeVisible && isActivePointer);
  };

  const onPointerMove = () => {
    if (!pointerUpdatePending) {
      pointerUpdatePending = true;
      window.requestAnimationFrame(() => {
        updateVisibility(true);
        pointerUpdatePending = false;
      });
    }

    if (idleTimerId !== null) {
      window.clearTimeout(idleTimerId);
    }

    idleTimerId = window.setTimeout(() => {
      updateVisibility(false);
    }, idleDelayMs);
  };

  updateVisibility(false);
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  window.addEventListener("scroll", () => updateVisibility(false), { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
});
const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");

const getDefaultTheme = () => "dark";

const getActiveTheme = () => root.dataset.theme || getDefaultTheme();

const syncThemeToggle = (theme) => {
  if (!themeToggle) {
    return;
  }

  const nextTheme = theme === "light" ? "dark" : "light";
  const themeLabel = themeToggle.querySelector("[data-theme-label]");

  themeToggle.dataset.themeMode = theme;
  themeToggle.setAttribute("aria-pressed", String(theme === "light"));
  themeToggle.setAttribute("aria-label", `Activate ${nextTheme} theme`);

  if (themeLabel) {
    themeLabel.textContent = theme === "light" ? "Light" : "Dark";
  }
};

const applyTheme = (theme, persist = true) => {
  root.dataset.theme = theme;

  if (persist) {
    try {
      localStorage.setItem("vaaliTheme", theme);
    } catch (error) {
      // Ignore storage failures and keep the in-memory theme.
    }
  }

  syncThemeToggle(theme);
};

applyTheme(getActiveTheme(), false);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = getActiveTheme() === "light" ? "dark" : "light";
    applyTheme(nextTheme);
  });
}

const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const revealNodes = document.querySelectorAll(".fade-up");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("in-view"));
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const workflowControllers = new Map();

const setWorkflowState = (workflow, activeIndex) => {
  const steps = Array.from(workflow.querySelectorAll("[data-workflow-step]"));
  if (!steps.length) {
    return;
  }

  steps.forEach((step, index) => {
    step.classList.toggle("is-complete", index < activeIndex);
    step.classList.toggle("is-current", index === activeIndex);
  });

  const progress = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 100;
  workflow.style.setProperty("--workflow-progress", `${progress}%`);
};

document.querySelectorAll("[data-workflow]").forEach((workflow) => {
  const steps = Array.from(workflow.querySelectorAll("[data-workflow-step]"));
  if (!steps.length) {
    return;
  }

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    setWorkflowState(workflow, steps.length - 1);
    return;
  }

  const intervalMs = Number(workflow.dataset.workflowInterval || 1600);
  let activeIndex = 0;
  let timerId = null;

  const tick = () => {
    setWorkflowState(workflow, activeIndex);
    activeIndex = (activeIndex + 1) % steps.length;
  };

  workflowControllers.set(workflow, {
    start() {
      if (timerId !== null) {
        return;
      }

      tick();
      timerId = window.setInterval(tick, intervalMs);
    },
    stop() {
      if (timerId === null) {
        return;
      }

      window.clearInterval(timerId);
      timerId = null;
    }
  });
});

if (workflowControllers.size && "IntersectionObserver" in window && !prefersReducedMotion) {
  const workflowObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const controller = workflowControllers.get(entry.target);
        if (!controller) {
          return;
        }

        if (entry.isIntersecting) {
          controller.start();
        } else {
          controller.stop();
        }
      });
    },
    { threshold: 0.35 }
  );

  workflowControllers.forEach((_, workflow) => workflowObserver.observe(workflow));
}

