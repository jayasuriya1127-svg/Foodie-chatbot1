import os

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai


# =========================================================
# PATH CONFIGURATION
# =========================================================

# backend/app.py
# frontend/index.html
FRONTEND_FOLDER = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../frontend")
)


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# =========================================================
# APP CONFIGURATION
# =========================================================

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": "*"
    }
})


# =========================================================
# GEMINI CONFIGURATION
# =========================================================

client = None

if GEMINI_API_KEY:
    try:
        client = genai.Client(
            api_key=GEMINI_API_KEY
        )

        print("✅ Gemini client created successfully")

    except Exception as e:

        print("❌ Gemini client creation failed:")
        print(repr(e))

else:

    print("❌ GEMINI_API_KEY not found")


MODEL_NAME = "gemini-3.6-flash"


# =========================================================
# SYSTEM PROMPT
# =========================================================

SYSTEM_PROMPT = """
You are FoodieBot AI, a friendly and intelligent personal
food and cooking assistant.

Your job is to help users with:

- Recipes
- Cooking instructions
- Ingredients
- Indian food
- South Indian food
- Healthy meals
- Vegetarian food
- Non-vegetarian food
- Breakfast
- Lunch
- Dinner
- Snacks
- High-protein meals
- Quick recipes
- Budget-friendly recipes
- Food substitutions
- Cooking tips
- Kitchen measurements

Rules:

1. Give clear and practical answers.
2. Prefer simple ingredients.
3. When giving recipes, include:
   - Recipe name
   - Ingredients
   - Preparation
   - Cooking steps
   - Cooking time
   - Servings
4. Keep responses easy to read.
5. If the user gives ingredients, suggest recipes using them.
6. Do not invent unavailable ingredients unless clearly marked
   as optional.
7. For dietary or allergy questions, advise the user to verify
   ingredients and consult a qualified professional when needed.
8. Be friendly and concise.
9. You can understand English, Tamil and Tanglish.
10. If the user asks in Tamil or Tanglish, reply naturally
    in Tamil/Tanglish.
"""


# =========================================================
# FRONTEND
# =========================================================

@app.route("/", methods=["GET"])
def home():

    index_file = os.path.join(
        FRONTEND_FOLDER,
        "index.html"
    )

    if os.path.exists(index_file):

        return send_from_directory(
            FRONTEND_FOLDER,
            "index.html"
        )

    return jsonify({
        "success": False,
        "error": "Frontend index.html not found"
    }), 404


# =========================================================
# FRONTEND STATIC FILES
# =========================================================

@app.route("/<path:filename>")
def frontend_files(filename):

    file_path = os.path.join(
        FRONTEND_FOLDER,
        filename
    )

    # Do not interfere with API routes
    if filename in ["health", "chat"]:
        return jsonify({
            "success": False,
            "error": "API endpoint"
        }), 404

    if os.path.isfile(file_path):

        return send_from_directory(
            FRONTEND_FOLDER,
            filename
        )

    return jsonify({
        "success": False,
        "error": "File not found"
    }), 404


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/health", methods=["GET"])
def health():

    return jsonify({

        "success": True,

        "status": "healthy",

        "service": "FoodieBot AI",

        "gemini": (
            "configured"
            if client
            else "not configured"
        ),

        "model": MODEL_NAME

    })


# =========================================================
# CHAT API
# =========================================================

@app.route("/chat", methods=["POST"])
def chat():

    try:

        print("\n" + "=" * 60)
        print("📩 NEW CHAT REQUEST")
        print("=" * 60)


        # -------------------------------------------------
        # CHECK JSON
        # -------------------------------------------------

        if not request.is_json:

            print("❌ Request is not JSON")

            return jsonify({

                "success": False,

                "error": "Request must be JSON"

            }), 400


        # -------------------------------------------------
        # GET DATA
        # -------------------------------------------------

        data = request.get_json()

        print("📦 Request data:", data)


        # -------------------------------------------------
        # GET MESSAGE
        # -------------------------------------------------

        message = data.get(
            "message",
            ""
        ).strip()

        print(
            "💬 User message:",
            message
        )


        # -------------------------------------------------
        # VALIDATE MESSAGE
        # -------------------------------------------------

        if not message:

            return jsonify({

                "success": False,

                "error": "Message cannot be empty"

            }), 400


        # -------------------------------------------------
        # CHECK GEMINI CLIENT
        # -------------------------------------------------

        if client is None:

            print(
                "❌ Gemini client is not configured"
            )

            return jsonify({

                "success": False,

                "error":
                    "Gemini API key is not configured"

            }), 500


        # -------------------------------------------------
        # BUILD PROMPT
        # -------------------------------------------------

        prompt = f"""
{SYSTEM_PROMPT}

User message:
{message}

Answer the user directly.
"""


        print(
            "🤖 Sending request to Gemini..."
        )

        print(
            "Model:",
            MODEL_NAME
        )


        # -------------------------------------------------
        # CALL GEMINI
        # -------------------------------------------------

        response = client.models.generate_content(

            model=MODEL_NAME,

            contents=prompt

        )


        print(
            "✅ Gemini response received"
        )


        # -------------------------------------------------
        # GET RESPONSE
        # -------------------------------------------------

        reply = response.text


        if not reply:

            print(
                "⚠️ Gemini returned empty response"
            )

            reply = (
                "Sorry, I couldn't generate a response. "
                "Please try again."
            )


        print(
            "📝 Reply:",
            reply[:200]
        )


        # -------------------------------------------------
        # RETURN RESPONSE
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "reply": reply

        })


    except Exception as error:

        # =================================================
        # ACTUAL ERROR
        # =================================================

        print(
            "\n" + "=" * 60
        )

        print(
            "❌ FOODIEBOT ACTUAL ERROR"
        )

        print(
            "=" * 60
        )

        print(
            "Error type:",
            type(error).__name__
        )

        print(
            "Error:",
            str(error)
        )

        print(
            "Full error:",
            repr(error)
        )

        print(
            "=" * 60 + "\n"
        )


        return jsonify({

            "success": False,

            "error": str(error),

            "error_type":
                type(error).__name__

        }), 500


# =========================================================
# 404 HANDLER
# =========================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({

        "success": False,

        "error": "API endpoint not found"

    }), 404


# =========================================================
# 500 HANDLER
# =========================================================

@app.errorhandler(500)
def internal_error(error):

    return jsonify({

        "success": False,

        "error": "Internal server error"

    }), 500


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    print("\n")

    print("=" * 60)

    print(
        "🍴 FOODIEBOT AI"
    )

    print("=" * 60)

    print(
        "📁 Frontend:",
        FRONTEND_FOLDER
    )

    print(
        "🔑 Gemini API:",
        "Configured ✅"
        if GEMINI_API_KEY
        else "Not Configured ❌"
    )

    print(
        "🤖 Gemini Client:",
        "Ready ✅"
        if client
        else "Not Ready ❌"
    )

    print(
        "🧠 Model:",
        MODEL_NAME
    )

    print(
        "🌐 Server:",
        "http://127.0.0.1:5000"
    )

    print("=" * 60)

    print("\n")

    app.run(

        host="0.0.0.0",

        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        ),

        debug=False

    )
