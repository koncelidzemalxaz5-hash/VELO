
/* =========================================================
   🚴 VELO VIP HISTORY 2.0 DATA RENDERER
   ========================================================= */

function formatHistoryDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function createVipHistoryStats(ride) {
  const distance = Number(ride.distanceKm || ride.distance || 0);
  const average = Number(ride.averageSpeed || 0);
  const maximum = Number(ride.maxSpeed || 0);
  const elevation = Math.round(Number(ride.elevationGain || ride.elevation || 0));
  const duration = Number(ride.durationSeconds || 0);

  return `
    <div class="history-item">
      <div class="history-item-completed">
        Завершённая поездка
      </div>

      <div class="history-item-header">
        <div class="history-item-title">
          🚴 Поездка
        </div>

        <div class="history-item-date">
          ${ride.date
            ? new Date(ride.date).toLocaleDateString("ru-RU")
            : "—"}
        </div>
      </div>

      <div class="history-item-distance">
        <strong>${distance.toFixed(2)}</strong>
        <span>км</span>
      </div>

      <div class="history-item-stats">
        <span>⚡ ${average.toFixed(1)} км/ч</span>
        <span>🏆 ${maximum.toFixed(1)} км/ч</span>
        <span>⏱️ ${formatHistoryDuration(duration)}</span>
        <span>⛰️ ${elevation} м</span>
      </div>

      <div class="history-item-actions">
        <button type="button" class="history-view-route">
          🗺️ Маршрут
        </button>

        <button type="button" class="history-delete-ride">
          🗑️ Удалить
        </button>
      </div>
    </div>
  `;
}

function renderVipRideHistory(container) {
  if (!container) return;

  const history = getRideHistory();

  if (!history.length) {
    container.innerHTML = `
      <div class="history-item">
        <div class="history-item-title">
          Пока нет поездок
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = history
    .map(createVipHistoryStats)
    .join("");
}

function initVipHistoryRenderer() {
  const possibleContainers = [
    document.querySelector("#historyList"),
    document.querySelector(".history-list"),
    document.querySelector("#history"),
    document.querySelector(".history-items")
  ];

  const container = possibleContainers.find(Boolean);

  if (!container) {
    console.warn("⚠️ Контейнер истории пока не найден.");
    return;
  }

  renderVipRideHistory(container);
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(initVipHistoryRenderer, 100);
});

window.renderVipRideHistory = initVipHistoryRenderer;



/* =========================================================
   FULL RIDE RESULT PERSISTENCE
   ========================================================= */

const RIDE_HISTORY_STORAGE_KEY = "velo_ride_history";

function getRideHistory() {
  try {
    const raw = localStorage.getItem(RIDE_HISTORY_STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.warn("Ошибка чтения истории поездок:", error);
    return [];
  }
}

function saveRideResult() {
  const distanceKm =
    Number(activeRideGpsDistance || 0) / 1000;

  const elapsedSeconds =
    Math.max(0, Math.round(Number(activeRideElapsed || 0)));

  const averageSpeed =
    elapsedSeconds > 0
      ? distanceKm / (elapsedSeconds / 3600)
      : 0;

  const maxSpeed =
    Number(activeRideMaxSpeed || 0);

  const elevationGain =
    Math.max(
      0,
      Math.round(Number(activeRideElevationGain || 0))
    );

  const routePoints =
    Array.isArray(activeRideRoutePoints)
      ? activeRideRoutePoints.map(point => {
          if (Array.isArray(point)) {
            return point;
          }

          if (point && typeof point === "object") {
            return {
              lat: Number(point.lat),
              lng: Number(point.lng),
              altitude: Number.isFinite(Number(point.altitude))
                ? Number(point.altitude)
                : null
            };
          }

          return point;
        })
      : [];

  const ride = {
    id: `ride_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,

    date: new Date().toISOString(),

    distanceKm: Number(distanceKm.toFixed(2)),
    durationSeconds: elapsedSeconds,
    averageSpeed: Number(averageSpeed.toFixed(1)),
    maxSpeed: Number(maxSpeed.toFixed(1)),
    elevationGain,

    gpsDistanceMeters:
      Math.round(Number(activeRideGpsDistance || 0)),

    routePoints,

    speedSamples:
      Array.isArray(activeRideSpeedSamples)
        ? activeRideSpeedSamples.slice()
        : [],

    startedAt:
      activeRideStartedAt
        ? Number(activeRideStartedAt)
        : null,

    finishedAt: Date.now()
  };

  const history = getRideHistory();

  history.unshift(ride);

  localStorage.setItem(
    RIDE_HISTORY_STORAGE_KEY,
    JSON.stringify(history.slice(0, 100))
  );

  console.log("✅ Результат поездки сохранён:", ride);

  return ride;
}

function getLastRideResult() {
  const history = getRideHistory();
  return history.length ? history[0] : null;
}

function deleteRideResult(rideId) {
  const history = getRideHistory()
    .filter(ride => ride.id !== rideId);

  localStorage.setItem(
    RIDE_HISTORY_STORAGE_KEY,
    JSON.stringify(history)
  );
}

function clearRideHistory() {
  localStorage.removeItem(RIDE_HISTORY_STORAGE_KEY);
}


const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll("[data-page]");

function openPage(pageName) {
  pages.forEach(page => {
    page.classList.toggle(
      "active-page",
      page.id === pageName
    );
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page);
  });
});

document
  .getElementById("startRide")
  .addEventListener("click", () => {
    alert("🚴 Поездка готова к старту!");
  });


/* ===== RIDES ===== */

const openRideForm = document.getElementById("openRideForm");
const cancelRide = document.getElementById("cancelRide");
const rideForm = document.getElementById("rideForm");
const ridesList = document.getElementById("ridesList");

let rides = JSON.parse(localStorage.getItem("velo_rides") || "[]");

openRideForm.addEventListener("click", () => {
  rideForm.classList.add("visible");
  openRideForm.style.display = "none";
});

cancelRide.addEventListener("click", () => {
  rideForm.reset();
  rideForm.classList.remove("visible");
  openRideForm.style.display = "block";
});

rideForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const ride = {
    id: Date.now(),
    title: document.getElementById("rideTitle").value.trim(),
    start: document.getElementById("rideStart").value.trim(),
    finish: document.getElementById("rideFinish").value.trim(),
    date: document.getElementById("rideDate").value,
    time: document.getElementById("rideTime").value,
    people: document.getElementById("ridePeople").value,
    distance: Number(document.getElementById("rideDistance").value) || 0,
    duration: Number(document.getElementById("rideDuration").value) || 0,
    elevation: Number(document.getElementById("rideElevation")?.value) || 0,
    description: document.getElementById("rideDescription").value.trim(),
    joined: 1
  };

  rides.unshift(ride);

  localStorage.setItem(
    "velo_rides",
    JSON.stringify(rides)
  );

  rideForm.reset();
  rideForm.classList.remove("visible");
  openRideForm.style.display = "block";

  renderRides();
  updateRealProfileStats();
  updateAchievements();
});

