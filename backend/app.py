from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests

app = Flask(__name__)
CORS(app)

SPOON_API_KEY = os.getenv("SPOONACULAR_KEY", "")

@app.get("/")
def home():
    return jsonify({"status": "ok", "message": "Recipe API is running"})

@app.post("/search")
def search():
    if not SPOON_API_KEY:
        return jsonify({"error": "Missing Spoonacular API key."}), 500

    data = request.get_json(silent=True) or {}
    ingredients_raw = data.get("ingredients", "").strip()
    provided = [item.strip() for item in ingredients_raw.split(",") if item.strip()]

    if not provided:
        return jsonify({"provided": [], "results": []})

    try:
        search_response = requests.get(
            "https://api.spoonacular.com/recipes/findByIngredients",
            params={
                "ingredients": ",".join(provided),
                "number": 8,
                "ranking": 1,
                "ignorePantry": True,
                "apiKey": SPOON_API_KEY
            },
            timeout=20
        )
        search_response.raise_for_status()
        recipes = search_response.json()
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to fetch recipes: {str(e)}"}), 502

    results = []

    for recipe in recipes:
        recipe_id = recipe.get("id")
        if not recipe_id:
            continue

        try:
            info_response = requests.get(
                f"https://api.spoonacular.com/recipes/{recipe_id}/information",
                params={"apiKey": SPOON_API_KEY, "includeNutrition": True},
                timeout=20
            )
            info_response.raise_for_status()
            info = info_response.json()

            calories = "0 kcal"
            nutrients = info.get("nutrition", {}).get("nutrients", [])
            for nutrient in nutrients:
                if nutrient.get("name") == "Calories":
                    calories = f"{round(nutrient.get('amount', 0))} {nutrient.get('unit', 'kcal')}"
                    break

            results.append({
                "id": recipe_id,
                "title": recipe.get("title", "Untitled Recipe"),
                "image": recipe.get("image"),
                "usedIngredients": [i.get("name", "") for i in recipe.get("usedIngredients", [])],
                "missedIngredients": [i.get("name", "") for i in recipe.get("missedIngredients", [])],
                "instructions": info.get("instructions") or "No instructions available.",
                "sourceUrl": info.get("sourceUrl") or "",
                "calories": calories
            })
        except requests.RequestException:
            continue

    return jsonify({"provided": provided, "results": results})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)