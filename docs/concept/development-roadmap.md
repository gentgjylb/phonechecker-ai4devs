# Development Roadmap — PhoneValue

## Purpose
This document outlines the incremental steps to build the PhoneValue MVP.

**Tech stack:** Python Flask (backend API) · React (frontend)
**Environment:** Windows (PowerShell or CMD).

---

## Phase 0 — Repo setup
**Status:** ⏳ Not started
**Goal:** Initialize the project structure and define the data schema.
**Deliverables:**
- [ ] `data/shops.json` (The "database" of shops and base prices).
- [ ] `docs/concept/03-valuation-logic.md` (Defining the math for damage/battery depreciation).
- [ ] Backend/Frontend folder initialization.

---

## Phase 1 — Backend & Valuation API
**Status:** ⏳ Not started
**Goal:** Create the Flask API to process phone data and return prices.
- [ ] Implement `POST /api/evaluate`: Takes device stats and returns calculated prices in ALL and EUR.
- [ ] Implement `GET /api/models`: Returns the list of supported brands/models.
- [ ] Implement `GET /api/shops`: Returns shop details and contact info.

---

## Phase 2 — Frontend Questionnaire
**Status:** ⏳ Not started
**Goal:** Build the React multi-step form for user input.
- [ ] Create UI components for Model selection and Storage buttons.
- [ ] Build a "Condition Slider" or selection cards for physical damage levels.
- [ ] Implement the currency toggle (ALL/EUR) in the global state.

---

## Phase 3 — Results & Lead Gen
**Status:** ⏳ Not started
**Goal:** Connect the frontend to the API and show shop results.
- [ ] Display the "Final Valuation" based on API response.
- [ ] Render a list of "Shop Cards" sorted by the highest offer.
- [ ] Add "Call" or "Email" action buttons for each shop.

---

## Phase 4 — Polish & Documentation
**Status:** ⏳ Not started
**Goal:** Finalize the README and ensure the project is "agent-ready."
- [ ] Write Windows-specific setup commands (`pip install`, `npm install`).
- [ ] Add basic error handling for "Model Not Found."