function renderRides() {
  if (rides.length === 0) {
    ridesList.innerHTML = `
      <div class="empty-rides">
        🚴 Пока поездок нет.<br>
        Создай первую поездку!
      </div>
    `;
    return;
  }

  ridesList.innerHTML = rides.map(ride => `
    <article class="ride-card">
      <h3>🚴 ${escapeHtml(ride.title)}</h3>

      <div class="ride-info">
        <div>📍 ${escapeHtml(ride.start)}</div>
        <div>🏁 ${escapeHtml(ride.finish)}</div>
        <div>📅 ${escapeHtml(ride.date)} · 🕐 ${escapeHtml(ride.time)}</div>
        <div>📏 ${escapeHtml(ride.distance || 0)} км · ⏱️ ${escapeHtml(ride.duration || 0)} мин</div>
        <div>👥 ${escapeHtml(ride.people)} мест</div>
      </div>

      ${
        ride.description
          ? `<div class="ride-description">${escapeHtml(ride.description)}</div>`
          : ""
      }

      <button class="join-ride" data-ride-id="${ride.id}">
        👥 Присоединиться
      </button>
    </article>
  `).join("");

  document.querySelectorAll(".join-ride").forEach(button => {
    button.addEventListener("click", () => {
      const rideId = Number(button.dataset.rideId);
      const ride = rides.find(item => item.id === rideId);

      if (!ride) return;

      alert(`🚴 Ты присоединился к поездке «${ride.title}»!`);
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderRides();


/* ===== MAP / ROUTES ===== */

const routes = [
  {
    id: 1,
    title: "🌊 Батумский бульвар",
    distance: "18 км",
    difficulty: "Лёгкий",
    elevation: "120 м",
    description: "Спокойный маршрут вдоль побережья для вечерней поездки."
  },
  {
    id: 2,
    title: "🌿 Батуми → Чакви",
    distance: "32 км",
    difficulty: "Средний",
    elevation: "310 м",
    description: "Красивый прибрежный маршрут с небольшими подъёмами."
  },
  {
    id: 3,
    title: "⛰️ Горный маршрут",
    distance: "46 км",
    difficulty: "Сложный",
    elevation: "850 м",
    description: "Маршрут для опытных велосипедистов с серьёзным набором высоты."
  }
];

const routesList = document.getElementById("routesList");
const routeCount = document.getElementById("routeCount");
const routeSearch = document.getElementById("routeSearch");
const locateMe = document.getElementById("locateMe");
const locationStatus = document.getElementById("locationStatus");

function renderRoutes(list = routes) {
  routeCount.textContent = `${list.length} маршрута`;

  if (list.length === 0) {
    routesList.innerHTML = `
      <div class="empty-rides">
        🔎 Маршруты не найдены.
      </div>
    `;
    return;
  }

  routesList.innerHTML = list.map(route => `
    <article class="route-card">
      <h3>${escapeHtml(route.title)}</h3>

      <div class="route-meta">
        <span class="route-tag">🚴 ${escapeHtml(route.distance)}</span>
        <span class="route-tag">⚡ ${escapeHtml(route.difficulty)}</span>
        <span class="route-tag">⛰️ ${escapeHtml(route.elevation)}</span>
      </div>

      <p>${escapeHtml(route.description)}</p>

      <div class="route-actions">
        <button
          class="route-primary"
          data-route-id="${route.id}"
          data-action="open"
        >
          Открыть
        </button>

        <button
          data-route-id="${route.id}"
          data-action="create"
        >
          🚴 Поехать
        </button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-action='open']").forEach(button => {
    button.addEventListener("click", () => {
      const route = routes.find(
        item => item.id === Number(button.dataset.routeId)
      );

      if (route) {
        alert(`🗺️ ${route.title}\n\n${route.distance} · ${route.difficulty}`);
      }
    });
  });

  document.querySelectorAll("[data-action='create']").forEach(button => {
    button.addEventListener("click", () => {
      const route = routes.find(
        item => item.id === Number(button.dataset.routeId)
      );

      if (!route) return;

      openPage("rides");

      const title = document.getElementById("rideTitle");
      const start = document.getElementById("rideStart");
      const finish = document.getElementById("rideFinish");

      document.getElementById("openRideForm").click();

      title.value = route.title;
      start.value = "Моё местоположение";
      finish.value = route.title;
    });
  });
}

routeSearch.addEventListener("input", () => {
  const query = routeSearch.value.trim().toLowerCase();

  const filtered = routes.filter(route =>
    `${route.title} ${route.description} ${route.difficulty}`
      .toLowerCase()
      .includes(query)
  );

  renderRoutes(filtered);
});

locateMe.addEventListener("click", () => {
  if (!navigator.geolocation) {
    locationStatus.textContent = "Геолокация недоступна";
    return;
  }

  locationStatus.textContent = "Определяем позицию...";

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude.toFixed(4);
      const lon = position.coords.longitude.toFixed(4);

      locationStatus.textContent =
        `Позиция определена: ${lat}, ${lon}`;

      locateMe.textContent = "✓ Готово";
    },
    () => {
      locationStatus.textContent =
        "Не удалось определить позицию";
    }
  );
});

renderRoutes();
addFinishButtons();



/* ===== LOCAL CYCLING CHAT ===== */

const chatForm = document.getElementById("chatForm");
const chatMessage = document.getElementById("chatMessage");
const chatUsername = document.getElementById("chatUsername");
const chatWindow = document.getElementById("chatWindow");
const clearChat = document.getElementById("clearChat");

let chatMessages = JSON.parse(
  localStorage.getItem("velo_chat_messages") || "[]"
);

chatUsername.value =
  localStorage.getItem("velo_chat_username") || "";

chatUsername.addEventListener("input", () => {
  localStorage.setItem(
    "velo_chat_username",
    chatUsername.value.trim()
  );
});

chatForm.addEventListener("submit", event => {
  event.preventDefault();

  const username = chatUsername.value.trim();
  const text = chatMessage.value.trim();

  if (!username) {
    alert("👤 Сначала введи своё имя.");
    chatUsername.focus();
    return;
  }

  if (!text) return;

  chatMessages.push({
    id: Date.now(),
    username,
    text,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  });

  localStorage.setItem(
    "velo_chat_messages",
    JSON.stringify(chatMessages)
  );

  chatMessage.value = "";

  renderChat();
});

function renderChat() {
  if (chatMessages.length === 0) {
    chatWindow.innerHTML = `
      <div class="chat-empty">
        💬 Здесь пока нет сообщений.<br>
        Напиши первое сообщение!
      </div>
    `;
    return;
  }

  chatWindow.innerHTML = chatMessages.map(message => `
    <div class="chat-message">
      <div class="chat-message-head">
        <span class="chat-message-name">
          ${escapeHtml(message.username)}
        </span>
        <span class="chat-message-time">
          ${escapeHtml(message.time)}
        </span>
      </div>

      <div class="chat-message-text">
        ${escapeHtml(message.text)}
      </div>
    </div>
  `).join("");

  chatWindow.scrollTop = chatWindow.scrollHeight;
}

clearChat.addEventListener("click", () => {
  if (!confirm("Очистить все тестовые сообщения?")) {
    return;
  }

  chatMessages = [];

  localStorage.removeItem("velo_chat_messages");

  renderChat();
});

renderChat();



/* ===== PROFILE ===== */

const profileName = document.getElementById("profileName");
const profileUsername = document.getElementById("profileUsername");
const bikeName = document.getElementById("bikeName");
const bikeType = document.getElementById("bikeType");
const saveBike = document.getElementById("saveBike");

profileName.value =
  localStorage.getItem("velo_profile_name") || "";

if (profileUsername) {
  profileUsername.value =
    localStorage.getItem("velo_profile_username") || "";

  profileUsername.addEventListener("input", () => {
    localStorage.setItem(
      "velo_profile_username",
      profileUsername.value.trim().replace(/^@/, "")
    );
  });
}

bikeName.value =
  localStorage.getItem("velo_bike_name") || "";

bikeType.value =
  localStorage.getItem("velo_bike_type") || "";

profileName.addEventListener("input", () => {
  localStorage.setItem(
    "velo_profile_name",
    profileName.value.trim()
  );
});

saveBike.addEventListener("click", (event) => {
  event.preventDefault();

  const name = bikeName.value.trim();
  const type = bikeType.value.trim();

  localStorage.setItem("velo_bike_name", name);
  localStorage.setItem("velo_bike_type", type);

  saveBike.textContent = "✓ Сохранено";

  setTimeout(() => {
    saveBike.textContent = "💾 Сохранить велосипед";
  }, 1500);
});

function updateProfileStats() {
  const storedRides = JSON.parse(
    localStorage.getItem("velo_rides") || "[]"
  );

  document.getElementById("profileRides").textContent =
    storedRides.length;

  document.getElementById("profileKm").textContent = "0";
  document.getElementById("profileHours").textContent = "0";
}

updateProfileStats();



/* ===== REAL PROFILE STATISTICS ===== */

function updateRealProfileStats() {
  const activeRides = JSON.parse(
    localStorage.getItem("velo_rides") || "[]"
  );

  const completedRides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  const allRides = [...activeRides, ...completedRides];

  let totalKm = 0;
  let totalMinutes = 0;

  allRides.forEach(ride => {
    totalKm += Number(ride.distance) || 0;
    totalMinutes += Number(ride.duration) || 0;
  });

  document.getElementById("profileRides").textContent =
    allRides.length;

  document.getElementById("profileKm").textContent =
    totalKm % 1 === 0 ? totalKm : totalKm.toFixed(1);

  document.getElementById("profileHours").textContent =
    (totalMinutes / 60).toFixed(1);
}

updateRealProfileStats();



/* ===== RIDE HISTORY ===== */

function buildRideRoutePreview(routePoints) {
  if (!Array.isArray(routePoints) || routePoints.length < 2) {
    return "";
  }

  const points = routePoints
    .filter(point =>
      Number.isFinite(Number(point.latitude)) &&
      Number.isFinite(Number(point.longitude))
    )
    .slice(0, 500);

  if (points.length < 2) {
    return "";
  }

  const lats = points.map(point => Number(point.latitude));
  const lngs = points.map(point => Number(point.longitude));

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const width = 320;
  const height = 150;
  const padding = 18;

  const latRange = Math.max(maxLat - minLat, 0.00001);
  const lngRange = Math.max(maxLng - minLng, 0.00001);

  const projected = points.map(point => {
    const x =
      padding +
      ((Number(point.longitude) - minLng) / lngRange) *
        (width - padding * 2);

    const y =
      height -
      padding -
      ((Number(point.latitude) - minLat) / latRange) *
        (height - padding * 2);

    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `
    <div class="history-route-preview">
      <svg
        viewBox="0 0 ${width} ${height}"
        preserveAspectRatio="none"
        aria-label="GPS маршрут"
      >
        <polyline
          points="${projected.join(" ")}"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></polyline>

        <circle
          cx="${projected[0].split(",")[0]}"
          cy="${projected[0].split(",")[1]}"
          r="5"
          fill="currentColor"
        ></circle>

        <circle
          cx="${projected[projected.length - 1].split(",")[0]}"
          cy="${projected[projected.length - 1].split(",")[1]}"
          r="5"
          fill="currentColor"
        ></circle>
      </svg>
    </div>
  `;
}

function renderProfileHistory() {
  const container = document.getElementById("profileHistory");
  if (!container) return;

  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  if (!rides.length) {
    container.innerHTML = `
      <div class="history-empty">
        Пока нет завершённых поездок.
      </div>
    `;
    return;
  }

  container.innerHTML = rides
    .slice()
    .reverse()
    .map((ride, index) => {
      const distance = Number(ride.distance || 0);
      const duration = Number(ride.duration || 0);
      const averageSpeed = Number(ride.averageSpeed || 0);
      const maxSpeed = Number(ride.maxSpeed || 0);
      const elevation = Math.round(
        Number(ride.elevation || ride.elevationGain || 0)
      );

      const title = escapeHtml(
        ride.title || "Велопоездка"
      );

      const startPoint = escapeHtml(
        ride.start || "Старт"
      );

      const finishPoint = escapeHtml(
        ride.finish || "Финиш"
      );

      const completedAt = escapeHtml(
        ride.completedAt || ""
      );

      return `
        <article class="history-item">

          <div class="history-item-completed">
            ПОЕЗДКА ЗАВЕРШЕНА
          </div>

          <div class="history-item-header">

            <div>
              <div class="history-item-title">
                🚴 ${title}
              </div>

              <div class="history-item-route">
                📍 ${startPoint} → ${finishPoint}
              </div>
            </div>

            <div class="history-item-date">
              ${completedAt}
            </div>

          </div>

          <div class="history-item-distance">
            <strong>${distance.toFixed(2)}</strong>
            <span>км</span>
          </div>

          <div class="history-item-stats">

            <span>
              ⚡ ${averageSpeed.toFixed(1)} км/ч
            </span>

            <span>
              🏆 ${maxSpeed.toFixed(1)} км/ч
            </span>

            <span>
              ⏱️ ${duration} мин
            </span>

            <span>
              ⛰️ ${elevation} м
            </span>

          </div>

          ${buildRideRoutePreview(ride.routePoints)}

        </article>
      `;
    })
    .join("");
}
renderProfileHistory();



/* ===== FINISH RIDE ===== */

document.addEventListener("click", (event) => {
  const button = event.target.closest(".finish-ride-btn");

  if (!button) return;

  const rideId = button.dataset.finishRide;

  const rides = JSON.parse(
    localStorage.getItem("velo_rides") || "[]"
  );

  const rideIndex = rides.findIndex(
    ride => String(ride.id) === String(rideId)
  );

  if (rideIndex === -1) {
    alert("❌ Поездка не найдена.");
    return;
  }

  const ride = rides[rideIndex];

  if (!confirm(`Завершить поездку «${ride.title}»?`)) {
    return;
  }

  const completedRides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  completedRides.push({
    ...ride,
    completedAt: new Date().toLocaleDateString("ru-RU")
  });

  localStorage.setItem(
    "velo_completed_rides",
    JSON.stringify(completedRides)
  );

  rides.splice(rideIndex, 1);

  localStorage.setItem(
    "velo_rides",
    JSON.stringify(rides)
  );

  renderRoutes();
  renderProfileHistory();
  updateRealProfileStats();
  updateAchievements();

  alert("🏁 Поездка завершена и добавлена в историю!");
});



/* ===== ADD FINISH BUTTON TO JOINED RIDES ===== */

function addFinishButtons() {
  document.querySelectorAll("[data-ride-id]").forEach(card => {
    const rideId = card.dataset.rideId;

    if (!rideId || card.querySelector(".finish-ride-btn")) {
      return;
    }

    const rides = JSON.parse(
      localStorage.getItem("velo_rides") || "[]"
    );

    const ride = rides.find(
      item => String(item.id) === String(rideId)
    );

    if (!ride || !ride.joined) {
      return;
    }

    const button = document.createElement("button");

    button.type = "button";
    button.className = "finish-ride-btn";
    button.dataset.finishRide = ride.id;
    button.textContent = "🏁 Завершить поездку";

    card.appendChild(button);
  });
}

/* ===== REAL ACHIEVEMENTS ===== */
function updateAchievements() {
  const activeRides = JSON.parse(
    localStorage.getItem("velo_rides") || "[]"
  );

  const completedRides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  const allRides = [...activeRides, ...completedRides];

  let totalKm = 0;
  let totalElevation = 0;

  allRides.forEach(ride => {
    totalKm += Number(ride.distance) || 0;
    totalElevation += Number(ride.elevation) || 0;
  });

  const achievements = document.querySelectorAll(".achievement");

  if (achievements.length < 4) return;

  const unlocked = [
    allRides.length >= 1,
    totalKm >= 100,
    totalElevation >= 850,
    allRides.some(ride => Number(ride.people) > 1)
  ];

  achievements.forEach((card, index) => {
    if (unlocked[index]) {
      card.classList.remove("locked");
      card.classList.add("unlocked");

      const small = card.querySelector("small");

      if (small) {
        small.textContent = "🏆 Получено";
      }
    } else {
      card.classList.add("locked");
      card.classList.remove("unlocked");
    }
  });

  const progressBar = document.getElementById("achievement100Bar");
  const progressText = document.getElementById("achievement100Text");

  if (progressBar && progressText) {
    const progress = Math.min(100, (totalKm / 100) * 100);

    progressBar.style.width = progress + "%";
    progressText.textContent =
      `${Math.min(totalKm, 100)} / 100 км`;
  }

  const mountainBar = document.getElementById("mountainProgressBar");
  const mountainText = document.getElementById("mountainProgressText");

  if (mountainBar && mountainText) {
    const mountainProgress = Math.min(100, (totalElevation / 850) * 100);

    mountainBar.style.width = mountainProgress + "%";
    mountainText.textContent =
      `${Math.min(totalElevation, 850)} / 850 м`;
  }
}

updateAchievements();



/* ===== ACTIVE RIDE LOGIC ===== */

/* ===== ACTIVE RIDE PERSISTENCE ===== */

const ACTIVE_RIDE_STORAGE_KEY = "velo_active_ride_state";

function saveActiveRideState() {
  if (
    !activeRideStartedAt ||
    !Number.isFinite(Number(activeRideStartedAt)) ||
    activeRideElapsed < 0
  ) {
    return;
  }

  const state = {
    active: true,
    startedAt: activeRideStartedAt || null,
    elapsed: Number(activeRideElapsed || 0),
    paused: Boolean(activeRidePaused),
    gpsDistance: Number(activeRideGpsDistance || 0),
    lastPosition: activeRideLastPosition || null,
    routePoints: Array.isArray(activeRideRoutePoints)
      ? activeRideRoutePoints
      : [],
    currentSpeed: Number(activeRideCurrentSpeed || 0),
    maxSpeed: Number(activeRideMaxSpeed || 0),
    speedSamples: Array.isArray(activeRideSpeedSamples)
      ? activeRideSpeedSamples
      : [],
    elevationGain: Number(activeRideElevationGain || 0),
    lastAltitude: Number.isFinite(activeRideLastAltitude)
      ? activeRideLastAltitude
      : null,
    savedAt: Date.now()
  };

  localStorage.setItem(
    ACTIVE_RIDE_STORAGE_KEY,
    JSON.stringify(state)
  );
}


/* ===== ACTIVE RIDE PERSISTENCE HOOKS ===== */

function startActiveRidePersistence() {
  if (
    typeof activeRidePersistenceTimer !== "undefined" &&
    activeRidePersistenceTimer
  ) {
    clearInterval(activeRidePersistenceTimer);
  }

  activeRidePersistenceTimer = setInterval(() => {
    saveActiveRideState();
  }, 2000);
}

function stopActiveRidePersistence() {
  if (
    typeof activeRidePersistenceTimer !== "undefined" &&
    activeRidePersistenceTimer
  ) {
    clearInterval(activeRidePersistenceTimer);
    activeRidePersistenceTimer = null;
  }
}

document.addEventListener(
  "visibilitychange",
  () => {
    if (activeRideStartedAt && activeRidePanel?.style.display === "block") {
      saveActiveRideState();
    }
  }
);

window.addEventListener(
  "pagehide",
  () => {
    if (activeRideStartedAt && activeRidePanel?.style.display === "block") {
      saveActiveRideState();
    }
  }
);

window.addEventListener(
  "beforeunload",
  () => {
    if (activeRideStartedAt && activeRidePanel?.style.display === "block") {
      saveActiveRideState();
    }
  }
);

function clearActiveRideState() {
  localStorage.removeItem(ACTIVE_RIDE_STORAGE_KEY);
}

function restoreActiveRideState() {
  const raw = localStorage.getItem(
    ACTIVE_RIDE_STORAGE_KEY
  );

  if (!raw) {
    return false;
  }

  let state;

  try {
    state = JSON.parse(raw);
  } catch (error) {
    console.warn(
      "Ошибка восстановления активной поездки:",
      error
    );
    clearActiveRideState();
    return false;
  }

  if (!state || !state.active) {
    return false;
  }

  activeRideStartedAt =
    Number(state.startedAt) || null;

  activeRideElapsed =
    Number(state.elapsed) || 0;

  activeRidePaused =
    Boolean(state.paused);

  activeRideGpsDistance =
    Number(state.gpsDistance) || 0;

  activeRideLastPosition =
    state.lastPosition || null;

  activeRideRoutePoints =
    Array.isArray(state.routePoints)
      ? state.routePoints
      : [];

  activeRideCurrentSpeed =
    Number(state.currentSpeed) || 0;

  activeRideMaxSpeed =
    Number(state.maxSpeed) || 0;

  activeRideSpeedSamples =
    Array.isArray(state.speedSamples)
      ? state.speedSamples
      : [];

  activeRideElevationGain =
    Number(state.elevationGain) || 0;

  activeRideLastAltitude =
    Number.isFinite(Number(state.lastAltitude))
      ? Number(state.lastAltitude)
      : null;

  return true;
}



const activeRidePanel = document.getElementById("activeRidePanel");
const activeRideTime = document.getElementById("activeRideTime");
const activeRideDistance = document.getElementById("activeRideDistance");
const activeRideElevation = document.getElementById("activeRideElevation");
const pauseRideButton = document.getElementById("pauseRide");
const finishActiveRideButton = document.getElementById("finishActiveRide");
const startRideButton = document.getElementById("startRide");

let activeRideTimer = null;
let activeRideStartedAt = null;
let activeRideElapsed = 0;
let activeRidePaused = false;

function formatActiveRideTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(secs).padStart(2, "0")
  ].join(":");
}

function updateActiveRideTimer() {
  if (activeRidePaused) return;

  activeRideElapsed =
    Math.floor((Date.now() - activeRideStartedAt) / 1000);

  activeRideTime.textContent =
    formatActiveRideTime(activeRideElapsed);
}

function startActiveRide() {
  // ===== НОВАЯ ПОЕЗДКА =====
  // Полный сброс выполняется только при ручном нажатии «Начать поездку».
  activeRideGpsDistance = 0;
  activeRideLastPosition = null;
  activeRideElevationGain = 0;
  activeRideLastAltitude = null;
  activeRideCurrentSpeed = 0;
  activeRideMaxSpeed = 0;
  activeRideSpeedSamples = [];
  resetActiveRideRoute();

  activeRideStartedAt = Date.now();
  activeRideElapsed = 0;
  activeRidePaused = false;

  activeRidePanel.style.display = "block";
  startRideButton.style.display = "none";

  activeRideTime.textContent = "00:00:00";
  activeRideDistance.textContent = "0.0";
  activeRideElevation.textContent = "0";

  pauseRideButton.textContent = "⏸ Пауза";

  clearInterval(activeRideTimer);
  activeRideTimer = setInterval(updateActiveRideTimer, 1000);

  // Сохраняем активную поездку каждые 2 секунды.
  startActiveRidePersistence();
  saveActiveRideState();
}

startRideButton.addEventListener("click", () => {
  startActiveRide();
  startActiveRideGps();
});

pauseRideButton.addEventListener("click", () => {
  if (!activeRidePaused) {
    // ===== PAUSE =====
    activeRidePaused = true;

    // Останавливаем GPS, чтобы во время паузы
    // не росли расстояние и набор высоты.
    stopActiveRideGps();

    // Скорость на паузе должна быть 0.
    activeRideCurrentSpeed = 0;

    const speedElement =
      document.getElementById("activeRideSpeed");

    if (speedElement) {
      speedElement.textContent = "0.0";
    }

    pauseRideButton.textContent = "▶️ Продолжить";

  } else {
    // ===== RESUME =====
    activeRidePaused = false;

    // Продолжаем время с сохранённого значения.
    activeRideStartedAt =
      Date.now() - activeRideElapsed * 1000;

    // Снова запускаем GPS без сброса накопленных данных.
    resumeActiveRideGps();

    pauseRideButton.textContent = "⏸ Пауза";
  }
});

finishActiveRideButton.addEventListener("click", () => {
  stopActiveRideGps();
  clearInterval(activeRideTimer);

  const finishRideModal = document.getElementById("finishRideModal");
  const finishRideDistance = document.getElementById("finishRideDistance");
  const finishRideElevation = document.getElementById("finishRideElevation");
  const finishRideDuration = document.getElementById("finishRideDuration");
  const finishRidePreviewDistance = document.getElementById("finishRidePreviewDistance");
  const finishRideAverageSpeed = document.getElementById("finishRideAverageSpeed");
  const finishRideMaxSpeed = document.getElementById("finishRideMaxSpeed");
  const cancelFinishRide = document.getElementById("cancelFinishRide");
  const saveFinishedRide = document.getElementById("saveFinishedRide");

  // ===== АВТОМАТИЧЕСКИЕ ДАННЫЕ GPS =====
  const gpsDistance = Number(activeRideGpsDistance || 0) / 1000;
  const gpsElevation = Math.round(activeRideElevationGain || 0);

  const averageSpeed = getActiveRideAverageSpeed();

  finishRideDistance.value = gpsDistance.toFixed(2);
  finishRideElevation.value = gpsElevation;
  finishRideDuration.textContent = formatActiveRideTime(activeRideElapsed);
  finishRidePreviewDistance.textContent = gpsDistance.toFixed(2);

  /* ===== FINISH ELEVATION DISPLAY ===== */
  let finishElevationDisplay =
    document.getElementById("finishRideElevationDisplay");

  if (!finishElevationDisplay) {
    finishElevationDisplay = document.createElement("div");
    finishElevationDisplay.id = "finishRideElevationDisplay";
    finishElevationDisplay.className = "finish-ride-elevation-display";

    finishElevationDisplay.innerHTML = `
      <strong id="finishRideElevationValue">0 м</strong>
      <span>⛰️ набор высоты</span>
    `;

    finishRideModal
      .querySelector(".finish-ride-summary")
      ?.insertAdjacentElement("afterend", finishElevationDisplay);
  }

  const finishElevationValue =
    document.getElementById("finishRideElevationValue");

  if (finishElevationValue) {
    finishElevationValue.textContent = `${gpsElevation} м`;
  }

  if (finishRideAverageSpeed) {
    finishRideAverageSpeed.textContent = averageSpeed.toFixed(1);
  }

  if (finishRideMaxSpeed) {
    finishRideMaxSpeed.textContent =
      Number(activeRideMaxSpeed || 0).toFixed(1);
  }

  finishRideModal.style.display = "flex";

  finishRideDistance.oninput = () => {
    finishRidePreviewDistance.textContent =
      (Number(finishRideDistance.value) || 0).toFixed(1);
  };

  cancelFinishRide.onclick = () => {
    finishRideModal.style.display = "none";

    if (!activeRidePaused) {
      activeRideStartedAt =
        Date.now() - activeRideElapsed * 1000;

      clearInterval(activeRideTimer);
      activeRideTimer = setInterval(updateActiveRideTimer, 1000);
    }
  };

  saveFinishedRide.onclick = () => {

    /* =====================================================
       FULL RIDE SAVE
       Сохраняем абсолютно все результаты поездки
       ===================================================== */

    const savedRide = saveRideResult();

    if (!savedRide) {
      console.error("❌ Не удалось сохранить результат поездки.");
      return;
    }

    const distance = savedRide.distanceKm;
    const elevation = savedRide.elevationGain;
    const duration = Math.round(savedRide.durationSeconds / 60);

    const completedRide = {
      id: savedRide.id,
      title: "Активная поездка",
      start: "Моя поездка",
      finish: "Завершена",

      date: new Date(savedRide.finishedAt).toLocaleDateString("ru-RU"),

      time: new Date(savedRide.finishedAt).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit"
      }),

      people: 1,

      distance,
      duration,
      elevation,

      averageSpeed: savedRide.averageSpeed.toFixed(1),
      maxSpeed: savedRide.maxSpeed.toFixed(1),

      routePoints: savedRide.routePoints,

      speedSamples: savedRide.speedSamples,

      gpsDistanceMeters: savedRide.gpsDistanceMeters,

      startedAt: savedRide.startedAt,
      finishedAt: savedRide.finishedAt,

      description: "Поездка через активный режим",
      joined: 1,

      completedAt: new Date(savedRide.finishedAt).toLocaleDateString("ru-RU")
    };

    const completedRides = JSON.parse(
      localStorage.getItem("velo_completed_rides") || "[]"
    );

    completedRides.unshift(completedRide);

    localStorage.setItem(
      "velo_completed_rides",
      JSON.stringify(completedRides)
    );

    // Поездка завершена — временное состояние больше не нужно.
    stopActiveRidePersistence();
    clearActiveRideState();

    finishRideModal.style.display = "none";
    activeRidePanel.style.display = "none";
    startRideButton.style.display = "block";

    activeRidePaused = false;
    activeRideElapsed = 0;

    renderProfileHistory();
    updateRealProfileStats();
    updateAchievements();

    alert("🏁 Активная поездка сохранена!");
  };
});


/* ===== ACTIVE RIDE GPS ===== */

let activeRideWatchId = null;
let activeRideLastPosition = null;
let activeRideGpsDistance = 0;

/* ===== ACTIVE RIDE ROUTE TRACKING ===== */
let activeRideRoutePoints = [];

function resetActiveRideRoute() {
  activeRideRoutePoints = [];
}

function addActiveRideRoutePoint(position) {
  const { latitude, longitude, accuracy } = position.coords;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return;
  }

  if (accuracy && accuracy > 25) {
    return;
  }

  const lastPoint =
    activeRideRoutePoints[
      activeRideRoutePoints.length - 1
    ];

  if (lastPoint) {
    const segment = calculateDistanceMeters(
      lastPoint.latitude,
      lastPoint.longitude,
      latitude,
      longitude
    );

    // Не записываем невозможный GPS-прыжок.
    if (segment > 100) {
      return;
    }
  }

  activeRideRoutePoints.push({
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy)
      ? Math.round(accuracy)
      : null,
    timestamp: Date.now()
  });
}

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = value => value * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}

function updateActiveRideGps(position) {
  updateActiveRideSpeed(position);
  updateActiveRideGpsStatus(position);

  // GPS Filter: не накапливаем расстояние и высоту,
  // когда телефон считает, что велосипед стоит.
  if (!isActiveRideGpsMoving(position)) {
    return;
  }

  updateActiveRideElevation(position);

  const { latitude, longitude, accuracy } = position.coords;

  if (accuracy && accuracy > 50) {
    return;
  }

  if (activeRideLastPosition) {
    const segment = calculateDistanceMeters(
      activeRideLastPosition.latitude,
      activeRideLastPosition.longitude,
      latitude,
      longitude
    );

    if (segment <= 100) {
      activeRideGpsDistance += segment;

      activeRideDistance.textContent =
        (activeRideGpsDistance / 1000).toFixed(2);
    }
  }

  activeRideLastPosition = {
    latitude,
    longitude
  };

  addActiveRideRoutePoint(position);
}

function startActiveRideGps() {
  resetActiveRideElevation();
  resetActiveRideGpsStatus();

  activeRideCurrentSpeed = 0;
  activeRideMaxSpeed = 0;
  activeRideSpeedSamples = [];

  const speedElement = document.getElementById("activeRideSpeed");
  const maxSpeedElement = document.getElementById("activeRideMaxSpeed");

  if (speedElement) {
    speedElement.textContent = "0.0";
  }

  if (maxSpeedElement) {
    maxSpeedElement.textContent = "0.0";
  }

  if (!navigator.geolocation) {
    alert("📍 GPS недоступен.");
    return;
  }

  // GPS-данные не сбрасываем здесь.
  // Это важно для восстановления и продолжения поездки.

  activeRideWatchId = navigator.geolocation.watchPosition(
    updateActiveRideGps,
    error => console.warn("GPS:", error.message),
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000
    }
  );
}

function stopActiveRideGps() {
  if (activeRideWatchId !== null) {
    navigator.geolocation.clearWatch(activeRideWatchId);
    activeRideWatchId = null;
  }
}


function resumeActiveRideGps() {
  if (!navigator.geolocation) {
    alert("📍 GPS недоступен.");
    return;
  }

  // После паузы начинаем новое GPS-наблюдение,
  // но НЕ сбрасываем расстояние, высоту и скорость.
  activeRideLastPosition = null;

  activeRideWatchId = navigator.geolocation.watchPosition(
    updateActiveRideGps,
    error => console.warn("GPS:", error.message),
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000
    }
  );
}



/* ===== ACTIVE RIDE SPEED ===== */

let activeRideCurrentSpeed = 0;
let activeRideMaxSpeed = 0;
let activeRideSpeedSamples = [];

function getActiveRideAverageSpeed() {
  if (!activeRideElapsed || activeRideElapsed <= 0) {
    return 0;
  }

  const distanceKm =
    Number(activeRideGpsDistance || 0) / 1000;

  return distanceKm / (activeRideElapsed / 3600);
}

function updateActiveRideSpeed(position) {
  const speed = position.coords.speed;

  if (speed === null || speed === undefined || !Number.isFinite(speed)) {
    return;
  }

  let kmh = Math.max(0, speed * 3.6);

  if (kmh > 100) {
    return;
  }

  if (kmh < 1) {
    kmh = 0;
  }

  activeRideSpeedSamples.push(kmh);

  if (activeRideSpeedSamples.length > 5) {
    activeRideSpeedSamples.shift();
  }

  const averageSpeed =
    activeRideSpeedSamples.reduce((sum, value) => sum + value, 0) /
    activeRideSpeedSamples.length;

  activeRideCurrentSpeed = averageSpeed;

  if (averageSpeed > activeRideMaxSpeed) {
    activeRideMaxSpeed = averageSpeed;
  }

  const speedElement = document.getElementById("activeRideSpeed");
  const maxSpeedElement = document.getElementById("activeRideMaxSpeed");

  if (speedElement) {
    speedElement.textContent = averageSpeed.toFixed(1);
  }

  if (maxSpeedElement) {
    maxSpeedElement.textContent = activeRideMaxSpeed.toFixed(1);
  }
}


/* ===== ACTIVE RIDE ELEVATION ===== */

let activeRideElevationGain = 0;
let activeRideLastAltitude = null;

function updateActiveRideElevation(position) {
  const altitude = position.coords.altitude;
  const accuracy = position.coords.accuracy;

  // Не используем высоту при слишком неточном GPS
  if (accuracy && accuracy > 30) {
    return;
  }

  // Телефон может временно не предоставить высоту
  if (
    altitude === null ||
    altitude === undefined ||
    !Number.isFinite(altitude)
  ) {
    return;
  }

  // Первую точку используем только как начальную
  if (activeRideLastAltitude === null) {
    activeRideLastAltitude = altitude;
    return;
  }

  const change = altitude - activeRideLastAltitude;

  /*
   * Учитываем только реальный подъём.
   * Очень маленькие изменения считаем GPS-шумом.
   */
  if (change >= 2 && change <= 50) {
    activeRideElevationGain += change;
  }

  activeRideLastAltitude = altitude;

  const elevationElement =
    document.getElementById("activeRideElevation");

  if (elevationElement) {
    elevationElement.textContent =
      Math.round(activeRideElevationGain);
  }
}

function resetActiveRideElevation() {
  activeRideElevationGain = 0;
  activeRideLastAltitude = null;

  const elevationElement =
    document.getElementById("activeRideElevation");

  if (elevationElement) {
    elevationElement.textContent = "0";
  }
}


/* ===== ACTIVE RIDE GPS STATUS ===== */

let activeRideGpsAccuracy = null;

function updateActiveRideGpsStatus(position) {
  const accuracy = position.coords.accuracy;

  if (
    accuracy === null ||
    accuracy === undefined ||
    !Number.isFinite(accuracy)
  ) {
    return;
  }

  activeRideGpsAccuracy = accuracy;

  const statusElement =
    document.getElementById("activeRideGpsStatus");

  const accuracyElement =
    document.getElementById("activeRideGpsAccuracy");

  if (accuracyElement) {
    accuracyElement.textContent =
      Math.round(accuracy) + " м";
  }

  if (!statusElement) {
    return;
  }

  if (accuracy <= 10) {
    statusElement.textContent = "🟢 GPS точный";
  } else if (accuracy <= 25) {
    statusElement.textContent = "🟡 GPS средний";
  } else {
    statusElement.textContent = "🔴 GPS слабый";
  }
}

function resetActiveRideGpsStatus() {
  activeRideGpsAccuracy = null;

  const statusElement =
    document.getElementById("activeRideGpsStatus");

  const accuracyElement =
    document.getElementById("activeRideGpsAccuracy");

  if (statusElement) {
    statusElement.textContent = "📍 GPS определение...";
  }

  if (accuracyElement) {
    accuracyElement.textContent = "—";
  }
}


/* ===== ACTIVE RIDE GPS FILTER ===== */

function isActiveRideGpsMoving(position) {
  const speed = position.coords.speed;
  const accuracy = position.coords.accuracy;

  // Слишком неточный GPS не считаем движением.
  if (accuracy && accuracy > 50) {
    return false;
  }

  // Если телефон сообщил скорость — используем её.
  if (
    speed !== null &&
    speed !== undefined &&
    Number.isFinite(speed)
  ) {
    return speed >= 0.5;
  }

  // На Android speed часто бывает null.
  // В этом случае саму GPS-точку всё равно принимаем.
  return true;
}

/* ===== ACTIVE RIDE RESTORE — STEP 3B ===== */

var activeRidePersistenceTimer =
  typeof activeRidePersistenceTimer !== "undefined"
    ? activeRidePersistenceTimer
    : null;

function restoreActiveRideUI() {
  if (!activeRideStartedAt) {
    return false;
  }

  if (activeRidePanel) {
    activeRidePanel.style.display = "block";
  }

  if (startRideButton) {
    startRideButton.style.display = "none";
  }

  if (activeRideTime) {
    activeRideTime.textContent =
      formatActiveRideTime(activeRideElapsed);
  }

  if (activeRideDistance) {
    activeRideDistance.textContent =
      (Number(activeRideGpsDistance || 0) / 1000).toFixed(2);
  }

  if (activeRideElevation) {
    activeRideElevation.textContent =
      Math.round(activeRideElevationGain || 0);
  }

  if (pauseRideButton) {
    pauseRideButton.textContent =
      activeRidePaused
        ? "▶️ Продолжить"
        : "⏸ Пауза";
  }

  const speedElement =
    document.getElementById("activeRideSpeed");

  if (speedElement) {
    speedElement.textContent =
      Number(activeRideCurrentSpeed || 0).toFixed(1);
  }

  const maxSpeedElement =
    document.getElementById("activeRideMaxSpeed");

  if (maxSpeedElement) {
    maxSpeedElement.textContent =
      Number(activeRideMaxSpeed || 0).toFixed(1);
  }

  return true;
}

function restoreActiveRideOnStartup() {
  const restored = restoreActiveRideState();

  if (!restored) {
    return false;
  }

  restoreActiveRideUI();

  clearInterval(activeRideTimer);

  if (!activeRidePaused) {
    activeRideStartedAt =
      Date.now() - activeRideElapsed * 1000;

    activeRideTimer =
      setInterval(updateActiveRideTimer, 1000);

    stopActiveRideGps();
    startActiveRideGps();

    startActiveRidePersistence();
  }

  console.log(
    "✅ Активная поездка восстановлена после перезагрузки."
  );

  return true;
}





/* Автоматическое восстановление после загрузки приложения */
restoreActiveRideOnStartup();




/* =========================================================
   🚴 VELO HISTORY DELETE — SINGLE + ALL
   ========================================================= */

function deleteCompletedRide(rideId) {
  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  const updatedRides = rides.filter(ride => String(ride.id) !== String(rideId));

  localStorage.setItem(
    "velo_completed_rides",
    JSON.stringify(updatedRides)
  );

  renderProfileHistory();
  updateRealProfileStats();
  updateAchievements();

  console.log("🗑️ Поездка удалена:", rideId);
}

function deleteAllCompletedRides() {
  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  if (!rides.length) {
    alert("История поездок уже пустая.");
    return;
  }

  const confirmed = confirm(
    `Удалить всю историю поездок?\n\nБудет удалено: ${rides.length} поездок.\n\nЭто действие нельзя отменить.`
  );

  if (!confirmed) return;

  localStorage.removeItem("velo_completed_rides");

  renderProfileHistory();
  updateRealProfileStats();
  updateAchievements();

  console.log("🗑️ Вся история поездок удалена.");
}

/* Кнопка удаления одной поездки */
document.addEventListener("click", event => {
  const deleteButton = event.target.closest(".history-delete-ride");

  if (!deleteButton) return;

  const rideId = deleteButton.dataset.rideId;

  if (!rideId) {
    console.warn("⚠️ ID поездки для удаления не найден.");
    return;
  }

  const confirmed = confirm(
    "Удалить эту поездку из истории?\n\nЭто действие нельзя отменить."
  );

  if (!confirmed) return;

  deleteCompletedRide(rideId);
});

/* =========================================================
   Добавляем кнопку удаления в существующие VIP-карточки
   ========================================================= */

const originalRenderProfileHistory = renderProfileHistory;

renderProfileHistory = function() {
  originalRenderProfileHistory();

  const container = document.getElementById("profileHistory");

  if (!container) return;

  const cards = container.querySelectorAll(".history-item");

  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  cards.forEach((card, index) => {
    const ride = rides.slice().reverse()[index];

    if (!ride) return;

    if (!card.querySelector(".history-delete-ride")) {
      const deleteButton = document.createElement("button");

      deleteButton.type = "button";
      deleteButton.className = "history-delete-ride";
      deleteButton.dataset.rideId = ride.id;
      deleteButton.textContent = "🗑️ Удалить";

      const routePreview =
        card.querySelector(".history-route-preview");

      if (routePreview) {
        routePreview.insertAdjacentElement(
          "afterend",
          deleteButton
        );
      } else {
        card.appendChild(deleteButton);
      }
    }
  });
};

/* =========================================================
   Кнопка "Удалить всю историю"
   ========================================================= */

function addDeleteAllHistoryButton() {
  const container = document.getElementById("profileHistory");

  if (!container) return;

  if (document.getElementById("deleteAllHistoryButton")) return;

  const button = document.createElement("button");

  button.id = "deleteAllHistoryButton";
  button.type = "button";
  button.className = "delete-all-history-button";
  button.textContent = "🗑️ Удалить всю историю";

  button.addEventListener("click", deleteAllCompletedRides);

  container.insertAdjacentElement("afterend", button);
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(addDeleteAllHistoryButton, 150);
});

window.deleteCompletedRide = deleteCompletedRide;
window.deleteAllCompletedRides = deleteAllCompletedRides;


/* =========================================================
   🚴 VELO VIP RIDE RESULT — FIRE BURST EFFECT
   ========================================================= */

function playRideResultBurst(card) {
  if (!card) return;

  const burst = document.createElement("div");
  burst.className = "ride-result-fire-burst";

  for (let i = 0; i < 24; i++) {
    const particle = document.createElement("span");

    const angle = (Math.PI * 2 * i) / 24;
    const distance = 55 + Math.random() * 90;

    particle.style.setProperty(
      "--x",
      `${Math.cos(angle) * distance}px`
    );

    particle.style.setProperty(
      "--y",
      `${Math.sin(angle) * distance}px`
    );

    particle.style.setProperty(
      "--delay",
      `${Math.random() * 80}ms`
    );

    burst.appendChild(particle);
  }

  card.appendChild(burst);

  setTimeout(() => {
    burst.remove();
  }, 900);
}

/* Открытие полного результата */
document.addEventListener("click", event => {
  const card = event.target.closest(
    "#profileHistory .history-item"
  );

  if (!card) return;

  if (
    event.target.closest(".history-delete-ride") ||
    event.target.closest("button")
  ) {
    return;
  }

  playRideResultBurst(card);

  card.classList.add("ride-result-open");

  setTimeout(() => {
    card.classList.remove("ride-result-open");
  }, 650);

  console.log("🔥 VIP результат поездки открыт.");
});




/* =========================================================
   🚴 VELO VIP RIDE REVEAL — FIRE OPENING
   ========================================================= */

function openVipRideReveal(ride) {
  if (!ride) return;

  const old = document.getElementById("vipRideReveal");
  if (old) old.remove();

  const distance = Number(ride.distance || 0);
  const average = Number(ride.averageSpeed || 0);
  const maximum = Number(ride.maxSpeed || 0);
  const duration = Number(ride.duration || 0);
  const elevation = Math.round(
    Number(ride.elevation || ride.elevationGain || 0)
  );

  const overlay = document.createElement("div");
  overlay.id = "vipRideReveal";
  overlay.className = "vip-ride-reveal";

  overlay.innerHTML = `
    <div class="vip-reveal-fire">
      ${Array.from({ length: 32 }, () => `<i></i>`).join("")}
    </div>

    <div class="vip-reveal-panel">

      <button
        type="button"
        class="vip-reveal-close"
        aria-label="Закрыть"
      >×</button>

      <div class="vip-reveal-badge">
        <span></span>
        RIDE COMPLETE
      </div>

      <div class="vip-reveal-title">
        🚴 Ваша поездка
      </div>

      <div class="vip-reveal-distance">
        <strong>${distance.toFixed(2)}</strong>
        <span>км</span>
      </div>

      <div class="vip-reveal-stats">

        <div>
          <small>СРЕДНЯЯ</small>
          <strong>${average.toFixed(1)}</strong>
          <span>км/ч</span>
        </div>

        <div>
          <small>МАКСИМУМ</small>
          <strong>${maximum.toFixed(1)}</strong>
          <span>км/ч</span>
        </div>

        <div>
          <small>ВРЕМЯ</small>
          <strong>${duration}</strong>
          <span>мин</span>
        </div>

        <div>
          <small>НАБОР</small>
          <strong>${elevation}</strong>
          <span>м</span>
        </div>

      </div>

      <div class="vip-reveal-route">
        ${buildRideRoutePreview(ride.routePoints || [])}
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add("show");
  });

  const close = () => {
    overlay.classList.remove("show");

    setTimeout(() => {
      overlay.remove();
    }, 420);
  };

  overlay
    .querySelector(".vip-reveal-close")
    ?.addEventListener("click", close);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) close();
  });
}

/* Открываем результат при нажатии на карточку */
document.addEventListener("click", event => {
  const card = event.target.closest(
    "#profileHistory .history-item"
  );

  if (!card) return;

  if (
    event.target.closest("button") ||
    event.target.closest(".history-delete-ride")
  ) {
    return;
  }

  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  const visibleRides = rides.slice().reverse();
  const cards = Array.from(
    document.querySelectorAll("#profileHistory .history-item")
  );

  const index = cards.indexOf(card);
  const ride = visibleRides[index];

  if (!ride) return;

  playRideResultBurst(card);
  openVipRideReveal(ride);
});

window.openVipRideReveal = openVipRideReveal;



/* =========================================================
   🚴 VELO VIP HISTORY 4.0 — RIDE IDS
   ========================================================= */

function ensureCompletedRideIds() {
  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  let changed = false;

  rides.forEach((ride, index) => {
    if (!ride.id) {
      ride.id =
        "ride_" +
        Date.now().toString(36) +
        "_" +
        index.toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8);

      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem(
      "velo_completed_rides",
      JSON.stringify(rides)
    );

    console.log("✅ ID добавлены старым поездкам.");
  }

  return rides;
}

document.addEventListener("DOMContentLoaded", () => {
  ensureCompletedRideIds();
});

window.ensureCompletedRideIds = ensureCompletedRideIds;



/* =========================================================
   🚴 VELO VIP HISTORY 4.1 — DELETE BY ID
   ========================================================= */

function deleteRideById(rideId) {
  if (!rideId) return;

  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  const exists = rides.some(
    ride => String(ride.id) === String(rideId)
  );

  if (!exists) {
    console.warn("⚠️ Поездка с таким ID не найдена:", rideId);
    return;
  }

  const confirmed = confirm(
    "Удалить эту поездку из истории?\n\nЭто действие нельзя отменить."
  );

  if (!confirmed) return;

  const updatedRides = rides.filter(
    ride => String(ride.id) !== String(rideId)
  );

  localStorage.setItem(
    "velo_completed_rides",
    JSON.stringify(updatedRides)
  );

  renderProfileHistory();
  updateRealProfileStats();
  updateAchievements();

  console.log("🗑️ Удалена поездка:", rideId);
}

/* Надёжно привязываем ID к карточке */
function refreshHistoryDeleteIds() {
  ensureCompletedRideIds();

  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  const visibleRides = rides.slice().reverse();

  const cards = Array.from(
    document.querySelectorAll("#profileHistory .history-item")
  );

  cards.forEach((card, index) => {
    const ride = visibleRides[index];
    if (!ride) return;

    card.dataset.rideId = ride.id;

    const deleteButton = card.querySelector(
      ".history-delete-ride"
    );

    if (deleteButton) {
      deleteButton.dataset.rideId = ride.id;
    }
  });
}

/* Удаление по ID */
document.addEventListener("click", event => {
  const button = event.target.closest(
    "#profileHistory .history-delete-ride"
  );

  if (!button) return;

  event.preventDefault();
  event.stopPropagation();

  const rideId = button.dataset.rideId;

  if (!rideId) {
    console.warn("⚠️ ID поездки отсутствует.");
    return;
  }

  deleteRideById(rideId);
});

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(refreshHistoryDeleteIds, 250);
});

