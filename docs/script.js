const API_BASE = "https://recipe-finder-api-qz2y.onrender.com";

function todayKey() {
  const now = new Date();
  return `calorie-log-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function historyKey() {
  return "calorie-log-history";
}

function goalKey() {
  return "daily-calorie-goal";
}

function profileKey() {
  return "user-profile";
}

function savedRecipesKey() {
  return "saved-recipes";
}

function ingredientsKey() {
  return "recipe-search-ingredients";
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadLog() {
  return loadJson(todayKey(), []);
}

function saveLog(entries) {
  saveJson(todayKey(), entries);
  saveTodayToHistory();
}

function loadHistory() {
  return loadJson(historyKey(), {});
}

function saveHistory(history) {
  saveJson(historyKey(), history);
}

function loadGoal() {
  return localStorage.getItem(goalKey());
}

function saveGoal(goal) {
  localStorage.setItem(goalKey(), String(goal));
}

function loadProfile() {
  return loadJson(profileKey(), { name: "" });
}

function saveProfile(profile) {
  saveJson(profileKey(), profile);
}

function loadSavedRecipes() {
  return loadJson(savedRecipesKey(), []);
}

function saveSavedRecipes(recipes) {
  saveJson(savedRecipesKey(), recipes);
}

function loadIngredients() {
  return loadJson(ingredientsKey(), []);
}

function saveIngredients(ingredients) {
  saveJson(ingredientsKey(), ingredients);
}

function caloriesToNumber(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function getGoalStatus(total, goal) {
  if (!goal) {
    return { text: "No goal set", className: "" };
  }
  if (total > goal) {
    return { text: `Above goal by ${total - goal} calories`, className: "status-above" };
  }
  if (total < goal) {
    return { text: `Below goal by ${goal - total} calories`, className: "status-below" };
  }
  return { text: "Met goal exactly", className: "status-equal" };
}

function saveTodayToHistory() {
  const entries = loadLog();
  const total = entries.reduce((sum, item) => sum + caloriesToNumber(item.calories), 0);
  const goal = Number(loadGoal() || 0);

  const history = loadHistory();
  history[todayKey()] = {
    date: todayKey().replace("calorie-log-", ""),
    total,
    goal
  };
  saveHistory(history);
}

function renderIngredients() {
  const chipsEl = document.getElementById("ingredientChips");
  if (!chipsEl) return;

  const ingredients = loadIngredients();
  chipsEl.innerHTML = "";

  if (!ingredients.length) {
    chipsEl.innerHTML = "<p>No ingredients added yet.</p>";
    return;
  }

  ingredients.forEach((ingredient, index) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `
      <span>${escapeHtml(ingredient)}</span>
      <button type="button" class="remove-chip-btn" data-index="${index}">×</button>
    `;
    chipsEl.appendChild(chip);
  });

  chipsEl.querySelectorAll(".remove-chip-btn").forEach(button => {
    button.addEventListener("click", () => {
      const ingredients = loadIngredients();
      ingredients.splice(Number(button.dataset.index), 1);
      saveIngredients(ingredients);
      renderIngredients();
    });
  });
}

function addIngredientsFromInput() {
  const input = document.getElementById("ingredientsInput");
  const message = document.getElementById("ingredientMessage");

  if (!input || !message) return;

  const raw = input.value.trim();
  if (!raw) {
    message.textContent = "Enter at least one ingredient.";
    return;
  }

  const newItems = raw
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  if (!newItems.length) {
    message.textContent = "Enter at least one ingredient.";
    return;
  }

  const current = loadIngredients();
  const merged = [...current];

  newItems.forEach(item => {
    if (!merged.includes(item)) {
      merged.push(item);
    }
  });

  saveIngredients(merged);
  input.value = "";
  message.textContent = "";
  renderIngredients();
}

function clearIngredients() {
  saveIngredients([]);
  renderIngredients();

  const results = document.getElementById("results");
  const providedTags = document.getElementById("providedTags");
  const message = document.getElementById("message");
  const ingredientMessage = document.getElementById("ingredientMessage");

  if (results) results.innerHTML = "";
  if (providedTags) providedTags.innerHTML = "";
  if (message) message.textContent = "";
  if (ingredientMessage) ingredientMessage.textContent = "";
}

function renderQuickTracker() {
  const totalEl = document.getElementById("todayCalories");
  const goalEl = document.getElementById("todayGoal");
  const statusEl = document.getElementById("todayStatus");
  const listEl = document.getElementById("todayLogEntries");

  if (!totalEl || !goalEl || !statusEl || !listEl) return;

  const entries = loadLog();
  const total = entries.reduce((sum, item) => sum + caloriesToNumber(item.calories), 0);
  const goal = Number(loadGoal() || 0);
  const status = getGoalStatus(total, goal);

  totalEl.textContent = total;
  goalEl.textContent = goal || "Not set";
  statusEl.textContent = status.text;
  statusEl.className = status.className;

  listEl.innerHTML = "";

  if (!entries.length) {
    listEl.innerHTML = "<li>No recipes logged yet today.</li>";
    return;
  }

  entries.slice(0, 5).forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "log-item";
    li.innerHTML = `
      <span>${escapeHtml(entry.title)} — ${escapeHtml(entry.calories)}</span>
      <button type="button" class="delete-btn" data-index="${index}">Remove</button>
    `;
    listEl.appendChild(li);
  });

  listEl.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", () => {
      const entries = loadLog();
      entries.splice(Number(button.dataset.index), 1);
      saveLog(entries);
      renderQuickTracker();
    });
  });
}

function renderTrackerPage() {
  const totalEl = document.getElementById("totalCalories");
  const goalDisplay = document.getElementById("goalDisplay");
  const goalStatus = document.getElementById("goalStatus");
  const logEntries = document.getElementById("logEntries");

  if (!totalEl || !goalDisplay || !goalStatus || !logEntries) return;

  const entries = loadLog();
  const total = entries.reduce((sum, item) => sum + caloriesToNumber(item.calories), 0);
  const goal = Number(loadGoal() || 0);
  const status = getGoalStatus(total, goal);

  totalEl.textContent = total;
  goalDisplay.textContent = goal || "Not set";
  goalStatus.textContent = status.text;
  goalStatus.className = status.className;

  logEntries.innerHTML = "";

  if (!entries.length) {
    logEntries.innerHTML = "<li>No recipes logged yet today.</li>";
  } else {
    entries.forEach((entry, index) => {
      const li = document.createElement("li");
      li.className = "log-item";
      li.innerHTML = `
        <span>${escapeHtml(entry.title)} — ${escapeHtml(entry.calories)}</span>
        <button type="button" class="delete-btn" data-index="${index}">Remove</button>
      `;
      logEntries.appendChild(li);
    });

    logEntries.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", () => {
        const entries = loadLog();
        entries.splice(Number(button.dataset.index), 1);
        saveLog(entries);
        renderTrackerPage();
        renderHistory();
      });
    });
  }

  saveTodayToHistory();
}

function renderHistory() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  const history = loadHistory();
  const items = Object.values(history).sort((a, b) => b.date.localeCompare(a.date));

  historyList.innerHTML = "";

  if (!items.length) {
    historyList.innerHTML = "<p>No history yet.</p>";
    return;
  }

  items.forEach(item => {
    const status = getGoalStatus(item.total, item.goal);
    const row = document.createElement("div");
    row.className = "history-item";
    row.innerHTML = `
      <span>
        <strong>${escapeHtml(item.date)}</strong> —
        ${item.total} calories |
        Goal: ${item.goal || "Not set"} |
        <span class="${status.className}">${escapeHtml(status.text)}</span>
      </span>
    `;
    historyList.appendChild(row);
  });
}

function renderProfile() {
  const profileNameDisplay = document.getElementById("profileNameDisplay");
  const profileNameInput = document.getElementById("profileName");
  const savedRecipeCount = document.getElementById("savedRecipeCount");
  const savedRecipeCalories = document.getElementById("savedRecipeCalories");
  const savedRecipesList = document.getElementById("savedRecipesList");

  if (!profileNameDisplay || !profileNameInput || !savedRecipeCount || !savedRecipeCalories || !savedRecipesList) {
    return;
  }

  const profile = loadProfile();
  const savedRecipes = loadSavedRecipes();

  profileNameDisplay.textContent = profile.name || "Not set";
  profileNameInput.value = profile.name || "";
  savedRecipeCount.textContent = savedRecipes.length;
  savedRecipeCalories.textContent = savedRecipes.reduce((sum, recipe) => sum + caloriesToNumber(recipe.calories), 0);

  savedRecipesList.innerHTML = "";

  if (!savedRecipes.length) {
    savedRecipesList.innerHTML = "<p>No saved recipes yet.</p>";
    return;
  }

  savedRecipes.forEach((recipe, index) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <h3>${escapeHtml(recipe.title)}</h3>
      <div class="recipe-meta">${escapeHtml(recipe.calories)}</div>
      ${recipe.image ? `<img src="${recipe.image}" alt="${escapeHtml(recipe.title)}">` : ""}
      <p><strong>Used ingredients:</strong> ${(recipe.usedIngredients || []).map(escapeHtml).join(", ") || "None"}</p>
      <p><strong>Missing ingredients:</strong> ${(recipe.missedIngredients || []).map(escapeHtml).join(", ") || "None"}</p>
      <button type="button" class="delete-btn" data-index="${index}">Remove Saved Recipe</button>
    `;
    savedRecipesList.appendChild(card);
  });

  savedRecipesList.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", () => {
      const savedRecipes = loadSavedRecipes();
      savedRecipes.splice(Number(button.dataset.index), 1);
      saveSavedRecipes(savedRecipes);
      renderProfile();
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
  renderQuickTracker();
  renderTrackerPage();
  renderHistory();
}

