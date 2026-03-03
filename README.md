<div align="center">

# 🛠️ Admin UI

**React + TypeScript admin dashboard for managing the xshopai e-commerce platform**

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Getting Started](#-getting-started) •
[Documentation](#-documentation) •
[Testing](#-testing) •
[Contributing](#-contributing)

</div>

---

## 🎯 Overview

The **Admin UI** is the back-office dashboard for the xshopai platform, giving administrators full control over users, products, inventory, orders, and reviews. Built with React, TypeScript, and TailwindCSS, it features data-rich tables (TanStack Table), charts (Recharts), and role-based access control. All API calls are routed through the [Web BFF](https://github.com/xshopai/web-bff).

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 📊 Dashboard & Analytics

- Real-time summary stats and KPIs
- Revenue and order trend charts (Recharts)
- Growth indicators with color-coded trends
- Recent activity feed and quick actions

</td>
<td width="50%">

### 👥 User & Product Management

- Full CRUD for customer and admin accounts
- Product catalog creation and editing
- Inventory stock level tracking
- Order processing and fulfillment

</td>
</tr>
<tr>
<td width="50%">

### ⭐ Review Moderation

- Approve, reject, or flag customer reviews
- Bulk moderation actions
- Review analytics and sentiment
- Content policy enforcement

</td>
<td width="50%">

### 🎨 Modern UI/UX

- TailwindCSS responsive design
- Dark mode with system preference detection
- Accessible HeadlessUI components
- Mobile-friendly collapsible sidebar

</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (LTS)
- npm 9+
- Running backend services (Web BFF on port 8014)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/xshopai/admin-ui.git
cd admin-ui

# Build and run
docker build -t admin-ui .
docker run -p 3001:80 admin-ui
```

### Local Development Setup

<details>
<summary><b>🔧 Development Server</b></summary>

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env — ensure REACT_APP_BFF_URL=http://localhost:8014

# Start development server (hot reload)
npm run dev
```

The app will be available at [http://localhost:3001](http://localhost:3001).

📖 See [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) for detailed instructions.

</details>

<details>
<summary><b>🏗️ Production Build</b></summary>

```bash
# Create optimized production build
npm run build

# Serve with nginx (Docker)
docker build -t admin-ui .
docker run -p 3001:80 admin-ui
```

The Dockerfile uses multi-stage builds with nginx for production serving.

</details>

---

## 📚 Documentation

| Document                                          | Description                                        |
| :------------------------------------------------ | :------------------------------------------------- |
| 📘 [Local Development](docs/LOCAL_DEVELOPMENT.md) | Step-by-step local setup and development workflows |
| ☁️ [Azure Container Apps](docs/ACA_DEPLOYMENT.md) | Deploy to Azure Container Apps                     |

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Lint code
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format code
npm run format
```

### Test Coverage

| Metric     | Status                   |
| :--------- | :----------------------- |
| Unit Tests | ✅ React Testing Library |
| Linting    | ✅ ESLint                |
| Formatting | ✅ Prettier              |

---

## 🏗️ Project Structure

```
admin-ui/
├── 📁 src/                       # Application source code
│   ├── 📁 components/            # Reusable UI components
│   ├── 📁 contexts/              # React context providers
│   ├── 📁 pages/                 # Page-level components (routes)
│   ├── 📁 services/              # API client layer
│   ├── 📁 store/                 # Redux Toolkit + Zustand stores
│   ├── 📁 telemetry/             # Azure Application Insights
│   ├── 📁 types/                 # TypeScript type definitions
│   └── 📁 utils/                 # Helper functions
├── 📁 public/                    # Static assets
├── 📁 tests/                     # Test suite
├── 📁 scripts/                   # Build and utility scripts
├── 📁 docs/                      # Documentation
├── 📄 Dockerfile                 # Multi-stage build (nginx)
├── 📄 nginx.conf                 # Production nginx configuration
├── 📄 config-overrides.js        # CRA config overrides
└── 📄 package.json               # Dependencies and scripts
```

---

## 🔧 Technology Stack

| Category         | Technology                                     |
| :--------------- | :--------------------------------------------- |
| ⚛️ Framework     | React 18.2 + TypeScript                        |
| 🎨 Styling       | TailwindCSS + HeadlessUI components            |
| 📦 State         | Redux Toolkit + Zustand + TanStack React Query |
| 📊 Charts        | Recharts for analytics dashboards              |
| 📋 Tables        | TanStack Table for data-rich management views  |
| 🌐 HTTP Client   | Axios (all requests via Web BFF)               |
| 📊 Observability | Azure Application Insights                     |
| 🐳 Deployment    | Docker multi-stage build with nginx            |

---

## ⚡ Quick Reference

```bash
# 🚀 Development
npm start                         # Start dev server (port 3001)
npm run dev                       # Alias for start
npm run build                     # Production build

# 🧪 Testing
npm test                          # Unit tests

# 🔍 Code Quality
npm run lint                      # ESLint check
npm run lint:fix                  # Auto-fix lint issues
npm run format                    # Prettier format

# 🐳 Docker
docker build -t admin-ui .
docker run -p 3001:80 admin-ui
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Write** tests for your changes
4. **Run** the test suite
   ```bash
   npm test && npm run lint
   ```
5. **Commit** your changes
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
6. **Push** to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open** a Pull Request

Please ensure your PR:

- ✅ Passes all existing tests
- ✅ Includes tests for new functionality
- ✅ Follows the existing code style
- ✅ Updates documentation as needed

---

## 🆘 Support

| Resource         | Link                                                                  |
| :--------------- | :-------------------------------------------------------------------- |
| 🐛 Bug Reports   | [GitHub Issues](https://github.com/xshopai/admin-ui/issues)           |
| 📖 Documentation | [docs/](docs/)                                                        |
| 💬 Discussions   | [GitHub Discussions](https://github.com/xshopai/admin-ui/discussions) |

---

## 📄 License

This project is part of the **xshopai** e-commerce platform.
Licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**[⬆ Back to Top](#-admin-ui)**

Made with ❤️ by the xshopai team

</div>