window.deleteRideById = deleteRideById;
window.refreshHistoryDeleteIds = refreshHistoryDeleteIds;



/* =========================================================
   🗑️🔥 VELO VIP HISTORY 4.2 — DELETE HOOK
   ========================================================= */

function animateAndDeleteRide(rideId, button) {
  if (!rideId) return;

  const card = button
    ? button.closest("#profileHistory .history-item")
    : document.querySelector(
        `#profileHistory .history-item[data-ride-id="${CSS.escape(String(rideId))}"]`
      );

  if (!card) {
    deleteRideById(rideId);
    return;
  }

  const confirmed = confirm(
    "Удалить эту поездку из истории?\n\nЭто действие нельзя отменить."
  );

  if (!confirmed) return;

  card.classList.add("history-delete-start");

  setTimeout(() => {
    deleteRideByIdWithoutConfirm(rideId);

    const container = document.getElementById("profileHistory");

    if (container) {
      container.classList.remove("history-delete-reflow");

      void container.offsetWidth;

      container.classList.add("history-delete-reflow");

      setTimeout(() => {
        container.classList.remove("history-delete-reflow");
      }, 350);
    }
  }, 550);
}

function deleteRideByIdWithoutConfirm(rideId) {
  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  const updatedRides = rides.filter(
    ride => String(ride.id) !== String(rideId)
  );

  localStorage.setItem(
    "velo_completed_rides",
    JSON.stringify(updatedRides)
  );

  renderProfileHistory();
  updateRealProfileStats();
  updateAchievements();

  setTimeout(refreshHistoryDeleteIds, 50);

  console.log("🗑️ Поездка удалена с анимацией:", rideId);
}

