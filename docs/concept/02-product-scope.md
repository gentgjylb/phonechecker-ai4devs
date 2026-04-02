# Product Scope — PhoneValue

## Purpose of this document
This document defines what the MVP includes, excludes, and must achieve for the phone valuation platform.

## Scope objective
Build a web application that allows a user to input their phone's technical details and physical state to receive a monetary valuation from a database of local shops.

## In scope
### 1. Device Questionnaire
- A multi-step form capturing: Brand, Model, Storage (GB), Battery Health (%), and Damage Level (Scale of 1-5 or categories like Mint/Good/Cracked).

### 2. Currency Support
- The application must support a toggle between **Albanian Lek (ALL)** and **Euro (EUR)** for all price displays.

### 3. Valuation Logic
- A backend calculation engine that applies a "Condition Multiplier" to a base price (e.g., a cracked screen reduces the base shop price by 30%).

### 4. Shop Catalog
- A data structure containing local shops, their contact details, and their base buying prices for popular smartphone models.

### 5. Local Execution
- The full project must run locally on a Windows environment using Python Flask (Backend) and React (Frontend).

## Out of scope
- Automated hardware scanning (relies on manual user input).
- User authentication or profiles.
- Live bidding or dynamic price negotiations.
- In-app financial transactions or "Buy Now" features.
- Production deployment or cloud hosting.

## MVP requirements
1. A user can select a phone model from a predefined list.
2. A user can complete the 4-step condition questionnaire.
3. A user can toggle between ALL and EUR.
4. The system calculates a price based on the input condition.
5. The system displays a list of shops and their specific offers.
6. The repository includes clear setup instructions for a local environment.