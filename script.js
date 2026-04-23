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

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".fade-up").forEach((node) => observer.observe(node));

const form = document.querySelector("[data-contact-form]");
const message = document.querySelector("[data-form-message]");

if (form && message) {
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

    const submissions = JSON.parse(localStorage.getItem("ledgerpeakLeads") || "[]");
    submissions.push({
      ...fields,
      submittedAt: new Date().toISOString()
    });
    localStorage.setItem("ledgerpeakLeads", JSON.stringify(submissions));

    form.reset();
    message.textContent =
      "Thanks. Your inquiry has been captured and the team will follow up within one business day.";
    message.className = "form-message success";
  });
}
