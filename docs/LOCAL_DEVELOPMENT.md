# Admin UI - Local Development Guide

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- Access to Web BFF service (for API calls)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file:

```env
REACT_APP_BFF_URL=http://localhost:8014
REACT_APP_ENV=development
```

### 3. Start Development Server

```bash
npm start
```

The app will be available at `http://localhost:3000`

## Available Scripts

| Command          | Description               |
| ---------------- | ------------------------- |
| `npm start`      | Start development server  |
| `npm run build`  | Build for production      |
| `npm test`       | Run tests                 |
| `npm run lint`   | Run ESLint                |
| `npm run format` | Format code with Prettier |

## Project Structure

```
admin-ui/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components
│   ├── pages/       # Page components
│   ├── store/       # Redux store and slices
│   ├── hooks/       # Custom React hooks
│   ├── api/         # API client configuration
│   ├── utils/       # Utility functions
│   └── App.jsx      # Root component
├── package.json
└── tailwind.config.js
```

## Environment Variables

| Variable            | Description      | Default                 |
| ------------------- | ---------------- | ----------------------- |
| `REACT_APP_BFF_URL` | Web BFF API URL  | `http://localhost:8014` |
| `REACT_APP_ENV`     | Environment name | `development`           |

## Connecting to Backend Services

Admin UI connects to the Web BFF which proxies requests to backend services:

```
Admin UI (3000) → Web BFF (3100) → Backend Services
```

Ensure the Web BFF is running before starting Admin UI.

## Troubleshooting

### CORS Issues

Ensure Web BFF has CORS configured for `http://localhost:3000`

### API Connection Failed

1. Verify Web BFF is running on port 3100
2. Check `REACT_APP_BFF_URL` in your `.env.local`

### Build Failures

1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
