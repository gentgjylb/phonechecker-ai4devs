# UI Components — PhoneValue (MVP)

This document lists the reusable React components needed for the PhoneValue platform.

## App shell
### `AppShell`
- **TopBar**: Title ("PhoneValue") + Currency Toggle Switch.
- **ProgressStepper**: Visual indicator of questionnaire progress (Step 1-4).

## Questionnaire components
### `ModelSearch`
- A searchable dropdown or auto-complete input for selecting the phone model.

### `OptionGrid`
- Used for Storage selection (e.g., buttons for 64GB, 128GB, 256GB).

### `BatteryInput`
- A numeric input field with validation (0-100) and a "Health" label.

### `ConditionCard`
- A selectable card with an icon and description (e.g., "Cracked Screen - Significant value reduction").

## Results components
### `PriceDisplay`
- Large, bold text showing the calculated value with the correct currency symbol (Lek or €).

### `ShopOfferCard`
- **Contains**: Shop name, specific offer price, and "Contact" button.
- **Highlight**: A "Best Offer" badge for the highest price.

### `CurrencyToggle`
- A switch component that globally changes the app state between **ALL** and **EUR**.

## Feedback components
### `ValuationSummary`
- A read-only recap shown at the end (e.g., "iPhone 13 | 128GB | 88% Battery").

### `InlineAlert`
- Used if a model is too old to have a value or if the database is offline.

## MVP component checklist
- [ ] AppShell with ALL/EUR Toggle.
- [ ] ModelSearch (Searchable dropdown).
- [ ] OptionGrid (Storage/Condition).
- [ ] PriceDisplay (Large currency-formatted text).
- [ ] ShopOfferCard (List item with contact action).