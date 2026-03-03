# Copilot Instructions — admin-ui

## Service Identity

- **Name**: admin-ui
- **Purpose**: Admin portal — user management, order processing, inventory oversight, analytics dashboards
- **Port**: 3001
- **Language**: TypeScript (TSX)
- **Framework**: React 18.2 with react-app-rewired (CRA with config overrides)
- **State Management**: Redux Toolkit + Zustand + TanStack Query v5
- **Styling**: TailwindCSS 3 + HeadlessUI + Heroicons

## Architecture

- **Pattern**: SPA (Single Page Application) — communicates with web-bff API gateway
- **API Communication**: Axios HTTP client → Web BFF (port 8014)
- **State**: Redux Toolkit for global state, Zustand for lightweight stores, TanStack Query for server state
- **Routing**: React Router DOM v6
- **Telemetry**: Azure Application Insights SDK
- **Charts**: Recharts for analytics dashboards
- **Tables**: TanStack Table v8 for data grids

## Project Structure

```
admin-ui/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React context providers
│   ├── pages/           # Page-level components (route targets)
│   ├── services/        # API service classes
│   ├── store/           # Redux Toolkit slices + Zustand stores
│   ├── telemetry/       # Application Insights setup
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions
│   ├── App.tsx          # Root component with routing
│   ├── index.tsx        # Entry point
│   └── index.css        # TailwindCSS imports
├── public/
├── config-overrides.js  # CRA config overrides (react-app-rewired)
├── nginx.conf           # Production reverse proxy config
├── Dockerfile
└── package.json
```

## Code Conventions

- **TypeScript** with strict mode (TSX components)
- Use **functional components** with hooks exclusively
- Use **TailwindCSS** utility classes for all styling
- Use **HeadlessUI** (`@headlessui/react`) for accessible dropdown, dialog, transition components
- Use **TanStack Table** for sortable, filterable data tables
- Use **Recharts** for charts and graphs in admin dashboards
- Use **Redux Toolkit** `createSlice` for global state
- Use **TanStack Query** for API data fetching and caching
- Use **date-fns** for date formatting and manipulation
- Type definitions in `src/types/`
- API service classes in `src/services/`

## Key Patterns

- All API calls go through Web BFF (never directly to microservices)
- Admin role required for all operations
- Order processing workflow: view pending → confirm payment → track saga progression
- `react-app-rewired` for CRA config customization without ejecting
- Docker multi-stage build: Node.js build → Nginx for production serving
- `docker-entrypoint.sh` injects runtime environment variables

## Security Rules

- Never embed API keys or secrets in source code or build artifacts
- All API calls MUST go through Web BFF — never call microservices directly from the browser
- Use `httpOnly` cookies for JWT token storage (managed by Web BFF) — never store JWTs in localStorage
- Validate all form inputs before submission
- Sanitize user-provided data before rendering to prevent XSS
- Admin portal MUST enforce authentication before rendering any route

## Error Handling

- Use React Error Boundaries for unexpected component errors
- Display user-friendly error messages via toast notifications (`react-toastify`)
- Never expose raw API error details or stack traces in the UI
- Handle 401 responses by redirecting to login
- Handle 403 responses by showing an access-denied message

## Logging Rules

- Use **Azure Application Insights** SDK for telemetry
- Track page views, user actions, and exceptions
- Never log JWT tokens or sensitive user data to Application Insights
- Include correlation IDs in custom telemetry events for tracing

## Testing Requirements

- All new components MUST have unit tests
- Use **React Testing Library** + **Jest** (via react-app-rewired) as the test framework
- Mock API service calls in component unit tests
- Do NOT call real Web BFF in unit tests
- Run: `npm test`

## Non-Goals

- This app is NOT responsible for business logic — it delegates all operations to Web BFF
- This app does NOT store or manage data locally (no local database)
- This app does NOT issue JWT tokens — authentication handled by auth-service via Web BFF
- This app does NOT communicate directly with microservices

## Environment Variables

```
PORT=3001
REACT_APP_API_URL=http://localhost:8014
REACT_APP_APPINSIGHTS_CONNECTION_STRING=<optional>
```

## Common Commands

```bash
npm start              # Dev server (port 3001)
npm run build          # Production build
npm test               # Unit tests
npm run lint           # ESLint
npm run format         # Prettier
```