/* Перехватываем кнопку удаления раньше старого обработчика */
document.addEventListener("click", event => {
  const button = event.target.closest(
    "#profileHistory .history-delete-ride"
  );

  if (!button) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const rideId = button.dataset.rideId;

  if (!rideId) {
    console.warn("⚠️ ID поездки отсутствует.");
    return;
  }

  animateAndDeleteRide(rideId, button);
}, true);

window.animateAndDeleteRide = animateAndDeleteRide;

/* =========================================================
   💥🔥 VELO VIP HISTORY 4.3 — MASS DELETE HOOK
   ========================================================= */

function playMassDeleteExplosion() {
  const container = document.getElementById("profileHistory");
  if (!container) return;

  container.classList.add("history-mass-delete");

  const particleCount = 42;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("span");
    particle.className = "vip-mass-particle";

    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 260;

    particle.style.setProperty(
      "--x",
      `${Math.cos(angle) * distance}px`
    );

    particle.style.setProperty(
      "--y",
      `${Math.sin(angle) * distance}px`
    );

    particle.style.setProperty(
      "--size",
      `${3 + Math.random() * 7}px`
    );

    particle.style.setProperty(
      "--delay",
      `${Math.random() * 120}ms`
    );

    document.body.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 1100);
  }

  setTimeout(() => {
    localStorage.removeItem("velo_completed_rides");

    renderProfileHistory();
    updateRealProfileStats();
    updateAchievements();

    container.classList.remove("history-mass-delete");

    console.log("💥 Вся история удалена эффектом взрыва.");
  }, 750);
}

