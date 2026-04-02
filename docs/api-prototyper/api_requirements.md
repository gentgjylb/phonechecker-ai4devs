# API Requirements — PhoneValue (MVP)

## Domain Overview
PhoneValue is a platform that connects end customers with local phone shops to get monetary valuations for used devices. The API facilitates model searching, condition-based price calculation, and retrieving shop contact details.

## Target Users
- **Frontend developers**: To build the React UI for the questionnaire and results pages.
- **Shop Owners**: To provide the base price data used for valuations.

## MVP Endpoints (4)

### 1. List supported brands and models
`GET /api/models`
Returns a list of all smartphone models currently supported by the valuation engine.

**Query parameters:**
- `brand` (string) — Filter by brand (e.g., Apple, Samsung).
- `q` (string) — Search term for specific model names.

**Response:**
- `items` — Array of models (id, brand, model_name).

### 2. Get valuation for a device
`POST /api/evaluate`
Calculates the estimated value based on user-provided health data.

**Request Body:**
- `model_id` (string) — The unique ID of the phone.
- `storage` (string) — e.g., "128GB".
- `battery_health` (integer) — 0-100 percentage.
- `damage_level` (integer) — 1 (Mint) to 5 (Broken).
- `currency` (string) — "ALL" or "EUR".

**Response:**
- `estimated_min`: Minimum market value.
- `estimated_max`: Maximum market value.
- `currency`: The currency used for the calculation.

### 3. List shop offers
`GET /api/shops`
Returns a list of local shops and their specific offers based on a valuation ID.

**Query parameters:**
- `valuation_id` (string) — The ID generated from the `/evaluate` call.
- `limit` (integer) — Number of shops to return.

**Response:**
- `items` — Array of shops (name, location, specific_offer_price, contact_info).

### 4. Get shop details
`GET /api/shops/<shop_id>`
Returns full contact and location information for a specific shop to finalize a sale.

## Error Handling
All errors use a consistent JSON format:
- `400`: Invalid input (e.g., battery health > 100).
- `404`: Model or Shop not found.
- `500`: Internal server error.