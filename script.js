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

const form = document.querySelector("[data-contact-form]");
const message = document.querySelector("[data-form-message]");

if (form && message) {
  const storageKey = "vaaliAdvisoryLeads";
  const legacyStorageKey = "ledgerpeakLeads";

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const fields = Object.fromEntries(formData.entries());
    const required = ["name", "email", "company", "service", "message"];

    const missingField = required.find((key) => !String(fields[key] || "").trim());
    if (missingField) {
      message.textContent = "Please complete all required fields before sending.";
      message.className = "form-message error";
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(String(fields.email).trim())) {
      message.textContent = "Please enter a valid work email address.";
      message.className = "form-message error";
      return;
    }

    const existingSubmissions = JSON.parse(
      localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey) || "[]"
    );

    existingSubmissions.push({
      ...fields,
      submittedAt: new Date().toISOString()
    });

    localStorage.setItem(storageKey, JSON.stringify(existingSubmissions));
    localStorage.removeItem(legacyStorageKey);

    form.reset();
    message.textContent =
      "Thanks. We have captured your context and will respond within one business day.";
    message.className = "form-message success";
  });
}