/* Перехватываем кнопку «Удалить всю историю» */
document.addEventListener("click", event => {
  const button = event.target.closest(
    "#deleteAllHistoryButton"
  );

  if (!button) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  if (!rides.length) {
    alert("История поездок уже пустая.");
    return;
  }

  const confirmed = confirm(
    `💥 Удалить всю историю поездок?\n\n` +
    `Будет удалено: ${rides.length} поездок.\n\n` +
    `Это действие нельзя отменить.`
  );

  if (!confirmed) return;

  button.disabled = true;

  playMassDeleteExplosion();

  setTimeout(() => {
    button.disabled = false;
  }, 900);
}, true);

window.playMassDeleteExplosion = playMassDeleteExplosion;


/* =========================================================
   ✨🚴 VELO VIP HISTORY 4.4 — NEW RIDE ARRIVAL HOOK
   ========================================================= */

function playNewRideArrival(rideId) {
  const container = document.getElementById("profileHistory");
  if (!container) return;

  ensureCompletedRideIds();

  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  const visibleRides = rides.slice().reverse();

  const index = visibleRides.findIndex(
    ride => String(ride.id) === String(rideId)
  );

  if (index === -1) return;

  const cards = Array.from(
    container.querySelectorAll(".history-item")
  );

  const card = cards[index];
  if (!card) return;

  card.classList.remove("history-new-ride");

  void card.offsetWidth;

  card.classList.add("history-new-ride");

  setTimeout(() => {
    card.classList.remove("history-new-ride");
  }, 1400);

  console.log("✨ Новая поездка красиво появилась в истории:", rideId);
}

