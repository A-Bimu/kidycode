document.documentElement.classList.add("js");

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -36px 0px" },
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const header = document.querySelector(".site-header");

if (header) {
  const updateHeader = () => {
    header.style.boxShadow = window.scrollY > 24 ? "0 10px 32px rgba(17, 25, 54, .08)" : "none";
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}
