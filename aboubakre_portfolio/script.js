/* Interacciones del portfolio: navegación, mapa y animaciones accesibles. */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const weatherCurrent = document.getElementById("weather-current");
  const weatherForecast = document.getElementById("weather-forecast");
  const weatherStatus = document.getElementById("weather-status");
  const weatherLocation = document.getElementById("weather-location");
  const weatherTemperature = document.getElementById("weather-temperature");
  const weatherSummary = document.getElementById("weather-summary");
  const weatherSymbol = document.getElementById("weather-symbol");
  const weatherFeelsLike = document.getElementById("weather-feels-like");
  const weatherWind = document.getElementById("weather-wind");
  const weatherHumidity = document.getElementById("weather-humidity");
  const weatherRefresh = document.getElementById("weather-refresh-button");
  const weatherLocate = document.getElementById("weather-location-button");
  const weatherReportNumber = document.getElementById("weather-report-number");
  let weatherCoordinates = { latitude: 39.4699, longitude: -0.3763 };
  let weatherPlaceName = "Valencia, España";
  let weatherRequestController;
  let hasWeatherData = false;

  const weatherDescriptions = {
    0: ["Despejado", "☀"],
    1: ["Mayormente despejado", "◐"],
    2: ["Parcialmente nublado", "◑"],
    3: ["Nublado", "☁"],
    45: ["Niebla", "≋"],
    48: ["Niebla helada", "≋"],
    51: ["Llovizna ligera", "☂"],
    53: ["Llovizna moderada", "☂"],
    55: ["Llovizna intensa", "☂"],
    56: ["Llovizna helada ligera", "❄"],
    57: ["Llovizna helada intensa", "❄"],
    61: ["Lluvia ligera", "☂"],
    63: ["Lluvia moderada", "☂"],
    65: ["Lluvia intensa", "☂"],
    66: ["Lluvia helada ligera", "❄"],
    67: ["Lluvia helada intensa", "❄"],
    71: ["Nieve ligera", "❄"],
    73: ["Nieve moderada", "❄"],
    75: ["Nieve intensa", "❄"],
    77: ["Granos de nieve", "❄"],
    80: ["Chubascos ligeros", "☂"],
    81: ["Chubascos moderados", "☂"],
    82: ["Chubascos intensos", "☂"],
    85: ["Chubascos de nieve ligeros", "❄"],
    86: ["Chubascos de nieve intensos", "❄"],
    95: ["Tormenta", "⚡"],
    96: ["Tormenta con granizo ligero", "⚡"],
    98: ["Tormenta intensa", "⚡"],
    99: ["Tormenta con granizo intenso", "⚡"]
  };

  function getWeatherDescription(code) {
    return weatherDescriptions[code] || ["Condiciones variables", "◌"];
  }

  if (weatherCurrent && weatherForecast && weatherStatus && weatherRefresh && weatherLocate) {
    const formatTemperature = value => `${Math.round(value)}°`;

    function renderWeather(data) {
      const current = data.current;
      const description = getWeatherDescription(current.weather_code);
      weatherTemperature.textContent = Math.round(current.temperature_2m);
      weatherSummary.textContent = description[0];
      weatherSymbol.textContent = description[1];
      weatherFeelsLike.textContent = formatTemperature(current.apparent_temperature);
      weatherWind.textContent = `${Math.round(current.wind_speed_10m)} ${data.current_units.wind_speed_10m}`;
      weatherHumidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
      weatherLocation.textContent = `${weatherPlaceName} · Actualizado ${new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: data.timezone
      }).format(new Date(current.time))}`;

      const dayFormatter = new Intl.DateTimeFormat("es-ES", {
        weekday: "short",
        timeZone: data.timezone
      });
      weatherForecast.replaceChildren();

      data.daily.time.slice(1, 4).forEach((date, index) => {
        const code = data.daily.weather_code[index + 1];
        const forecastDescription = getWeatherDescription(code);
        const day = document.createElement("div");
        day.className = "weather-day";
        day.setAttribute("role", "listitem");

        const name = document.createElement("span");
        name.className = "weather-day-name";
        name.textContent = dayFormatter.format(new Date(`${date}T12:00:00`)).replace(".", "");

        const icon = document.createElement("span");
        icon.className = "weather-day-symbol";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = forecastDescription[1];

        const temperatures = document.createElement("span");
        temperatures.className = "weather-day-temperatures";
        temperatures.textContent = `${Math.round(data.daily.temperature_2m_max[index + 1])}° / ${Math.round(data.daily.temperature_2m_min[index + 1])}°`;

        const accessibleDescription = document.createElement("span");
        accessibleDescription.className = "visually-hidden";
        accessibleDescription.textContent = forecastDescription[0];

        day.append(name, icon, temperatures, accessibleDescription);
        weatherForecast.append(day);
      });

      weatherCurrent.setAttribute("aria-busy", "false");
      weatherStatus.textContent = "";
      hasWeatherData = true;
      weatherRefresh.disabled = false;
      weatherLocate.disabled = false;
      weatherReportNumber.textContent = String(new Date().getDate()).padStart(2, "0");
    }

    async function loadWeather() {
      weatherRequestController?.abort();
      weatherRequestController = new AbortController();
      const requestController = weatherRequestController;
      const timeout = window.setTimeout(() => requestController.abort(), 12000);
      const params = new URLSearchParams({
        latitude: weatherCoordinates.latitude,
        longitude: weatherCoordinates.longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        timezone: "auto",
        forecast_days: "4"
      });

      weatherCurrent.setAttribute("aria-busy", "true");
      weatherStatus.textContent = "Consultando el pronóstico…";
      weatherRefresh.disabled = true;
      weatherLocate.disabled = true;

      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
          signal: requestController.signal,
          headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error(`Forecast service returned ${response.status}`);
        const data = await response.json();

        if (
          !data.current ||
          !data.daily ||
          !Array.isArray(data.daily.time) ||
          data.daily.time.length < 4 ||
          !Array.isArray(data.daily.weather_code) ||
          !Array.isArray(data.daily.temperature_2m_max) ||
          !Array.isArray(data.daily.temperature_2m_min) ||
          data.daily.weather_code.length < 4 ||
          data.daily.temperature_2m_max.length < 4 ||
          data.daily.temperature_2m_min.length < 4 ||
          !Number.isFinite(data.current.temperature_2m) ||
          !Number.isFinite(data.current.apparent_temperature) ||
          !Number.isFinite(data.current.wind_speed_10m) ||
          !Number.isFinite(data.current.relative_humidity_2m) ||
          !Number.isFinite(data.current.weather_code) ||
          data.daily.weather_code.slice(0, 4).some(value => !Number.isFinite(value)) ||
          data.daily.temperature_2m_max.slice(0, 4).some(value => !Number.isFinite(value)) ||
          data.daily.temperature_2m_min.slice(0, 4).some(value => !Number.isFinite(value))
        ) {
          throw new Error("Forecast service returned incomplete data");
        }

        renderWeather(data);
      } catch (error) {
        if (error.name === "AbortError" && requestController !== weatherRequestController) return;
        weatherCurrent.setAttribute("aria-busy", "false");
        if (!hasWeatherData) {
          weatherSummary.textContent = "Pronóstico no disponible";
          weatherForecast.textContent = "No hay datos del pronóstico en este momento.";
        }
        weatherStatus.textContent = error.name === "AbortError"
          ? "El pronóstico está tardando demasiado. Comprueba tu conexión e inténtalo de nuevo."
          : "No se pudo cargar el tiempo. Comprueba tu conexión e inténtalo de nuevo.";
        weatherRefresh.disabled = false;
        weatherLocate.disabled = false;
        console.error("Weather request failed.", error);
      } finally {
        window.clearTimeout(timeout);
      }
    }

    weatherRefresh.addEventListener("click", loadWeather);
    weatherLocate.addEventListener("click", () => {
      if (!navigator.geolocation) {
        weatherStatus.textContent = "Tu navegador no permite consultar la ubicación. Se mantiene el pronóstico de Valencia.";
        return;
      }

      weatherLocate.disabled = true;
      weatherStatus.textContent = "Solicitando tu ubicación…";
      navigator.geolocation.getCurrentPosition(
        position => {
          weatherCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          weatherPlaceName = "Tu ubicación";
          loadWeather();
        },
        error => {
          weatherLocate.disabled = false;
          if (error.code === error.PERMISSION_DENIED) {
            weatherStatus.textContent = "No se concedió el permiso de ubicación. Se mantiene Valencia; puedes cambiarlo en los ajustes del navegador.";
          } else if (error.code === error.TIMEOUT) {
            weatherStatus.textContent = "No se pudo obtener la ubicación a tiempo. Prueba de nuevo o consulta Valencia.";
          } else {
            weatherStatus.textContent = "No se pudo obtener la ubicación. Se mantiene el pronóstico de Valencia.";
          }
        },
        { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 }
      );
    });

    loadWeather();
  }

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

  // Mapa: sincroniza los destinos y muestra su foto cuando está disponible.
  const markers = [...document.querySelectorAll(".map-marker")];
  const items = [...document.querySelectorAll(".interest-item")];

  function positionHobbyPopup(marker, popup) {
    const map = marker.closest(".hobby-map");
    if (!map) return;
    if (!window.matchMedia("(max-width: 620px)").matches) {
      popup.style.left = "";
      popup.style.top = "";
      popup.style.bottom = "";
      popup.style.transform = "";
      return;
    }

    const mapBounds = map.getBoundingClientRect();
    const markerBounds = marker.getBoundingClientRect();
    popup.style.left = `${mapBounds.width / 2 - (markerBounds.left - mapBounds.left)}px`;
    popup.style.top = `${mapBounds.height / 2 - (markerBounds.top - mapBounds.top)}px`;
    popup.style.bottom = "auto";
    popup.style.transform = "translate(-50%, -50%)";
  }

  function selectLocation(location, toggle = false) {
    const selectedLocation = toggle && markers.find(marker => marker.dataset.location === location)?.classList.contains("active")
      ? null
      : location;

    markers.forEach(marker => {
      const selected = marker.dataset.location === selectedLocation;
      marker.classList.toggle("active", selected);
      marker.setAttribute("aria-pressed", String(selected));
      marker.setAttribute("aria-expanded", String(selected));
      const popup = marker.querySelector(".map-popup");
      if (popup) {
        popup.hidden = !selected;
        if (selected) positionHobbyPopup(marker, popup);
        else {
          popup.style.left = "";
          popup.style.top = "";
          popup.style.bottom = "";
          popup.style.transform = "";
        }
      }

      if (selected) {
        const photo = marker.querySelector(".place-photo");
        const placeholder = marker.querySelector(".photo-placeholder");
        if (photo && !photo.getAttribute("src")) {
          photo.addEventListener("load", () => {
            photo.hidden = false;
            if (placeholder) placeholder.hidden = true;
          }, { once: true });
          photo.addEventListener("error", () => {
            photo.hidden = true;
            if (placeholder) placeholder.hidden = false;
          }, { once: true });
          photo.src = photo.dataset.src;
        }
      }
    });
    items.forEach(item => {
      const selected = item.dataset.location === selectedLocation;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
  }

  markers.forEach(marker => {
    marker.addEventListener("click", () => selectLocation(marker.dataset.location, true));
  });
  items.forEach(item => {
    item.addEventListener("click", () => {
      selectLocation(item.dataset.location);
      const matchingMarker = markers.find(marker => marker.dataset.location === item.dataset.location);
      if (matchingMarker) matchingMarker.focus({ preventScroll: true });
    });
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") selectLocation(null);
  });
  window.addEventListener("resize", () => {
    const activeMarker = markers.find(marker => marker.classList.contains("active"));
    const popup = activeMarker?.querySelector(".map-popup");
    if (activeMarker && popup) positionHobbyPopup(activeMarker, popup);
  });
  selectLocation(null);

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

  const chatToggle = document.querySelector(".chat-toggle");
  const chatPanel = document.getElementById("chat-panel");
  const chatClose = document.querySelector(".chat-close");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  const chatStatus = document.getElementById("chat-status");
  const questQuestions = document.getElementById("quest-questions");
  const questTabs = [...document.querySelectorAll("[data-quest-category]")];
  const conversation = [];

  const questGuides = {
    hiking: {
      questions: [
        {
          question: "¿Qué rutas puedo explorar cerca de Valencia?",
          answer: "Para empezar a explorar, puedes investigar los senderos señalizados de la Sierra Calderona, la ruta de los puentes colgantes de Chulilla o los paseos naturales del entorno de l'Albufera. Son paisajes distintos: montaña, cañón y humedal. Comprueba el recorrido, permisos, acceso y avisos oficiales antes de salir; las condiciones pueden cambiar."
        },
        {
          question: "¿Qué debería llevar a una caminata?",
          answer: "Lleva agua suficiente, calzado ya probado, protección solar, algo de comida, el móvil cargado y una capa ligera. Descarga el mapa antes de salir, consulta la previsión y avisa a alguien de tu ruta. Ajusta el equipo a la distancia, el terreno y el tiempo."
        },
        {
          question: "¿Cómo elijo una ruta para principiantes?",
          answer: "Empieza con una ruta señalizada, corta y con poco desnivel; revisa distancia, duración estimada, sombra y terreno, no solo las fotos. Ve acompañado si puedes, mantén tu propio ritmo y date la vuelta si el tiempo o el camino no acompañan. Verifica cierres y recomendaciones en fuentes oficiales."
        }
      ]
    },
    gaming: {
      questions: [
        {
          question: "¿Cuál es el juego favorito de Aboubakre?",
          answer: "Su juego favorito es Ghost of Tsushima. Le atraen los videojuegos y la tecnología, una pasión que también está detrás de sus más de ocho años de experiencia en una tienda de videojuegos."
        },
        {
          question: "¿Qué aprendió trabajando en una tienda de videojuegos?",
          answer: "Acumuló más de ocho años de experiencia en el sector, atendiendo y ayudando a clientes. También desarrolló práctica resolviendo problemas de software y reparando dispositivos, consolas y mandos."
        },
        {
          question: "¿Cómo puedo empezar a aprender desarrollo de videojuegos?",
          answer: "Empieza por los fundamentos de programación y crea proyectos pequeños: por ejemplo, un juego de preguntas o un minijuego 2D. Elige una herramienta para principiantes, divide el trabajo en tareas y termina una versión sencilla antes de añadir funciones. En DAM, Aboubakre está empezando ese camino de aprendizaje."
        }
      ]
    },
    camping: {
      questions: [
        {
          question: "¿Qué necesito para mi primera noche de camping?",
          answer: "Prepara tienda adecuada al tiempo, saco y esterilla, agua, comida, frontal, ropa por capas, botiquín básico y batería externa. Comprueba cómo llegar, la previsión y las normas del lugar. En Valencia y sus espacios naturales, acampa solo donde esté expresamente permitido y respeta las restricciones de fuego."
        },
        {
          question: "¿Cómo encuentro un lugar legal para acampar en Valencia?",
          answer: "Consulta áreas y campings autorizados en fuentes oficiales de la Generalitat Valenciana o del ayuntamiento correspondiente. No des por hecho que se permite acampar en una playa, parque natural o junto a un sendero: las reglas y restricciones varían según el lugar y la fecha. Confirma los permisos antes de organizar el viaje."
        },
        {
          question: "¿Cómo acampo sin dejar rastro?",
          answer: "Usa zonas habilitadas, llévate toda la basura, evita dañar plantas y no alimentes a los animales. Mantén el ruido bajo, usa las instalaciones disponibles y respeta las normas de fuego; cuando haya riesgo o prohibición, no enciendas ninguno. Deja el lugar como te gustaría encontrarlo."
        }
      ]
    },
    spanish: {
      questions: [
        {
          question: "¿Cómo puedo practicar español cada día?",
          answer: "Prueba una rutina breve: escucha unos minutos de español, aprende tres expresiones útiles y escribe cinco frases sobre tu día. Después, léelas en voz alta o conversa con alguien. La constancia diaria suele ayudar más que estudiar muchas horas de vez en cuando."
        },
        {
          question: "Enséñame una frase útil para una excursión.",
          answer: "Puedes decir: «¿Hay agua potable cerca?» Significa “Is there drinking water nearby?”. Otra frase práctica es «¿Este sendero está abierto?» — “Is this trail open?”"
        },
        {
          question: "¿Puedes corregir mi español sin desanimarme?",
          answer: "¡Claro! Escribe una frase en español y te propondré una versión corregida, explicaré brevemente el cambio y añadiré una forma natural de decirlo. Equivocarse forma parte de aprender."
        }
      ]
    }
  };

  function addChatMessage(text, role) {
    const message = document.createElement("p");
    message.className = `chat-message chat-message-${role}`;
    message.textContent = text;
    chatMessages.append(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return message;
  }

  if (chatToggle && chatPanel && chatClose && chatForm && chatInput && chatMessages && chatStatus && questQuestions && questTabs.length) {
    addChatMessage("¡Hola, explorador! Elige una misión o escribe tu propia pregunta.", "assistant");

    function showQuestCategory(category) {
      const guide = questGuides[category];
      if (!guide) return;

      questTabs.forEach(tab => {
        const selected = tab.dataset.questCategory === category;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      questQuestions.setAttribute("aria-labelledby", `tab-${category}`);
      questQuestions.replaceChildren();

      guide.questions.forEach(({ question, answer }, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quest-question";
        button.style.setProperty("--quest-index", index);
        button.textContent = question;
        button.addEventListener("click", () => {
          addChatMessage(question, "user");
          addChatMessage(answer, "assistant");
        });
        questQuestions.append(button);
      });
    }

    questTabs.forEach((tab, index) => {
      tab.addEventListener("click", () => showQuestCategory(tab.dataset.questCategory));
      tab.addEventListener("keydown", event => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextTab = questTabs[(index + direction + questTabs.length) % questTabs.length];
        nextTab.focus();
        showQuestCategory(nextTab.dataset.questCategory);
      });
    });
    showQuestCategory("hiking");

    function setChatOpen(open) {
      chatPanel.hidden = !open;
      chatToggle.setAttribute("aria-expanded", String(open));
      if (open) {
        chatPanel.classList.remove("is-open");
        requestAnimationFrame(() => chatPanel.classList.add("is-open"));
        chatInput.focus();
      } else {
        chatPanel.classList.remove("is-open");
        chatToggle.focus();
      }
    }

    chatToggle.addEventListener("click", () => setChatOpen(chatPanel.hidden));
    chatClose.addEventListener("click", () => setChatOpen(false));
    chatPanel.addEventListener("keydown", event => {
      if (event.key === "Escape") setChatOpen(false);
    });

    chatForm.addEventListener("submit", async event => {
      event.preventDefault();
      const text = chatInput.value.trim();
      if (!text || text.length > 1000) return;

      addChatMessage(text, "user");
      conversation.push({ role: "user", content: text });
      chatInput.value = "";
      chatInput.disabled = true;
      chatForm.querySelector("button").disabled = true;
      chatStatus.textContent = "Preparando respuesta…";

      try {
        const response = await fetch("/.netlify/functions/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: conversation.slice(-10) })
        });
        const result = await response.json();
        if (!response.ok || typeof result.reply !== "string") {
          throw new Error(result.error || "No se pudo obtener una respuesta.");
        }
        conversation.push({ role: "assistant", content: result.reply });
        addChatMessage(result.reply, "assistant");
        chatStatus.textContent = "";
      } catch (error) {
        console.error("Chat request failed.", error);
        addChatMessage("No he podido responder ahora. Inténtalo de nuevo más tarde.", "assistant");
        chatStatus.textContent = "No se pudo conectar con el asistente.";
      } finally {
        chatInput.disabled = false;
        chatForm.querySelector("button").disabled = false;
        chatInput.focus();
      }
    });
  }

  const routeStops = [...document.querySelectorAll(".route-stop")];
  const stopTitle = document.getElementById("stop-title");
  const stopChapter = document.getElementById("stop-chapter");
  const stopDescription = document.getElementById("stop-description");
  const stopLandscape = document.getElementById("stop-landscape");
  const stopMapLink = document.getElementById("stop-map-link");
  const stopCount = document.getElementById("stop-count");
  const routeDetails = {
    tangier: {
      title: "Tánger",
      chapter: "PARADA 02 / MARRUECOS",
      description: "Una puerta entre dos continentes, con el encuentro del Atlántico y el Mediterráneo. Tómate tiempo para descubrir su costa y su vida urbana.",
      landscape: "PAISAJE · ESTRECHO Y COSTA",
      map: "Tangier, Morocco",
      count: "02"
    },
    marrakech: {
      title: "Marrakech",
      chapter: "PARADA 01 / MARRUECOS",
      description: "Una ciudad entre jardines, arquitectura histórica y los paisajes que anuncian el Atlas. Dedica tiempo a explorar sus barrios y a respetar las costumbres locales.",
      landscape: "PAISAJE · MEDINA Y MONTAÑA",
      map: "Marrakech, Morocco",
      count: "01"
    },
    lisbon: {
      title: "Lisboa",
      chapter: "PARADA 03 / PORTUGAL",
      description: "Miradores, tranvías y luz atlántica en una ciudad de colinas. Un punto de partida inspirador para seguir explorando Portugal por carretera.",
      landscape: "PAISAJE · COLINAS Y ATLÁNTICO",
      map: "Lisbon, Portugal",
      count: "03"
    },
    madrid: {
      title: "Madrid",
      chapter: "PARADA 04 / ESPAÑA",
      description: "Una parada urbana en el corazón de la península, entre plazas, parques y barrios llenos de vida. Planifica con antelación las zonas de circulación y estacionamiento.",
      landscape: "PAISAJE · CIUDAD Y MESETA",
      map: "Madrid, Spain",
      count: "04"
    },
    valencia: {
      title: "Valencia",
      chapter: "PARADA 05 / ESPAÑA",
      description: "Mar, huerta y arquitectura contemporánea se encuentran en la costa mediterránea. Explora la ciudad y sus espacios naturales con respeto por las normas locales.",
      landscape: "PAISAJE · MEDITERRÁNEO Y HUERTA",
      map: "Valencia, Spain",
      count: "05"
    },
    paris: {
      title: "París",
      chapter: "PARADA 06 / FRANCIA",
      description: "Avenidas, jardines y rincones junto al Sena. Para una aventura en furgo, revisa las zonas de bajas emisiones, estacionamiento y áreas autorizadas antes de entrar.",
      landscape: "PAISAJE · RÍO Y CIUDAD",
      map: "Paris, France",
      count: "06"
    },
    rome: {
      title: "Roma",
      chapter: "PARADA 07 / ITALIA",
      description: "Historia y vida cotidiana se mezclan en cada paseo. Deja la furgo en un área permitida y consulta las restricciones de tráfico del centro antes de explorar.",
      landscape: "PAISAJE · PATRIMONIO Y CIUDAD",
      map: "Rome, Italy",
      count: "07"
    },
    berlin: {
      title: "Berlín",
      chapter: "PARADA 08 / ALEMANIA",
      description: "Una ciudad creativa, llena de parques y espacios culturales. Revisa las normas ambientales y de estacionamiento para vehículos antes de llegar.",
      landscape: "PAISAJE · PARQUES Y CULTURA",
      map: "Berlin, Germany",
      count: "08"
    }
  };

  if (routeStops.length && stopTitle && stopChapter && stopDescription && stopLandscape && stopMapLink && stopCount) {
    routeStops.forEach(stop => {
      stop.addEventListener("click", () => {
        const detail = routeDetails[stop.dataset.stop];
        if (!detail) return;

        routeStops.forEach(routeStop => {
          const selected = routeStop === stop;
          routeStop.classList.toggle("is-selected", selected);
          routeStop.setAttribute("aria-pressed", String(selected));
        });
        stopTitle.textContent = detail.title;
        stopChapter.textContent = detail.chapter;
        stopDescription.textContent = detail.description;
        stopLandscape.textContent = detail.landscape;
        stopMapLink.href = `https://www.openstreetmap.org/search?query=${encodeURIComponent(detail.map)}`;
        stopCount.textContent = detail.count;
      });
    });
  }
})();