/* Запоминаем последнюю завершённую поездку */
function markLastCompletedRideForArrival() {
  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  if (!rides.length) return;

  const latestRide = rides[0];

  if (!latestRide || !latestRide.id) return;

  setTimeout(() => {
    playNewRideArrival(latestRide.id);
  }, 120);

  sessionStorage.setItem(
    "velo_last_arrival_ride",
    String(latestRide.id)
  );
}

/* Подключаем эффект к завершению активной поездки */
document.addEventListener("click", event => {
  const button = event.target.closest(".finish-ride-btn");

  if (!button) return;

  setTimeout(() => {
    const rides = JSON.parse(
      localStorage.getItem("velo_completed_rides") || "[]"
    );

    if (!rides.length) return;

    const latestRide = rides[0];

    if (!latestRide || !latestRide.id) return;

    playNewRideArrival(latestRide.id);
  }, 900);
});

window.playNewRideArrival = playNewRideArrival;
window.markLastCompletedRideForArrival =
  markLastCompletedRideForArrival;


/* =========================================================
   🚴🔥 VELO VIP HISTORY 4.5 — ANIMATED RIDE RESULT
   ========================================================= */

function animateVipNumber(element, target, decimals = 0, duration = 900) {
  if (!element) return;

  const start = 0;
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min(
      (now - startTime) / duration,
      1
    );

    const eased = 1 - Math.pow(1 - progress, 3);
    const value = start + (target - start) * eased;

    element.textContent = value.toFixed(decimals);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      element.textContent = target.toFixed(decimals);
    }
  }

  element.textContent = decimals ? "0.0" : "0";
  requestAnimationFrame(frame);
}

function animateVipRideRevealNumbers() {
  const overlay = document.getElementById("vipRideReveal");
  if (!overlay) return;

  const distanceElement =
    overlay.querySelector(".vip-reveal-distance strong");

  const statElements =
    overlay.querySelectorAll(".vip-reveal-stats strong");

  const distance = Number(
    distanceElement?.dataset.value || 0
  );

  if (distanceElement) {
    animateVipNumber(
      distanceElement,
      distance,
      2,
      1100
    );
  }

  statElements.forEach(element => {
    const value = Number(
      element.dataset.value || 0
    );

    const decimals =
      Number.isInteger(value) ? 0 : 1;

    animateVipNumber(
      element,
      value,
      decimals,
      850
    );
  });
}

/* Подготовка значений для анимации */
const originalOpenVipRideReveal =
  window.openVipRideReveal;

window.openVipRideReveal = function(ride) {
  if (!ride) return;

  openVipRideReveal(ride);

  const overlay =
    document.getElementById("vipRideReveal");

  if (!overlay) return;

  const distanceElement =
    overlay.querySelector(".vip-reveal-distance strong");

  if (distanceElement) {
    distanceElement.dataset.value =
      Number(ride.distance || 0);
  }

  const stats =
    overlay.querySelectorAll(
      ".vip-reveal-stats strong"
    );

  const values = [
    Number(ride.averageSpeed || 0),
    Number(ride.maxSpeed || 0),
    Number(ride.duration || 0),
    Number(
      ride.elevation ||
      ride.elevationGain ||
      0
    )
  ];

  stats.forEach((element, index) => {
    element.dataset.value =
      values[index] || 0;
  });

  setTimeout(
    animateVipRideRevealNumbers,
    180
  );
};

/* =========================================================
   Финальный световой импульс
   ========================================================= */

function playVipResultPulse() {
  const overlay =
    document.getElementById("vipRideReveal");

  if (!overlay) return;

  overlay.classList.remove(
    "vip-result-pulse"
  );

  void overlay.offsetWidth;

  overlay.classList.add(
    "vip-result-pulse"
  );

  setTimeout(() => {
    overlay.classList.remove(
      "vip-result-pulse"
    );
  }, 900);
}

window.playVipResultPulse =
  playVipResultPulse;


/* =========================================================
   🚴✨ VELO VIP HISTORY 4.6 — CARD INTERACTION
   ========================================================= */

function playVipCardInteraction(card) {
  if (!card) return;

  card.classList.remove("vip-card-touch");

  void card.offsetWidth;

  card.classList.add("vip-card-touch");

  setTimeout(() => {
    card.classList.remove("vip-card-touch");
  }, 650);
}

document.addEventListener("pointerdown", event => {
  const card = event.target.closest(
    "#profileHistory .history-item"
  );

  if (!card) return;

  if (
    event.target.closest("button") ||
    event.target.closest(".history-delete-ride")
  ) {
    return;
  }

  playVipCardInteraction(card);
});

window.playVipCardInteraction =
  playVipCardInteraction;


/* =========================================================
   🚴✨ VELO VIP HISTORY 4.7 — LIVE CARD MOTION
   ========================================================= */

function vipCardMoveEffect(card, x, y) {
  if (!card) return;

  const rect = card.getBoundingClientRect();

  const px = (x - rect.left) / rect.width;
  const py = (y - rect.top) / rect.height;

  const rotateY = (px - 0.5) * 5;
  const rotateX = (0.5 - py) * 5;

  card.style.setProperty("--vip-rotate-x", `${rotateX}deg`);
  card.style.setProperty("--vip-rotate-y", `${rotateY}deg`);
  card.classList.add("vip-card-moving");
}

function vipCardMoveReset(card) {
  if (!card) return;

  card.classList.remove("vip-card-moving");
  card.style.removeProperty("--vip-rotate-x");
  card.style.removeProperty("--vip-rotate-y");
}

document.addEventListener("pointermove", event => {
  const card = event.target.closest(
    "#profileHistory .history-item"
  );

  if (!card) return;

  if (
    event.target.closest("button") ||
    event.target.closest(".history-delete-ride")
  ) {
    return;
  }

  vipCardMoveEffect(card, event.clientX, event.clientY);
});

document.addEventListener("pointerleave", event => {
  const card = event.target.closest(
    "#profileHistory .history-item"
  );

  if (card) {
    vipCardMoveReset(card);
  }
}, true);

document.addEventListener("pointerup", event => {
  const card = event.target.closest(
    "#profileHistory .history-item"
  );

  if (card) {
    setTimeout(() => vipCardMoveReset(card), 120);
  }
});

window.vipCardMoveEffect = vipCardMoveEffect;
window.vipCardMoveReset = vipCardMoveReset;


/* =========================================================
   🔒🚴 VELO VIP HISTORY 4.8 — DATA PROTECTION
   ========================================================= */

function backupCompletedRides() {
  try {
    const rides = localStorage.getItem("velo_completed_rides");

    if (!rides) {
      console.log("ℹ️ История поездок пока пуста.");
      return;
    }

    localStorage.setItem(
      "velo_completed_rides_backup",
      rides
    );

    localStorage.setItem(
      "velo_completed_rides_backup_time",
      new Date().toISOString()
    );

    console.log("🔒 Резервная копия истории поездок обновлена.");
  } catch (error) {
    console.warn("⚠️ Не удалось создать резервную копию истории:", error);
  }
}

function restoreCompletedRidesBackup() {
  try {
    const backup = localStorage.getItem(
      "velo_completed_rides_backup"
    );

    if (!backup) {
      console.warn("⚠️ Резервная копия истории не найдена.");
      return false;
    }

    JSON.parse(backup);

    localStorage.setItem(
      "velo_completed_rides",
      backup
    );

    console.log("♻️ История поездок восстановлена из резервной копии.");

    if (typeof renderProfileHistory === "function") {
      renderProfileHistory();
    }

    if (typeof updateRealProfileStats === "function") {
      updateRealProfileStats();
    }

    if (typeof updateAchievements === "function") {
      updateAchievements();
    }

    if (typeof refreshHistoryDeleteIds === "function") {
      setTimeout(refreshHistoryDeleteIds, 100);
    }

    return true;
  } catch (error) {
    console.warn("❌ Ошибка восстановления истории:", error);
    return false;
  }
}

/* Автоматическая защита при загрузке */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    backupCompletedRides();
  }, 300);
});

window.backupCompletedRides = backupCompletedRides;
window.restoreCompletedRidesBackup = restoreCompletedRidesBackup;


/* =========================================================
   🏆🚴 VELO VIP ACHIEVEMENTS 5.0 — ACHIEVEMENT ENGINE
   ========================================================= */

const VELO_VIP_ACHIEVEMENTS = [
  {
    id: "first_ride",
    icon: "🚴",
    title: "Первая поездка",
    description: "Завершите первую поездку",
    check: stats => stats.rides >= 1
  },
  {
    id: "five_rides",
    icon: "🔥",
    title: "В ритме",
    description: "Завершите 5 поездок",
    check: stats => stats.rides >= 5
  },
  {
    id: "ten_rides",
    icon: "⚡",
    title: "Десятая поездка",
    description: "Завершите 10 поездок",
    check: stats => stats.rides >= 10
  },
  {
    id: "fifty_km",
    icon: "🛣️",
    title: "50 километров",
    description: "Проедьте 50 км суммарно",
    check: stats => stats.distance >= 50
  },
  {
    id: "100_km",
    icon: "💯",
    title: "100 километров",
    description: "Проедьте 100 км суммарно",
    check: stats => stats.distance >= 100
  },
  {
    id: "500_km",
    icon: "🏅",
    title: "500 километров",
    description: "Проедьте 500 км суммарно",
    check: stats => stats.distance >= 500
  },
  {
    id: "1000_km",
    icon: "💎",
    title: "1000 километров",
    description: "Проедьте 1000 км суммарно",
    check: stats => stats.distance >= 1000
  },
  {
    id: "speed_30",
    icon: "⚡",
    title: "Скорость 30+",
    description: "Достигните 30 км/ч",
    check: stats => stats.maxSpeed >= 30
  },
  {
    id: "speed_40",
    icon: "🚀",
    title: "Скорость 40+",
    description: "Достигните 40 км/ч",
    check: stats => stats.maxSpeed >= 40
  },
  {
    id: "elevation_1000",
    icon: "⛰️",
    title: "Высота",
    description: "Наберите 1000 м высоты суммарно",
    check: stats => stats.elevation >= 1000
  }
];

