(() => {
  const places = {
    "snowy-peaks": ["Snowy Peaks", "Senderismo · Meditación", "Una ruta tranquila entre altas cumbres: un lugar para caminar, disfrutar del paisaje y encontrar un momento de calma."],
    cliffside: ["The Cliffside", "Longboarding · Meditación", "Un rincón costero para encontrar el equilibrio, sentir la brisa y hacer una pausa consciente."],
    "whispering-forest": ["The Whispering Forest", "Senderismo · Meditación", "Un sendero entre árboles que invita a caminar sin prisa, observar cada paso y disfrutar del silencio."],
    "endless-plains": ["The Endless Plains", "Running · Meditación", "Un horizonte abierto para encontrar tu ritmo, respirar profundamente y disfrutar del recorrido."],
    "hidden-coast": ["The Hidden Coast", "Gaming · Meditación", "Una costa tranquila: un punto de encuentro entre los viajes imaginarios y un momento de quietud."],
    "cinder-mountains": ["The Cinder Mountains", "Senderismo · Gaming", "Un paisaje escarpado para tomar el camino alto e imaginar historias durante el recorrido."],
    "calm-lake": ["The Calm Lake", "Gaming · Meditación", "Un lugar para hacer una pausa, recuperar la calma y dejar que una buena historia avance."],
    "sunken-ruins": ["The Sunken Ruins", "Gaming · Longboarding", "Senderos de aspecto antiguo que invitan a explorar y moverse con curiosidad."],
    "southern-islands": ["The Southern Islands", "Longboarding · Running", "Caminos insulares para moverse con libertad y explorar cada tramo a tu propio ritmo."]
  };

  const markers = [...document.querySelectorAll(".atlas-marker")];
  const placesList = [...document.querySelectorAll(".atlas-list [data-place]")];
  const atlasName = document.getElementById("atlas-name");
  const atlasActivities = document.getElementById("atlas-activities");
  const atlasDescription = document.getElementById("atlas-description");
  const atlasChapter = document.getElementById("atlas-chapter");

  function selectPlace(place) {
    const details = places[place];
    if (!details) return;

    markers.forEach(marker => {
      const selected = marker.dataset.place === place;
      marker.classList.toggle("is-selected", selected);
      marker.setAttribute("aria-pressed", String(selected));
    });
    placesList.forEach(item => {
      const selected = item.dataset.place === place;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-current", selected ? "true" : "false");
    });
    atlasName.textContent = details[0];
    atlasActivities.textContent = details[1];
    atlasDescription.textContent = details[2];
    atlasChapter.textContent = `FIELD NOTE · ${String(Object.keys(places).indexOf(place) + 1).padStart(2, "0")}`;
  }

  markers.forEach(marker => marker.addEventListener("click", () => selectPlace(marker.dataset.place)));
  placesList.forEach(item => item.addEventListener("click", () => {
    selectPlace(item.dataset.place);
    document.querySelector(`.atlas-marker[data-place="${item.dataset.place}"]`)?.focus({ preventScroll: true });
  }));
  if (markers.length && atlasName && atlasActivities && atlasDescription && atlasChapter) selectPlace("snowy-peaks");

  const hobbyGrid = document.getElementById("hobby-grid");
  const searchInput = document.getElementById("hobby-search");
  const filters = [...document.querySelectorAll("[data-hobby-filter]")];
  const favoriteButtons = [...document.querySelectorAll("[data-favorite]")];
  const favoritesFilter = document.getElementById("favorites-filter");
  const favoritesLabel = favoritesFilter?.querySelector("span");
  const results = document.getElementById("hobby-results");
  const empty = document.getElementById("hobby-empty");
  const status = document.getElementById("hobby-status");
  const favoriteKey = "fieldJournalHobbyFavorites";
  const favorites = new Set();
  let activeCategory = "all";
  let favoritesOnly = false;
  let storageAvailable = true;

  if (hobbyGrid && searchInput && results && empty && status) {
    try {
      const saved = JSON.parse(localStorage.getItem(favoriteKey) || "[]");
      if (Array.isArray(saved)) saved.filter(value => favoriteButtons.some(button => button.dataset.favorite === value)).forEach(value => favorites.add(value));
    } catch (error) {
      storageAvailable = false;
      status.textContent = "No se pudieron leer tus favoritas guardadas en este navegador.";
    }

    function renderHobbies() {
      const query = searchInput.value.trim().toLocaleLowerCase();
      const cards = [...hobbyGrid.querySelectorAll(".hobby-card")];
      let visibleCount = 0;

      cards.forEach(card => {
        const categoryMatches = activeCategory === "all" || card.dataset.hobby === activeCategory;
        const searchMatches = `${card.dataset.search} ${card.textContent}`.toLocaleLowerCase().includes(query);
        const favoriteMatches = !favoritesOnly || favorites.has(card.dataset.hobby);
        const visible = categoryMatches && searchMatches && favoriteMatches;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      results.textContent = `${visibleCount} ${visibleCount === 1 ? "afición encontrada" : "aficiones encontradas"}`;
      empty.hidden = visibleCount > 0;
    }

    favoriteButtons.forEach(button => {
      const hobby = button.dataset.favorite;
      const hobbyName = button.closest(".hobby-card").querySelector("h3").textContent;
      const label = button.querySelector("span:last-child");
      const icon = button.querySelector("[aria-hidden='true']");

      function updateButton() {
        const saved = favorites.has(hobby);
        button.setAttribute("aria-pressed", String(saved));
        button.setAttribute("aria-label", `${saved ? "Quitar" : "Guardar"} ${hobbyName} ${saved ? "de" : "en"} favoritas`);
        label.textContent = saved ? "En tus favoritas" : "Guardar en favoritas";
        icon.textContent = saved ? "★" : "☆";
      }

      updateButton();
      button.addEventListener("click", () => {
        if (favorites.has(hobby)) favorites.delete(hobby);
        else favorites.add(hobby);

        if (storageAvailable) {
          try {
            localStorage.setItem(favoriteKey, JSON.stringify([...favorites]));
            status.textContent = "Favoritas guardadas en este dispositivo.";
          } catch (error) {
            storageAvailable = false;
            status.textContent = "No se pudieron guardar las favoritas en este navegador.";
          }
        }

        updateButton();
        renderHobbies();
      });
    });

    filters.forEach(button => button.addEventListener("click", () => {
      activeCategory = button.dataset.hobbyFilter;
      filters.forEach(filter => filter.setAttribute("aria-pressed", String(filter === button)));
      renderHobbies();
    }));

    searchInput.addEventListener("input", renderHobbies);
    favoritesFilter?.addEventListener("click", () => {
      favoritesOnly = !favoritesOnly;
      favoritesFilter.setAttribute("aria-pressed", String(favoritesOnly));
      favoritesLabel.textContent = favoritesOnly ? "Ver toda la colección" : "Ver favoritas";
      renderHobbies();
    });

    renderHobbies();
  }
})();
