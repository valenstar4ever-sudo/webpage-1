(() => {
  const places = [
    {
      id: "MY VILLAGE",
      name: "THE DOWN RIVER",
      region: "WEST OF MOROCCO",
      type: "forest",
      label: "FOREST",
      duration: "A slow afternoon",
      description: "Wander beneath a canopy of golden gingko leaves, where warm light filters through the trees and the island falls quiet.",
      x: 45,
      y: 35
    },
    {
      id: "golden-summit",
      name: "LOVE OF KHABIZA",
      region: "Ariake · Izuhara",
      type: "shrine",
      label: "SHRINE",
      duration: "A steady climb",
      description: "Follow the winding mountain path to a hillside shrine. The climb is part of the pilgrimage, with forest and sea opening up below.",
      x: 35,
      y: 27
    },
    {
      id: "spring-falls",
      name: "Spring Falls",
      region: "Kashine · Izuhara",
      type: "waterfall",
      label: "WATER",
      duration: "An easy detour",
      description: "A tucked-away cascade and a cool green hollow make this a lovely place to pause along the road through Izuhara.",
      x: 29,
      y: 43
    },
    {
      id: "cloud-ridge",
      name: "Cloud Ridge Shrine",
      region: "Otsuna · Toyotama",
      type: "shrine",
      label: "SHRINE",
      duration: "A cliffside climb",
      description: "Climb a narrow trail above the waves to a cliffside shrine. Keep your eyes on the coast as the clouds roll over the ridge.",
      x: 61,
      y: 48
    },
    {
      id: "umugi-cove",
      name: "Umugi Cove",
      region: "Umugi · Toyotama",
      type: "coast",
      label: "COAST",
      duration: "An easy shoreline walk",
      description: "Step away from the village and follow the water's edge for calm sea views, weathered rocks, and a change of pace.",
      x: 56,
      y: 60
    },
    {
      id: "NOMAD CULTURE",
      name: "White-Dyed Forest",
      region: "Kin · Kamiagata",
      type: "forest",
      label: "FOREST",
      duration: "A quiet forest walk",
      description: "Walk among pale, snow-brushed trees in the north. A still, wintry stretch of woodland that feels a world away.",
      x: 51,
      y: 77
    }
  ];

  const markerContainer = document.querySelector("#map-markers");
  const placeList = document.querySelector("#place-list");
  const placeCount = document.querySelector("#place-count");
  const selectedName = document.querySelector("#selected-name");
  const selectedDescription = document.querySelector("#selected-description");
  const selectedRegion = document.querySelector("#selected-region");
  const selectedTime = document.querySelector("#selected-time");
  const filterButtons = [...document.querySelectorAll(".filter-button")];
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector("#nav-links");
  let activeFilter = "all";
  let selectedId = places[0].id;

  function visiblePlaces() {
    return places.filter(place => activeFilter === "all" || place.type === activeFilter);
  }

  function selectPlace(id) {
    const place = places.find(candidate => candidate.id === id);
    if (!place) return;
    selectedId = place.id;
    selectedName.textContent = place.name;
    selectedDescription.textContent = place.description;
    selectedRegion.textContent = place.region;
    selectedTime.textContent = place.duration;

    document.querySelectorAll("[data-location]").forEach(button => {
      const selected = button.dataset.location === selectedId;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function renderPlaces() {
    const shown = visiblePlaces();
    placeCount.textContent = `${shown.length} ${shown.length === 1 ? "place" : "places"}`;
    placeList.replaceChildren();
    markerContainer.replaceChildren();

    shown.forEach((place, index) => {
      const marker = document.createElement("button");
      marker.className = "map-pin";
      marker.type = "button";
      marker.dataset.location = place.id;
      marker.style.left = `${place.x}%`;
      marker.style.top = `${place.y}%`;
      marker.setAttribute("aria-label", `${place.name}, marker ${index + 1}`);
      const markerNumber = document.createElement("span");
      markerNumber.textContent = String(index + 1).padStart(2, "0");
      marker.append(markerNumber);
      markerContainer.append(marker);

      const item = document.createElement("button");
      item.className = "place-option";
      item.type = "button";
      item.dataset.location = place.id;

      const number = document.createElement("span");
      number.className = "place-number";
      number.textContent = String(index + 1).padStart(2, "0");

      const copy = document.createElement("span");
      copy.className = "place-option-copy";
      const title = document.createElement("strong");
      title.textContent = place.name;
      const subtitle = document.createElement("small");
      subtitle.textContent = `${place.region} · ${place.label}`;
      copy.append(title, subtitle);

      const arrow = document.createElement("span");
      arrow.className = "place-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      item.append(number, copy, arrow);
      placeList.append(item);
    });

    if (shown.length === 0) {
      const message = document.createElement("p");
      message.className = "empty-state";
      message.textContent = "No places match this landscape.";
      placeList.append(message);
    }
    selectPlace(shown.some(place => place.id === selectedId) ? selectedId : shown[0]?.id);
  }

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      filterButtons.forEach(filter => {
        const active = filter === button;
        filter.classList.toggle("active", active);
        filter.setAttribute("aria-pressed", String(active));
      });
      renderPlaces();
    });
  });

  markerContainer.addEventListener("click", event => {
    const marker = event.target.closest("[data-location]");
    if (marker) selectPlace(marker.dataset.location);
  });
  placeList.addEventListener("click", event => {
    const item = event.target.closest("[data-location]");
    if (item) selectPlace(item.dataset.location);
  });

  document.querySelectorAll("[data-select-location]").forEach(link => {
    link.addEventListener("click", () => {
      const place = places.find(candidate => candidate.id === link.dataset.selectLocation);
      if (!place) return;
      const filter = filterButtons.find(button => button.dataset.filter === "all");
      activeFilter = "all";
      filterButtons.forEach(button => {
        const active = button === filter;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      renderPlaces();
      selectPlace(place.id);
    });
  });

  if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
      navLinks.classList.toggle("open", !isOpen);
    });

    navLinks.addEventListener("click", event => {
      if (!event.target.closest("a")) return;
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
      navLinks.classList.remove("open");
    });
  }

  renderPlaces();
})();