function getVipAchievementStats() {
  ensureCompletedRideIds();

  const rides = JSON.parse(
    localStorage.getItem("velo_completed_rides") || "[]"
  );

  return {
    rides: rides.length,

    distance: rides.reduce(
      (sum, ride) => sum + Number(ride.distance || 0),
      0
    ),

    maxSpeed: rides.reduce(
      (max, ride) => Math.max(
        max,
        Number(ride.maxSpeed || 0)
      ),
      0
    ),

    elevation: rides.reduce(
      (sum, ride) => sum + Number(
        ride.elevation ||
        ride.elevationGain ||
        0
      ),
      0
    )
  };
}

function getUnlockedVipAchievements() {
  const stats = getVipAchievementStats();

  return VELO_VIP_ACHIEVEMENTS.filter(
    achievement => achievement.check(stats)
  );
}

function getVipAchievementProgress() {
  const unlocked = getUnlockedVipAchievements();

  return {
    total: VELO_VIP_ACHIEVEMENTS.length,
    unlocked: unlocked.length,
    percentage: Math.round(
      unlocked.length /
      VELO_VIP_ACHIEVEMENTS.length *
      100
    )
  };
}

window.VELO_VIP_ACHIEVEMENTS =
  VELO_VIP_ACHIEVEMENTS;

window.getVipAchievementStats =
  getVipAchievementStats;

window.getUnlockedVipAchievements =
  getUnlockedVipAchievements;

window.getVipAchievementProgress =
  getVipAchievementProgress;

console.log(
  "🏆 VIP Achievements 5.0:",
  getVipAchievementProgress()
);


/* =========================================================
   🏆🚴 VELO VIP ACHIEVEMENTS 5.1 — UI
   ========================================================= */

function renderVipAchievements() {
  const container =
    document.getElementById("profileAchievements");

  if (!container) return;

  const stats = getVipAchievementStats();
  const progress = getVipAchievementProgress();

  container.innerHTML = `
    <div class="vip-achievements-header">
      <div class="vip-achievements-title">
        🏆 Достижения
      </div>

      <div class="vip-achievements-progress">
        ${progress.unlocked}/${progress.total}
      </div>
    </div>

    <div class="vip-achievements-progress-bar">
      <span style="width:${progress.percentage}%"></span>
    </div>

    <div class="vip-achievements-grid">
      ${VELO_VIP_ACHIEVEMENTS.map(achievement => {
        const unlocked =
          achievement.check(stats);

        return `
          <div
            class="vip-achievement-card ${
              unlocked ? "unlocked" : "locked"
            }"
            data-achievement-id="${achievement.id}"
          >
            <div class="vip-achievement-icon">
              ${unlocked ? achievement.icon : "🔒"}
            </div>

            <div class="vip-achievement-name">
              ${achievement.title}
            </div>

            <div class="vip-achievement-description">
              ${achievement.description}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function ensureVipAchievementsUI() {
  let container =
    document.getElementById("profileAchievements");

  if (container) {
    renderVipAchievements();
    return;
  }

  const history =
    document.getElementById("profileHistory");

  if (!history) return;

  container =
    document.createElement("section");

  container.id =
    "profileAchievements";

  container.className =
    "vip-achievements";

  history.parentNode.insertBefore(
    container,
    history.nextSibling
  );

  renderVipAchievements();
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    setTimeout(
      ensureVipAchievementsUI,
      300
    );
  }
);

window.renderVipAchievements =
  renderVipAchievements;

window.ensureVipAchievementsUI =
  ensureVipAchievementsUI;


/* =========================================================
   🏆🚴 VELO VIP ACHIEVEMENTS 5.1 — UI
   ========================================================= */

function renderVipAchievements() {
  const container =
    document.getElementById("profileAchievements");

  if (!container) return;

  const stats = getVipAchievementStats();
  const progress = getVipAchievementProgress();

  container.innerHTML = `
    <div class="vip-achievements-header">
      <div class="vip-achievements-title">
        🏆 Достижения
      </div>

      <div class="vip-achievements-progress">
        ${progress.unlocked}/${progress.total}
      </div>
    </div>

    <div class="vip-achievements-progress-bar">
      <span style="width:${progress.percentage}%"></span>
    </div>

    <div class="vip-achievements-grid">
      ${VELO_VIP_ACHIEVEMENTS.map(achievement => {
        const unlocked =
          achievement.check(stats);

        return `
          <div
            class="vip-achievement-card ${
              unlocked ? "unlocked" : "locked"
            }"
            data-achievement-id="${achievement.id}"
          >
            <div class="vip-achievement-icon">
              ${unlocked ? achievement.icon : "🔒"}
            </div>

            <div class="vip-achievement-name">
              ${achievement.title}
            </div>

            <div class="vip-achievement-description">
              ${achievement.description}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function ensureVipAchievementsUI() {
  let container =
    document.getElementById("profileAchievements");

  if (container) {
    renderVipAchievements();
    return;
  }

  const history =
    document.getElementById("profileHistory");

  if (!history) return;

  container =
    document.createElement("section");

  container.id =
    "profileAchievements";

  container.className =
    "vip-achievements";

  history.parentNode.insertBefore(
    container,
    history.nextSibling
  );

  renderVipAchievements();
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    setTimeout(
      ensureVipAchievementsUI,
      300
    );
  }
);

window.renderVipAchievements =
  renderVipAchievements;

window.ensureVipAchievementsUI =
  ensureVipAchievementsUI;


/* =========================================================
   🏆🔥 VELO VIP ACHIEVEMENTS 5.2 — UNLOCK EFFECT
   ========================================================= */

function getVipUnlockedIds() {
  try {
    return JSON.parse(
      localStorage.getItem("velo_unlocked_achievements") || "[]"
    );
  } catch {
    return [];
  }
}

function saveVipUnlockedIds(ids) {
  localStorage.setItem(
    "velo_unlocked_achievements",
    JSON.stringify(ids)
  );
}

function checkVipNewAchievements() {
  const unlocked =
    getUnlockedVipAchievements();

  const currentIds =
    unlocked.map(item => item.id);

  const previousIds =
    getVipUnlockedIds();

  const newIds =
    currentIds.filter(
      id => !previousIds.includes(id)
    );

  saveVipUnlockedIds(currentIds);

  return newIds;
}

function playVipAchievementUnlock(achievementId) {
  const card = document.querySelector(
    `.vip-achievement-card[data-achievement-id="${CSS.escape(
      String(achievementId)
    )}"]`
  );

  if (!card) return;

  card.classList.remove(
    "vip-achievement-unlock"
  );

  void card.offsetWidth;

  card.classList.add(
    "vip-achievement-unlock"
  );

  setTimeout(() => {
    card.classList.remove(
      "vip-achievement-unlock"
    );
  }, 1300);
}

function playVipAchievementUnlockSequence(ids) {
  if (!Array.isArray(ids) || !ids.length) {
    return;
  }

  ids.forEach((id, index) => {
    setTimeout(() => {
      playVipAchievementUnlock(id);
    }, index * 350);
  });
}

function refreshVipAchievementsWithUnlockEffect() {
  const newIds =
    checkVipNewAchievements();

  renderVipAchievements();

  if (newIds.length) {
    requestAnimationFrame(() => {
      playVipAchievementUnlockSequence(
        newIds
      );
    });
  }
}

window.checkVipNewAchievements =
  checkVipNewAchievements;

window.refreshVipAchievementsWithUnlockEffect =
  refreshVipAchievementsWithUnlockEffect;

window.playVipAchievementUnlock =
  playVipAchievementUnlock;

/* Проверяем достижения после завершения поездки */
document.addEventListener("click", event => {
  const button =
    event.target.closest(".finish-ride-btn");

  if (!button) return;

  setTimeout(() => {
    ensureVipAchievementsUI();

    setTimeout(() => {
      refreshVipAchievementsWithUnlockEffect();
    }, 350);
  }, 1100);
});

/* Первичная синхронизация */
document.addEventListener(
  "DOMContentLoaded",
  () => {
    setTimeout(() => {
      const unlocked =
        getUnlockedVipAchievements();

      saveVipUnlockedIds(
        unlocked.map(item => item.id)
      );
    }, 700);
  }
);


/* =========================================================
   🏆✨ VELO VIP ACHIEVEMENTS 5.3 — UNLOCK TOAST
   ========================================================= */

