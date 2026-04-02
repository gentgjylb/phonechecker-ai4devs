# UI Screens and Flow — PhoneValue (MVP)

This document defines the screens and the user journey from landing to receiving a shop offer.

## Navigation model
- **Linear Flow**: Search -> Questionnaire -> Results -> Shop Contact.
- **Global Actions**: Currency Toggle (ALL/EUR) available on all screens.

## Screen 1 — Landing & Model Selection
**Goal**: Identify the device to be valued.
- **Search Bar**: Type to filter phone brands and models.
- **Quick Links**: Popular models (e.g., iPhone 15, Samsung S24).
- **Action**: Selecting a model triggers the questionnaire.

## Screen 2 — Condition Questionnaire
**Goal**: Gather technical data for the valuation logic.
- **Step 1 (Storage)**: Select internal capacity (e.g., 128GB, 256GB).
- **Step 2 (Battery)**: Input Health % (e.g., 85%) via text box or slider.
- **Step 3 (Damage)**: Select physical state (Mint, Good, Cracked, Broken).
- **Action**: "Calculate Value" sends data to the Backend API.

## Screen 3 — Valuation Results
**Goal**: Show the user what their phone is worth and who will buy it.
- **Price Header**: Shows the "Estimated Market Range" in the selected currency.
- **Shop List**: A vertical list of local shops.
- **Each Shop Item Shows**:
    - Shop Name & Logo.
    - Specific offer price.
    - Distance/Location (Optional for MVP).
    - "Contact" button.

## Screen 4 — Shop Detail / Contact
**Goal**: Initiate the sale.
- **Summary**: Recap of the phone's condition.
- **Direct Actions**: "Call Shop" or "Send Report via Email."

## Core user flows

### Flow A — The Standard Valuation
1. User lands on site and searches for "iPhone 13."
2. User selects "128GB" -> "88% Battery" -> "Good Condition."
3. User toggles currency to **ALL**.
4. User views 5 shops and picks the highest offer.
5. User clicks "Call Shop" to finalize.

### Flow B — Quick Comparison
1. User receives a price in **EUR**.
2. User toggles to **ALL** to compare with local cash expectations.
3. User changes "Damage Level" to see how a screen repair might increase their value.

## MVP acceptance checklist
- [ ] Brand/Model search returns results.
- [ ] All 4 questionnaire steps save data correctly.
- [ ] ALL/EUR toggle works on the results page.
- [ ] Valuation logic correctly penalizes for low battery or damage.
- [ ] At least 5 mock shops appear in the results.