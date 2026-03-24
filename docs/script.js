const API_BASE = "https://YOUR-RENDER-URL.onrender.com";

function todayKey() {
  const now = new Date();
  return `calorie-log-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function loadLog() {
  return JSON.parse(localStorage.getItem(todayKey()) || "[]");
}

function saveLog(entries) {
  localStorage.setItem(todayKey(), JSON.stringify(entries));
}

function caloriesToNumber(value) {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function renderLog() {
  const entries = loadLog();
  const total = entries.reduce((sum, item) => sum + caloriesToNumber(item.calories), 0);
  document.getElementById("totalCalories").textContent = total;

  const logEntries = document.getElementById("logEntries");
  logEntries.innerHTML = "";

  if (!entries.length) {
    logEntries.innerHTML = "<li>No recipes logged yet today.</li>";
    return;
  }

  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${escapeHtml(entry.title)} — ${escapeHtml(entry.calories)}</span>
      <button data-index="${index}" class="remove-btn">Remove</button>
    `;
    logEntries.appendChild(li);
  });

  document.querySelectorAll(".remove-btn").forEach(button => {
    button.addEventListener("click", () => {
      const entries = loadLog();
      entries.splice(Number(button.dataset.index), 1);
      saveLog(entries);
      renderLog();
    });
  });
}

function addToLog(recipe) {
  const entries = loadLog();
  entries.unshift({
    id: recipe.id,
    title: recipe.title,
    calories: recipe.calories
  });
  saveLog(entries);
  renderLog();
}

document.getElementById("clearLogBtn").addEventListener("click", () => {
  localStorage.removeItem(todayKey());
  renderLog();
});

document.getElementById("searchBtn").addEventListener("click", async () => {
  const ingredients = document.getElementById("ingredients").value.trim();
  const message = document.getElementById("message");
  const providedTags = document.getElementById("providedTags");
  const results = document.getElementById("results");

  message.textContent = "";
  providedTags.innerHTML = "";
  results.innerHTML = "";

  if (!ingredients) {
    message.textContent = "Enter at least one ingredient.";
    return;
  }

  message.textContent = "Searching...";

  try {
    const response = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ingredients })
    });

    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.error || "Request failed.";
      return;
    }

    message.textContent = "";

    providedTags.innerHTML = data.provided
      .map(item => `<span>${escapeHtml(item)}</span>`)
      .join(" ");

    if (!data.results.length) {
      results.innerHTML = "<p>No recipes found.</p>";
      return;
    }

    data.results.forEach(recipe => {
      const card = document.createElement("div");
      card.innerHTML = `
        <h3>${escapeHtml(recipe.title)}</h3>
        <p>${escapeHtml(recipe.calories)}</p>
        ${recipe.image ? `<img src="${recipe.image}" alt="${escapeHtml(recipe.title)}" width="200">` : ""}
        <p><strong>Used:</strong> ${recipe.usedIngredients.map(escapeHtml).join(", ") || "None"}</p>
        <p><strong>Missing:</strong> ${recipe.missedIngredients.map(escapeHtml).join(", ") || "None"}</p>
        <details>
          <summary>Instructions</summary>
          <div>${recipe.instructions || "No instructions available."}</div>
        </details>
        ${recipe.sourceUrl ? `<p><a href="${recipe.sourceUrl}" target="_blank" rel="noopener noreferrer">Open full recipe</a></p>` : ""}
        <button class="add-btn">Add to calorie log</button>
      `;

      card.querySelector(".add-btn").addEventListener("click", () => addToLog(recipe));
      results.appendChild(card);
    });
  } catch {
    message.textContent = "Could not reach the backend.";
  }
});

window.addEventListener("load", renderLog);