function showVipAchievementToast(achievementId) {
  const achievement = VELO_VIP_ACHIEVEMENTS.find(
    item => String(item.id) === String(achievementId)
  );

  if (!achievement) return;

  let toast = document.getElementById("vipAchievementToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "vipAchievementToast";
    toast.className = "vip-achievement-toast";

    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="vip-achievement-toast-icon">
      ${achievement.icon}
    </div>

    <div class="vip-achievement-toast-content">
      <div class="vip-achievement-toast-label">
        НОВОЕ ДОСТИЖЕНИЕ
      </div>

      <div class="vip-achievement-toast-title">
        ${achievement.title}
      </div>

      <div class="vip-achievement-toast-description">
        ${achievement.description}
      </div>
    </div>
  `;

  toast.classList.remove("show");

  void toast.offsetWidth;

  toast.classList.add("show");

  clearTimeout(window.vipAchievementToastTimer);

  window.vipAchievementToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

function showVipAchievementToastSequence(ids) {
  if (!Array.isArray(ids) || !ids.length) return;

  ids.forEach((id, index) => {
    setTimeout(() => {
      showVipAchievementToast(id);
    }, index * 3400);
  });
}

/* Подключаем уведомление к существующему эффекту разблокировки */
const originalPlayVipAchievementUnlockSequence =
  window.playVipAchievementUnlockSequence;

window.playVipAchievementUnlockSequence = function(ids) {
  if (!Array.isArray(ids) || !ids.length) return;

  if (typeof originalPlayVipAchievementUnlockSequence === "function") {
    originalPlayVipAchievementUnlockSequence(ids);
  }

  setTimeout(() => {
    showVipAchievementToastSequence(ids);
  }, 250);
};

window.showVipAchievementToast =
  showVipAchievementToast;

window.showVipAchievementToastSequence =
  showVipAchievementToastSequence;

console.log("🏆 VIP Achievement Toast 5.3 готов.");



/* ===== VELO SOCIAL SEARCH ===== */

(() => {
  const usernameInput = document.getElementById("socialUsername");
  const searchButton = document.getElementById("socialSearchButton");
  const result = document.getElementById("socialSearchResult");

  if (!usernameInput || !searchButton || !result) {
    console.log("VELO SOCIAL: search elements not found");
    return;
  }

  const API_BASE = "https://paragraphs-determining-defeat-adventures.trycloudflare.com";

  async function searchUser() {
    const username = usernameInput.value.trim().replace(/^@/, "");

    if (!username) {
      result.innerHTML = "Введите username.";
      return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "Поиск...";
    result.innerHTML = "🔎 Ищем велосипедиста...";

    try {
      const response = await fetch(
        `${API_BASE}/api/users/by-username/${encodeURIComponent(username)}`
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        result.innerHTML = `
          <div class="social-result-empty">
            🚴 Велосипедист <b>@${escapeHtml(username)}</b> не найден.
          </div>
        `;
        return;
      }

      const user = data.user;

      result.innerHTML = `
        <div class="social-user-card">
          <div class="social-user-avatar">🚴</div>
          <div class="social-user-info">
            <strong>${escapeHtml(user.first_name || "Велосипедист")}</strong>
            <span>@${escapeHtml(user.username || username)}</span>
            <small>
              🚴 Создано поездок: ${Number(user.rides_created) || 0}
              · Участий: ${Number(user.rides_joined) || 0}
            </small>
          </div>
        </div>
      `;

    } catch (error) {
      console.error("VELO SOCIAL SEARCH ERROR:", error);

      result.innerHTML = `
        <div class="social-result-error">
          ⚠️ Не удалось подключиться к Social API.
        </div>
      `;
    } finally {
      searchButton.disabled = false;
      searchButton.textContent = "Найти";
    }
  }

  searchButton.addEventListener("click", searchUser);

  usernameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchUser();
    }
  });
})();


/* ===== VELO SOCIAL FRIENDS UI ===== */

(() => {
  const friendsBox = document.getElementById("socialFriends");
  const requestsBox = document.getElementById("socialRequests");
  const refreshFriends = document.getElementById("socialRefreshFriends");
  const refreshRequests = document.getElementById("socialRefreshRequests");

  const searchInput = document.getElementById("socialUsername");
  const searchButton = document.getElementById("socialSearchButton");
  const searchResult = document.getElementById("socialSearchResult");

  if (
    !friendsBox ||
    !requestsBox ||
    !refreshFriends ||
    !refreshRequests
  ) {
    console.log("VELO SOCIAL: friends UI elements not found");
    return;
  }

  const API_BASE = "https://paragraphs-determining-defeat-adventures.trycloudflare.com";

  /*
   * Тестовый пользователь.
   * Позже заменим на реальный ID авторизованного пользователя.
   */
  let CURRENT_USER_ID = null;

  async function resolveCurrentUser() {
    const username = (
      localStorage.getItem("velo_profile_username") || ""
    ).trim().replace(/^@/, "");

    if (!username) {
      console.log("VELO SOCIAL: profile username not set");
      return false;
    }

    try {
      const data = await api(
        `/api/users/by-username/${encodeURIComponent(username)}`
      );

      if (!data.user || !data.user.user_id) {
        console.log("VELO SOCIAL: user not found");
        return false;
      }

      CURRENT_USER_ID = Number(data.user.user_id);

      console.log(
        "VELO SOCIAL: current user resolved",
        username,
        CURRENT_USER_ID
      );

      return true;
    } catch (error) {
      console.error("VELO SOCIAL: resolve current user failed:", error);
      return false;
    }
  }

  async function api(path) {
    const response = await fetch(API_BASE + path);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "API error");
    }

    return data;
  }

  async function loadFriends() {
    friendsBox.innerHTML = "🔄 Загружаем друзей...";

    try {
      const data = await api(
        `/api/friends?user_id=${CURRENT_USER_ID}`
      );

      if (!data.friends || data.friends.length === 0) {
        friendsBox.innerHTML = `
          <div class="social-result-empty">
            👥 Пока нет друзей.
          </div>
        `;
        return;
      }

      friendsBox.innerHTML = data.friends.map(friend => `
        <div class="social-user-card">
          <div class="social-user-avatar">🚴</div>

          <div class="social-user-info">
            <strong>
              ${escapeHtml(friend.first_name || "Велосипедист")}
            </strong>

            <span>
              @${escapeHtml(friend.username || "")}
            </span>

            <small>
              🚴 Поездок: ${Number(friend.rides_created) || 0}
              · Участий: ${Number(friend.rides_joined) || 0}
            </small>
          </div>

          <div class="social-friend-status">
            ✓ Друг
          </div>
        </div>
      `).join("");

    } catch (error) {
      console.error("VELO SOCIAL FRIENDS ERROR:", error);

      friendsBox.innerHTML = `
        <div class="social-result-error">
          ⚠️ Не удалось загрузить друзей.
        </div>
      `;
    }
  }

  async function loadRequests() {
    requestsBox.innerHTML = "🔄 Загружаем заявки...";

    try {
      const data = await api(
        `/api/friends/requests?user_id=${CURRENT_USER_ID}`
      );

      if (!data.requests || data.requests.length === 0) {
        requestsBox.innerHTML = `
          <div class="social-result-empty">
            📨 Новых заявок нет.
          </div>
        `;
        return;
      }

      requestsBox.innerHTML = data.requests.map(request => `
        <div class="social-request-card">

          <div class="social-user-card">
            <div class="social-user-avatar">🚴</div>

            <div class="social-user-info">
              <strong>
                ${escapeHtml(request.first_name || "Велосипедист")}
              </strong>

              <span>
                @${escapeHtml(request.username || "")}
              </span>
            </div>
          </div>

          <div class="social-request-actions">
            <button
              type="button"
              class="social-accept-btn"
              data-friend-id="${request.user_id}"
            >
              ✓ Принять
            </button>

            <button
              type="button"
              class="social-reject-btn"
              data-friend-id="${request.user_id}"
            >
              ✕ Отклонить
            </button>
          </div>

        </div>
      `).join("");

      requestsBox.querySelectorAll(".social-accept-btn").forEach(button => {
        button.addEventListener("click", () => {
          respondToRequest(
            Number(button.dataset.friendId),
            "accept"
          );
        });
      });

      requestsBox.querySelectorAll(".social-reject-btn").forEach(button => {
        button.addEventListener("click", () => {
          respondToRequest(
            Number(button.dataset.friendId),
            "reject"
          );
        });
      });

    } catch (error) {
      console.error("VELO SOCIAL REQUESTS ERROR:", error);

      requestsBox.innerHTML = `
        <div class="social-result-error">
          ⚠️ Не удалось загрузить заявки.
        </div>
      `;
    }
  }

  async function respondToRequest(friendId, action) {
    try {
      await api(
        `/api/friends/respond?user_id=${CURRENT_USER_ID}` +
        `&friend_id=${friendId}` +
        `&action=${action}`
      );

      await loadRequests();
      await loadFriends();

    } catch (error) {
      console.error("VELO SOCIAL RESPOND ERROR:", error);

      alert("Не удалось обработать заявку.");
    }
  }

  async function addFriend(friendId, button) {
    button.disabled = true;
    button.textContent = "Отправляем...";

    try {
      await api(
        `/api/friends/request?user_id=${CURRENT_USER_ID}` +
        `&friend_id=${friendId}`
      );

      button.textContent = "✓ Заявка отправлена";

    } catch (error) {
      console.error("VELO SOCIAL REQUEST ERROR:", error);

      if (error.message === "already_exists") {
        button.textContent = "✓ Уже есть заявка";
      } else if (error.message === "cannot_add_self") {
        button.textContent = "Это ты";
      } else {
        button.disabled = false;
        button.textContent = "➕ Добавить в друзья";
        alert("Не удалось отправить заявку.");
      }
    }
  }

  /*
   * Перехватываем поиск пользователя и добавляем
   * кнопку дружбы в найденную карточку.
   */
  if (searchButton && searchInput && searchResult) {
    searchButton.addEventListener("click", async () => {
      setTimeout(async () => {
        const username = searchInput.value.trim().replace(/^@/, "");

        if (!username) return;

        try {
          const data = await api(
            `/api/users/by-username/${encodeURIComponent(username)}`
          );

          if (!data.user) return;

          const user = data.user;

          if (Number(user.user_id) === CURRENT_USER_ID) {
            searchResult.innerHTML += `
              <div class="social-friend-status">
                👤 Это твой профиль
              </div>
            `;
            return;
          }

          const statusData = await api(
            `/api/friends/status?user_id=${CURRENT_USER_ID}` +
            `&friend_id=${user.user_id}`
          );

          const friendship = statusData.friendship;

          let actionHTML = `
            <button
              type="button"
              class="social-add-friend-btn"
              id="socialAddFriendButton"
            >
              ➕ Добавить в друзья
            </button>
          `;

          if (friendship) {
            if (friendship.status === "accepted") {
              actionHTML = `
                <div class="social-friend-status">
                  ✓ Вы друзья
                </div>
              `;
            } else if (friendship.status === "pending") {
              actionHTML = `
                <div class="social-friend-status">
                  ⏳ Заявка уже отправлена
                </div>
              `;
            }
          }

          searchResult.innerHTML += `
            <div class="social-friend-action">
              ${actionHTML}
            </div>
          `;

          const addButton =
            document.getElementById("socialAddFriendButton");

          if (addButton) {
            addButton.addEventListener("click", () => {
              addFriend(user.user_id, addButton);
            });
          }

        } catch (error) {
          console.error("VELO SOCIAL FRIEND UI ERROR:", error);
        }
      }, 50);
    });
  }

  refreshFriends.addEventListener("click", async () => {
    if (await resolveCurrentUser()) {
      loadFriends();
    }
  });

  refreshRequests.addEventListener("click", async () => {
    if (await resolveCurrentUser()) {
      loadRequests();
    }
  });

  (async () => {
    const resolved = await resolveCurrentUser();

    if (resolved) {
      await loadFriends();
      await loadRequests();
    } else {
      friendsBox.innerHTML = `
        <div class="social-result-empty">
          👤 Укажи Username в профиле VELO.
        </div>
      `;

      requestsBox.innerHTML = `
        <div class="social-result-empty">
          👤 Укажи Username в профиле VELO.
        </div>
      `;
    }
  })();

})();

/* ===== VELO PWA SERVICE WORKER ===== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(() => console.log("VELO PWA: Service Worker registered"))
      .catch(error => console.error("VELO PWA: Service Worker failed:", error));
  });
}

/* ===== VELO SMART APP INSTALL ===== */
(() => {
  let veloInstallPrompt = null;

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    veloInstallPrompt = event;

    const banner = document.getElementById("installBanner");
    if (banner && !isStandalone) {
      banner.style.display = "block";
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("installBanner");
    const installBtn = document.getElementById("installBtn");
    const iosHelp = document.getElementById("iosInstallHelp");
    const iosCloseBtn = document.getElementById("iosCloseBtn");

    if (!banner || !installBtn || isStandalone) return;

    if (isIOS) {
      banner.style.display = "block";
    }

    installBtn.addEventListener("click", async () => {
      if (isIOS) {
        if (iosHelp) iosHelp.style.display = "block";
        return;
      }

      if (!veloInstallPrompt) return;

      veloInstallPrompt.prompt();
      await veloInstallPrompt.userChoice;

      veloInstallPrompt = null;
      banner.style.display = "none";
    });

    if (iosCloseBtn) {
      iosCloseBtn.addEventListener("click", () => {
        if (iosHelp) iosHelp.style.display = "none";
      });
    }
  });

  window.addEventListener("appinstalled", () => {
    const banner = document.getElementById("installBanner");
    if (banner) banner.style.display = "none";
    veloInstallPrompt = null;
  });
})();

/* ===== VELO Wallet & Premium ===== */

const premiumStatusEl = document.getElementById("premiumStatus");
const premiumBadgeEl = document.getElementById("premiumBadge");
const premiumButtonEl = document.getElementById("premiumButton");

const walletBalanceEl = document.getElementById("walletBalance");
const walletTodayEl = document.getElementById("walletToday");
const walletMonthEl = document.getElementById("walletMonth");
const walletTotalEl = document.getElementById("walletTotal");

const donationInput = document.getElementById("donationAmount");
const donateButton = document.getElementById("donateButton");

let wallet = JSON.parse(localStorage.getItem("velo_wallet") || '{"balance":0,"today":0,"month":0,"total":0}');
let premium = localStorage.getItem("velo_premium") || "FREE";

function updateWalletUI(){
  walletBalanceEl.textContent = wallet.balance + " ₾";
  walletTodayEl.textContent = wallet.today + " ₾";
  walletMonthEl.textContent = wallet.month + " ₾";
  walletTotalEl.textContent = wallet.total + " ₾";

  if(premium === "PREMIUM"){
    premiumStatusEl.textContent = "🟢 Premium активен";
    premiumBadgeEl.textContent = "PREMIUM";
  }else{
    premiumStatusEl.textContent = "🔒 Premium не активен";
    premiumBadgeEl.textContent = "FREE";
  }
}

premiumButtonEl?.addEventListener("click", ()=>{
  alert("Экран покупки Premium подключим на следующем этапе.");
});

donateButton?.addEventListener("click", ()=>{
  const amount = Number(donationInput.value);

  if(!amount || amount <= 0){
    alert("Введите сумму.");
    return;
  }

  wallet.balance += amount;
  wallet.today += amount;
  wallet.month += amount;
  wallet.total += amount;

  localStorage.setItem("velo_wallet", JSON.stringify(wallet));

  donationInput.value = "";
  updateWalletUI();

  alert("❤️ Спасибо за поддержку VELO!");
});

updateWalletUI();

