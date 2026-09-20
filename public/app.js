const state = {
  token: sessionStorage.getItem("token"),
  user: JSON.parse(sessionStorage.getItem("user") || "null"),
};

const loginPanel = document.querySelector("#loginPanel");
const appPanel = document.querySelector("#appPanel");
const logoutButton = document.querySelector("#logoutButton");
const userSelect = document.querySelector("#userSelect");
const movieList = document.querySelector("#movieList");
const appMessage = document.querySelector("#appMessage");

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong");
  return body;
}

function decodeToken(token) {
  return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
}

function showSession() {
  const signedIn = Boolean(state.token && state.user);
  loginPanel.hidden = signedIn;
  appPanel.hidden = !signedIn;
  logoutButton.hidden = !signedIn;
  if (signedIn) {
    document.querySelector("#sessionLabel").textContent = `${state.user.username} · ${state.user.role}`;
    userSelect.value = String(state.user.id);
    loadWatchlist();
  }
}

function renderMovies(movies) {
  if (!movies.length) {
    movieList.innerHTML = '<p class="empty">Nothing here yet. Add the first movie.</p>';
    return;
  }

  movieList.innerHTML = movies.map((movie) => `
    <article class="card movie ${movie.watched ? "watched" : ""}">
      <h3>${escapeHtml(movie.title)}</h3>
      <p>${escapeHtml(movie.genre || "Genre not set")}</p>
      <div class="movie-actions">
        <button class="button button-quiet" data-action="toggle" data-id="${movie.id}" data-watched="${movie.watched}">
          ${movie.watched ? "Mark unwatched" : "Mark watched"}
        </button>
        <button class="button button-danger" data-action="delete" data-id="${movie.id}">Delete</button>
      </div>
    </article>
  `).join("");
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

async function loadWatchlist() {
  appMessage.textContent = "Loading…";
  try {
    const { watchlist } = await api(`/api/watchlist/${userSelect.value}`);
    renderMovies(watchlist);
    document.querySelector("#watchlistTitle").textContent = `${userSelect.selectedOptions[0].text}'s watchlist`;
    appMessage.textContent = "";
  } catch (error) {
    appMessage.textContent = error.message;
    appMessage.className = "message error";
  }
}

document.querySelector("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.querySelector("#loginMessage");
  const form = new FormData(event.currentTarget);
  try {
    const { token } = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(form)),
    });
    state.token = token;
    state.user = decodeToken(token);
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(state.user));
    message.textContent = "";
    showSession();
  } catch (error) {
    message.textContent = error.message;
    message.className = "message error";
  }
});

document.querySelector("#movieForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const movieForm = event.currentTarget;
  const submitButton = movieForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  const form = new FormData(movieForm);

  submitButton.disabled = true;
  submitButton.textContent = "Adding…";
  movieForm.setAttribute("aria-busy", "true");
  appMessage.textContent = "Adding movie…";
  appMessage.className = "message";

  try {
    await api(`/api/watchlist/${userSelect.value}/movies`, {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(form)),
    });

    movieForm.reset();
    await loadWatchlist();
    appMessage.textContent = "Movie added.";
    appMessage.className = "message";
  } catch (error) {
    appMessage.textContent = error.message;
    appMessage.className = "message error";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
    movieForm.removeAttribute("aria-busy");
  }
});

movieList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const path = `/api/watchlist/${userSelect.value}/movies/${button.dataset.id}`;
  try {
    if (button.dataset.action === "delete") {
      await api(path, { method: "DELETE" });
    } else {
      await api(path, {
        method: "PUT",
        body: JSON.stringify({ watched: button.dataset.watched !== "true" }),
      });
    }
    await loadWatchlist();
  } catch (error) {
    appMessage.textContent = error.message;
    appMessage.className = "message error";
  }
});

userSelect.addEventListener("change", loadWatchlist);
document.querySelector("#refreshButton").addEventListener("click", loadWatchlist);
logoutButton.addEventListener("click", () => {
  sessionStorage.clear();
  state.token = null;
  state.user = null;
  showSession();
});

showSession();
