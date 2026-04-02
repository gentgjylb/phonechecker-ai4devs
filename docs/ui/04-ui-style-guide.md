# UI Style Guide — PhoneValue (MVP)

This style guide ensures the valuation process is fast, trustworthy, and easy to navigate on both desktop and mobile devices.

## Goals
- **Efficiency-first**: Minimize the steps needed to get a price.
- **Trustworthy**: Use clear labels and status indicators so users feel the valuation is fair.
- **Accessible**: Ensure the questionnaire is usable via keyboard and screen readers.

## Design principles
1. **Clarity over density**: Only show one question at a time during the valuation.
2. **Visual Evidence**: Use clear icons or cards to represent physical damage levels.
3. **Currency Transparency**: Always show the currency toggle (ALL/EUR) clearly.
4. **Immediate Feedback**: Update the estimated value range as the user changes their inputs.

## Layout
- **Single-column Form**: Best for the mobile-first nature of checking a phone's condition.
- **Sticky Footer**: Keep the "Next Step" or "Get Valuation" button visible.
- **Results Grid**: Use a clean list or grid to compare different shop offers.

## Color and theming (semantic tokens)
- `bg`: Light gray or white for a clean "tech" feel.
- `surface`: White cards with subtle shadows for shop listings.
- `accent`: A bold Blue or Green for "Calculate Value" and "Contact Shop" buttons.
- `danger`: Red for indicating high levels of damage or battery failure.
- `success`: Green for "Mint" condition or "Best Price" labels.

## Buttons and actions
- **Primary Action**: "Get My Valuation" / "Contact Shop."
- **Secondary Action**: "Back to Model Selection" / "Change Currency."
- **Selection Cards**: Large touch targets for selecting storage (e.g., 64GB, 128GB).

## Accessibility requirements
- **Keyboard**: All form inputs and sliders must be Tab-reachable.
- **Aria Labels**: Multi-step progress bars must announce the current step (e.g., "Step 2 of 4: Battery Health").
- **Contrast**: High contrast for price displays to ensure readability.

## MVP UI checklist
- Multi-step questionnaire is functional.
- ALL/EUR toggle updates all prices instantly.
- Shop results are sorted by value.
- Contact buttons (Phone/Email) are clearly visible.