function saveRecipeToProfile(recipe) {
  const savedRecipes = loadSavedRecipes();
  const alreadySaved = savedRecipes.some(r => String(r.id) === String(recipe.id));

  if (alreadySaved) return;

  savedRecipes.unshift(recipe);
  saveSavedRecipes(savedRecipes);
  renderProfile();
}

async function searchRecipes() {
  const ingredients = loadIngredients();
  const message = document.getElementById("message");
  const results = document.getElementById("results");
  const providedTags = document.getElementById("providedTags");

  if (!message || !results || !providedTags) return;

  message.textContent = "";
  results.innerHTML = "";

  if (!ingredients.length) {
    message.textContent = "Please add at least one ingredient.";
    return;
  }

  message.textContent = "Searching...";

  try {
    const response = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ingredients: ingredients.join(", ") })
    });

    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.error || "Something went wrong.";
      return;
    }

    message.textContent = "";

    providedTags.innerHTML = data.provided
      .map(item => `<span class="tag">${escapeHtml(item)}</span>`)
      .join("");

    if (!data.results.length) {
      results.innerHTML = "<p>No recipes found.</p>";
      return;
    }

    data.results.forEach(recipe => {
      const used = recipe.usedIngredients.length
        ? recipe.usedIngredients.map(escapeHtml).join(", ")
        : "None";

      const missed = recipe.missedIngredients.length
        ? recipe.missedIngredients.map(escapeHtml).join(", ")
        : "None";

      const safeTitle = escapeHtml(recipe.title);

      const card = document.createElement("div");
      card.className = "recipe-card";
      card.innerHTML = `
        <h3>${safeTitle}</h3>
        <div class="recipe-meta">${escapeHtml(recipe.calories)}</div>
        ${recipe.image ? `<img src="${recipe.image}" alt="${safeTitle}">` : ""}
        <p><strong>Used ingredients:</strong> ${used}</p>
        <p><strong>Missing ingredients:</strong> ${missed}</p>
        <details>
          <summary>Instructions</summary>
          <div class="instructions">${recipe.instructions || "No instructions available."}</div>
        </details>
        ${recipe.sourceUrl ? `<a class="source-link" href="${recipe.sourceUrl}" target="_blank" rel="noopener noreferrer">Open full recipe</a>` : ""}
        <div style="margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap;">
          <button type="button" class="add-btn">Add to daily tracker</button>
          <button type="button" class="secondary-btn save-recipe-btn">Save to profile</button>
        </div>
      `;

      card.querySelector(".add-btn").addEventListener("click", () => addToLog(recipe));
      card.querySelector(".save-recipe-btn").addEventListener("click", () => saveRecipeToProfile(recipe));
      results.appendChild(card);
    });
  } catch (error) {
    message.textContent = "Could not search recipes right now.";
  }
}

