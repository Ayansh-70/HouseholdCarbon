# HouseholdCarbon

A full-stack household energy and utility carbon footprint tracker with AI-personalized insights.

## Chosen Vertical
**Household Energy & Utility Tracking:** I chose the "Household" vertical because home energy and utility usage is one of the largest direct contributors to an individual's carbon footprint. It is also an area where people have significant agency to make changes (e.g., adjusting thermostats, upgrading appliances, changing habits). This solution helps the persona of a homeowner or renter easily track their monthly usage (electricity, gas, water, heating) and receive targeted, actionable advice to reduce their impact and utility bills simultaneously.

## Approach and Logic
The application splits its logic into two distinct phases for accuracy, security, and efficiency:
1. **Deterministic Calculation (Backend Pure Function):** The core carbon footprint calculation relies on fixed emission factors applied strictly using pure math. This ensures the footprint is scientifically reproducible, testable, and completely separate from any AI hallucination. The backend accurately calculates a breakdown and a per-capita value, enforcing penalty factors strictly on relevant utilities.
2. **AI Personalization (Backend Server-Side Integration):** Once the deterministic calculation completes, a numeric summary (without any Personally Identifiable Information) is sent from the Express backend to the Google Gemini API. Gemini acts as an analytical engine, interpreting the usage breakdown to suggest prioritized, practical reduction tips tailored specifically to that household's dominant emission sources. By isolating this call on the backend, the API key remains entirely secure, and we implement strict timeouts, validation, and a robust fallback contract to ensure the user always receives tips even if the AI fails.

## How the Solution Works

### Architecture Overview
- **Frontend (React + Vite):** A responsive, accessible single-page application built with functional components and hooks. Features a custom vanilla CSS design system utilizing glassmorphism and a premium dark mode aesthetic.
- **Backend (Node.js + Express):** A layered REST API (Routes, Controllers, Services, Utilities). Implements strict Zod schema validation, Helmet security headers (with explicit Content-Security-Policy), CORS regex guard, strict IP rate limiting (15 requests per 15 minutes to balance demoability with Gemini Free Tier constraints), and global error handling.
- **AI Integration:** Google Gemini API accessed via the official SDK server-side (`@google/generative-ai`), returning structured JSON.
- **Containerization:** A multi-stage Dockerfile builds the static React assets and serves them securely via the Express backend in a single container.

### Running Locally
1. Clone the repository.
2. Copy the `.env.example` file to `.env` in the `backend` folder and insert your valid `GEMINI_API_KEY`.
3. Install dependencies from the root directory:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
4. Start both servers concurrently (or in separate terminals):
   - Frontend: `cd frontend && npm run dev`
   - Backend: `cd backend && npm run dev`
5. Access the app at `http://localhost:5173`.

### Running Tests
Automated tests are set up for both the backend (Jest) and frontend (Vitest/RTL).
You can run all tests from the root directory:
```bash
npm test
```
Or individually:
```bash
npm run test:backend
npm run test:frontend
```

### Docker Deployment (Google Cloud Run)
To build and run the multi-stage Docker container locally:
```bash
docker build -t householdcarbon .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_actual_api_key_here householdcarbon
```

To deploy directly to Google Cloud Run:
```bash
gcloud run deploy householdcarbon \
  --source . \
  --set-env-vars GEMINI_API_KEY=your_actual_api_key_here \
  --allow-unauthenticated \
  --region us-central1
```
*(The container dynamically listens on the `PORT` environment variable injected by Cloud Run).*

## Assumptions Made
1. **Emission Factors:** We used illustrative, flat national-average emission factors to calculate the footprint:
   - **Electricity:** 0.4 kg CO2e per kWh *(Note: Electricity intensity varies wildly by local power grid; this illustrative average was chosen for simplicity).*
   - **Natural Gas:** 5.3 kg CO2e per therm.
   - **Water:** 0.003 kg CO2e per liter.
2. **Heating Fuel Modifier:** A 1.25x penalty multiplier is applied to the sum of electricity and natural gas emissions if the household uses "oil" as its primary heating fuel, representing the additional inefficiency burden.
3. **Persistence Approach:** The application uses an **in-memory JSON array store** on the Node.js backend. This choice satisfies the lightweight "Track over time" requirement for this submission. However, it is explicitly understood that **all history will be lost upon server restart**. Specifically on serverless platforms like Google Cloud Run, which scale to zero and spin up new isolated instances automatically, history is not guaranteed to persist across sessions or instances.
4. **Scope Limitations:** The application intentionally does not collect PII (names, addresses) or implement user authentication, focusing solely on the core calculation and insight generation engine.
