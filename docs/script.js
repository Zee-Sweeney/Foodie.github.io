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

function loadLog() {
  const raw = localStorage.getItem(todayKey());
  return raw ? JSON.parse(raw) : [];
}

function saveLog(entries) {
  localStorage.setItem(todayKey(), JSON.stringify(entries));
  saveTodayToHistory();
}

function loadHistory() {
  const raw = localStorage.getItem(historyKey());
  return raw ? JSON.parse(raw) : {};
}

function saveHistory(history) {
  localStorage.setItem(historyKey(), JSON.stringify(history));
}

function loadGoal() {
  return localStorage.getItem(goalKey());
}

function saveGoal(goal) {
  localStorage.setItem(goalKey(), String(goal));
}

function loadProfile() {
  const raw = localStorage.getItem(profileKey());
  return raw ? JSON.parse(raw) : { name: "" };
}

function saveProfile(profile) {
  localStorage.setItem(profileKey(), JSON.stringify(profile));
}

function loadSavedRecipes() {
  const raw = localStorage.getItem(savedRecipesKey());
  return raw ? JSON.parse(raw) : [];
}

function saveSavedRecipes(recipes) {
  localStorage.setItem(savedRecipesKey(), JSON.stringify(recipes));
}

function loadIngredients() {
  const raw = localStorage.getItem(ingredientsKey());
  return raw ? JSON.parse(raw) : [];
}

function saveIngredients(ingredients) {
  localStorage.setItem(ingredientsKey(), JSON.stringify(ingredients));
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

function renderQuickTracker() {
  const totalEl = document.getElementById("todayCalories");
  const goalEl = document.getElementById("todayGoal");
  const statusEl = document.getElementById("todayStatus");
  const listEl = document.getElementById("todayLogEntries");

  if (!totalEl || !goalEl || !statusEl || !listEl) {
    return;
  }

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
      <button class="delete-btn" data-index="${index}">Remove</button>
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

  if (!totalEl || !goalDisplay || !goalStatus || !logEntries) {
    return;
  }

  const entries = loadLog();
  const total = entries.reduce((sum, item) => sum + caloriesToNumber(item.calories), 0);
  const goal = Number(loadGoal() || 0);

  totalEl.textContent = total;
  goalDisplay.textContent = goal || "Not set";

  const status = getGoalStatus(total, goal);
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
        <button class="delete-btn" data-index="${index}">Remove</button>
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
  if (!historyList) {
    return;
  }

  const history = loadHistory();
  historyList.innerHTML = "";

  const items = Object.values(history).sort((a, b) => b.date.localeCompare(a.date));

  if (!items.length) {
    historyList.innerHTML = "<p>No history yet.</p>";
    return;
  }

  items.forEach(item => {
    const status = getGoalStatus(item.total, item.goal);
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <span>
        <strong>${escapeHtml(item.date)}</strong> —
        ${item.total} calories |
        Goal: ${item.goal || "Not set"} |
        <span class="${status.className}">${escapeHtml(status.text)}</span>
      </span>
    `;
    historyList.appendChild(div);
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

  const totalSavedCalories = savedRecipes.reduce((sum, recipe) => sum + caloriesToNumber(recipe.calories), 0);
  savedRecipeCalories.textContent = totalSavedCalories;

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
      <button class="delete-btn" data-index="${index}">Remove Saved Recipe</button>
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

function renderIngredients() {
  const ingredientChips = document.getElementById("ingredientChips");
  if (!ingredientChips) {
    return;
  }

  const ingredients = loadIngredients();
  ingredientChips.innerHTML = "";

  if (!ingredients.length) {
    ingredientChips.innerHTML = "<p>No ingredients added yet.</p>";
    return;
  }

  ingredients.forEach((ingredient, index) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `
      <span>${escapeHtml(ingredient)}</span>
      <button class="remove-chip-btn" data-index="${index}">×</button>
    `;
    ingredientChips.appendChild(chip);
  });

  ingredientChips.querySelectorAll(".remove-chip-btn").forEach(button => {
    button.addEventListener("click", () => {
      const ingredients = loadIngredients();
      ingredients.splice(Number(button.dataset.index), 1);
      saveIngredients(ingredients);
      renderIngredients();
    });
  });
}

function addIngredient() {
  const input = document.getElementById("ingredientInput");
  const message = document.getElementById("ingredientMessage");

  if (!input || !message) {
    return;
  }

  const value = input.value.trim().toLowerCase();
  if (!value) {
    message.textContent = "Enter an ingredient first.";
    return;
  }

  const ingredients = loadIngredients();
  if (ingredients.includes(value)) {
    message.textContent = "That ingredient is already added.";
    input.value = "";
    return;
  }

  ingredients.push(value);
  saveIngredients(ingredients);
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
  if (results) results.innerHTML = "";
  if (providedTags) providedTags.innerHTML = "";
  if (message) message.textContent = "";
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

  if (alreadySaved) {
    return;
  }

  savedRecipes.unshift(recipe);
  saveSavedRecipes(savedRecipes);
  renderProfile();
}

async function searchRecipes() {
  const ingredients = loadIngredients();
  const message = document.getElementById("message");
  const results = document.getElementById("results");
  const providedTags = document.getElementById("providedTags");

  if (!message || !results || !providedTags) {
    return;
  }

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
          <button class="add-btn">Add to daily tracker</button>
          <button class="secondary-btn save-recipe-btn">Save to profile</button>
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

function wirePageEvents() {
  const addIngredientBtn = document.getElementById("addIngredientBtn");
  const clearIngredientsBtn = document.getElementById("clearIngredientsBtn");
  const ingredientInput = document.getElementById("ingredientInput");
  const searchBtn = document.getElementById("searchBtn");
  const clearLogBtn = document.getElementById("clearLogBtn");
  const saveGoalBtn = document.getElementById("saveGoalBtn");
  const saveProfileBtn = document.getElementById("saveProfileBtn");

  if (addIngredientBtn) {
    addIngredientBtn.addEventListener("click", addIngredient);
  }

  if (clearIngredientsBtn) {
    clearIngredientsBtn.addEventListener("click", clearIngredients);
  }

  if (ingredientInput) {
    ingredientInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addIngredient();
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

window.addEventListener("load", () => {
  const goalInput = document.getElementById("goalInput");
  const goal = loadGoal();
  if (goalInput && goal) {
    goalInput.value = goal;
  }

  wirePageEvents();
  renderIngredients();
  renderQuickTracker();
  renderTrackerPage();
  renderHistory();
  renderProfile();
});