function wireEvents() {
  const addIngredientsBtn = document.getElementById("addIngredientsBtn");
  const clearIngredientsBtn = document.getElementById("clearIngredientsBtn");
  const ingredientsInput = document.getElementById("ingredientsInput");
  const searchBtn = document.getElementById("searchBtn");
  const clearLogBtn = document.getElementById("clearLogBtn");
  const saveGoalBtn = document.getElementById("saveGoalBtn");
  const saveProfileBtn = document.getElementById("saveProfileBtn");

  if (addIngredientsBtn) {
    addIngredientsBtn.addEventListener("click", addIngredientsFromInput);
  }

  if (clearIngredientsBtn) {
    clearIngredientsBtn.addEventListener("click", clearIngredients);
  }

  if (ingredientsInput) {
    ingredientsInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addIngredientsFromInput();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", searchRecipes);
  }

  if (clearLogBtn) {
    clearLogBtn.addEventListener("click", () => {
      localStorage.removeItem(todayKey());
      saveTodayToHistory();
      renderQuickTracker();
      renderTrackerPage();
      renderHistory();
    });
  }

  if (saveGoalBtn) {
    saveGoalBtn.addEventListener("click", () => {
      const input = document.getElementById("goalInput");
      const goalMessage = document.getElementById("goalMessage");
      const value = Number(input.value);

      if (!value || value < 1000 || value > 10000) {
        goalMessage.textContent = "Goal must be between 1000 and 10000 calories.";
        return;
      }

      saveGoal(value);
      goalMessage.textContent = "Goal saved.";
      renderQuickTracker();
      renderTrackerPage();
      renderHistory();
    });
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", () => {
      const name = document.getElementById("profileName").value.trim();
      saveProfile({ name });
      renderProfile();
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const goalInput = document.getElementById("goalInput");
  const goal = loadGoal();
  if (goalInput && goal) {
    goalInput.value = goal;
  }

  wireEvents();
  renderIngredients();
  renderQuickTracker();
  renderTrackerPage();
  renderHistory();
  renderProfile();
});