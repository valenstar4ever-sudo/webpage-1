/* Interacciones del portfolio: navegación, mapa y animaciones accesibles. */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Menú móvil accesible
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Abrir menú" : "Cerrar menú");
      navLinks.classList.toggle("open", !isOpen);
    });

    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Abrir menú");
        navLinks.classList.remove("open");
      });
    });
  }

  // Mapa: sincroniza los pines y la lista, con soporte de teclado.
  const markers = [...document.querySelectorAll(".map-marker")];
  const items = [...document.querySelectorAll(".interest-item")];

  function selectLocation(location) {
    markers.forEach(marker => {
      const selected = marker.dataset.location === location;
      marker.classList.toggle("active", selected);
      marker.setAttribute("aria-pressed", String(selected));
    });
    items.forEach(item => {
      const selected = item.dataset.location === location;
      item.classList.toggle("active", selected);
      if (selected) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    });
  }

  markers.forEach(marker => {
    marker.addEventListener("click", () => selectLocation(marker.dataset.location));
  });
  items.forEach(item => {
    item.addEventListener("click", () => {
      selectLocation(item.dataset.location);
      const matchingMarker = markers.find(marker => marker.dataset.location === item.dataset.location);
      if (matchingMarker) matchingMarker.focus({ preventScroll: true });
    });
  });
  selectLocation("gaming");

  // Revelado progresivo al entrar en pantalla (Intersection Observer).
  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealElements.forEach(element => observer.observe(element));
  } else {
    revealElements.forEach(element => element.classList.add("is-visible"));
  }

  // Año automático en el pie de página.
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
