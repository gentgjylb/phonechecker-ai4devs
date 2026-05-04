from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import random

app = Flask(__name__)
CORS(app)

# --- Mock Data ---

import json
import os
import database

# Initialize auth DB
database.init_db()

# Load models database
db_path = os.path.join(os.path.dirname(__file__), 'data', 'models_database.json')
with open(db_path, 'r') as f:
    db_data = json.load(f)
    MOCK_MODELS = db_data['models']
    BASE_VALUES = db_data['base_values']

MOCK_SHOPS = [
    {"id": "shop-1", "shopName": "Tirana Tech Fix", "location": "Rruga e Kavajes", "contact": "+355 69 111 2222", "margin": 0.95},
    {"id": "shop-2", "shopName": "Blloku Mobiles", "location": "Ish-Blloku", "contact": "+355 69 333 4444", "margin": 1.05},
    {"id": "shop-3", "shopName": "Ring Center Electronics", "location": "Ring Center", "contact": "+355 68 555 6666", "margin": 0.90},
    {"id": "shop-4", "shopName": "Kombinat Phone Shop", "location": "Kombinat", "contact": "+355 67 777 8888", "margin": 0.85},
    {"id": "shop-5", "shopName": "Zogu Zi Repairs", "location": "Zogu i Zi", "contact": "+355 69 999 0000", "margin": 1.00}
]

EUR_TO_ALL_RATE = 104.5 # Mock exchange rate

# In-memory store for valuations
valuations_db = {}

# --- Helper Functions ---

def calculate_value(model_id, storage, battery_health, damage_level):
    base_price = BASE_VALUES.get(model_id, 300)
    
    # Storage multiplier
    storage_mult = 1.0
    if storage == "256GB": storage_mult = 1.15
    elif storage == "512GB": storage_mult = 1.30
    elif storage == "1TB": storage_mult = 1.50
    
    # Battery multiplier
    battery_mult = 1.0
    if battery_health < 80: battery_mult = 0.8
    elif battery_health < 90: battery_mult = 0.9
    
    # Damage multiplier (1: Mint, 2: Good, 3: Fair, 4: Cracked, 5: Broken)
    damage_mult = 1.0
    if damage_level == 2: damage_mult = 0.9
    elif damage_level == 3: damage_mult = 0.75
    elif damage_level == 4: damage_mult = 0.5
    elif damage_level == 5: damage_mult = 0.2
    
    final_eur = base_price * storage_mult * battery_mult * damage_mult
    return final_eur

# --- Auth Endpoints ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role', 'seller') # 'seller' or 'shop'
    
    if not all([email, password, name, role]):
        return jsonify({"error": "Missing fields"}), 400
        
    user_id, err = database.register_user(email, password, name, role)
    if err:
        return jsonify({"error": err}), 400
        
    return jsonify({"success": True, "userId": user_id})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400
        
    result, err = database.login_user(email, password)
    if err:
        return jsonify({"error": err}), 401
        
    return jsonify(result)

@app.route('/api/auth/me', methods=['GET'])
def get_me():
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token.split(' ')[1]
        
    user = database.get_user_by_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    return jsonify(user)

@app.route('/api/auth/profile', methods=['PUT'])
def update_profile():
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token.split(' ')[1]
        
    user = database.get_user_by_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    name = data.get('name', user['name'])
    address = data.get('address', user.get('address', 'Not provided'))
    contact_info = data.get('contact_info', user.get('contact_info', 'Not provided'))
    profile_picture = data.get('profile_picture', user.get('profile_picture', ''))
    
    success = database.update_user_profile(user['id'], name, address, contact_info, profile_picture)
    if success:
        # Fetch updated user to return
        updated_user = database.get_user_by_token(token)
        return jsonify(updated_user)
    else:
        return jsonify({"error": "Failed to update profile"}), 500

# --- AI Chat Endpoint ---

try:
    import google.generativeai as genai
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
except ImportError:
    GEMINI_API_KEY = None

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    valuation_id = data.get('valuationId')
    message = data.get('message', '')
    
    valuation = valuations_db.get(valuation_id)
    if not valuation:
        # Fallback if no specific valuation is found
        model_id = "smartphone"
        base_eur_value = 300
    else:
        model_id = valuation["modelId"]
        base_eur_value = valuation["baseEurValue"]
    
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"You are an expert smartphone valuation consultant. The user is selling a {model_id} with an estimated base market value of {base_eur_value} EUR. Provide concise, friendly advice. User message: {message}"
            response = model.generate_content(prompt)
            return jsonify({"reply": response.text})
        except Exception as e:
            pass # Fall back to simulated on error
            
    # Simulated AI Fallback
    reply = f"I'm your simulated AI advisor! I noticed your {model_id} has a base value of {base_eur_value} EUR. If a shop offers within 10%, that's a solid deal!"
    if "negotiate" in message.lower():
        reply = "Always try to negotiate! Start by asking for 10% more than their initial offer."
    elif "good" in message.lower() or "fair" in message.lower():
        reply = f"Yes, any offer above {base_eur_value * 0.9} EUR is considered fair for this condition."
        
    return jsonify({"reply": reply})

# --- Endpoints ---

@app.route('/api/models', methods=['GET'])
def get_models():
    brand = request.args.get('brand')
    q = request.args.get('q')
    
    results = MOCK_MODELS
    
    if brand:
        results = [m for m in results if m['brand'].lower() == brand.lower()]
    if q:
        results = [m for m in results if q.lower() in m['name'].lower()]
        
    return jsonify({"items": results})

@app.route('/api/evaluate', methods=['POST'])
def evaluate_device():
    data = request.json
    
    model_id = data.get('modelId')
    storage = data.get('storage')
    battery_health = data.get('batteryHealth')
    damage_level = data.get('damageLevel')
    currency = data.get('currency', 'ALL')
    
    if not all([model_id, storage, battery_health is not None, damage_level]):
        return jsonify({"error": "Missing required fields"}), 400
        
    base_eur_value = calculate_value(model_id, storage, battery_health, damage_level)
    
    # Add some market spread (e.g. +/- 10%)
    min_eur = base_eur_value * 0.9
    max_eur = base_eur_value * 1.1
    
    if currency == 'ALL':
        min_val = min_eur * EUR_TO_ALL_RATE
        max_val = max_eur * EUR_TO_ALL_RATE
    else:
        min_val = min_eur
        max_val = max_eur
        
    valuation_id = str(uuid.uuid4())
    
    # Store the base EUR value so we can generate shop offers later regardless of currency
    valuations_db[valuation_id] = {
        "modelId": model_id,
        "baseEurValue": base_eur_value,
        "currency": currency
    }
    
    return jsonify({
        "estimatedMin": round(min_val, 2),
        "estimatedMax": round(max_val, 2),
        "currency": currency,
        "valuationId": valuation_id
    })

@app.route('/api/shops', methods=['GET'])
def get_shops():
    valuation_id = request.args.get('modelId') # Using modelId as valuation_id per OpenAPI spec wait, actually the API spec says `modelId` as the parameter but description says "valuation_id". I'll use `modelId` parameter to read valuation_id.
    currency = request.args.get('currency', 'ALL')
    
    valuation = valuations_db.get(valuation_id)
    if not valuation:
        # For demo purposes, if not found, we'll just fake a base value
        base_eur_value = 400
    else:
        base_eur_value = valuation["baseEurValue"]
        
    shop_offers = []
    for shop in MOCK_SHOPS:
        offer_eur = base_eur_value * shop['margin']
        
        # Add a tiny bit of random noise so it looks more real
        offer_eur += random.uniform(-10, 10)
        
        if currency == 'ALL':
            offer_price = offer_eur * EUR_TO_ALL_RATE
        else:
            offer_price = offer_eur
            
        shop_offers.append({
            "id": shop["id"],
            "shopName": shop["shopName"],
            "offerPrice": round(offer_price, 2),
            "location": shop["location"],
            "contact": shop["contact"]
        })
        
    # Sort shops by highest offer
    shop_offers.sort(key=lambda x: x["offerPrice"], reverse=True)
        
    return jsonify({"items": shop_offers})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
