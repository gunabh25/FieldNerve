# Vendor Platform

An intelligent vendor recommendation API built with **Express**, **Prisma**, and **PostgreSQL**. The platform manages vendors, compliance documents, and work requirements, then recommends the best-matched vendors for a given job using a transparent, rule-based scoring engine.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Database Design](#database-design)
- [API Design](#api-design)
- [Recommendation Logic](#recommendation-logic)
- [AI Usage](#ai-usage)
- [Assumptions](#assumptions)
- [Trade-offs](#trade-offs)

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm

### Installation

```bash
cd vendor-platform
npm install
```

### Environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://<user>@localhost:5432/vendor_platform"
SHADOW_DATABASE_URL="postgresql://<user>@localhost:5432/vendor_platform_shadow"
PORT=3000
```

### Database Setup

```bash
# Start PostgreSQL (Homebrew example)
brew services start postgresql@15

# Create databases
createdb vendor_platform
createdb vendor_platform_shadow

# Run migrations and generate Prisma client
npx prisma migrate dev
npx prisma generate
```

### Run the Server

```bash
npm run dev    # development with hot reload
npm start      # production-style start
```

The API is available at `http://localhost:3000`.

### API Testing

Import the Postman collection from:

```
postman/Vendor-Platform.postman_collection.json
```

---

## Project Architecture

The application follows a layered **Express MVC-style** structure with clear separation of concerns:

```
vendor-platform/
├── prisma/
│   ├── schema.prisma          # Data model & enums
│   └── migrations/            # Versioned SQL migrations
├── generated/prisma/          # Generated Prisma client (gitignored)
├── src/
│   ├── server.js              # HTTP server entry point
│   ├── app.js                 # Express app, middleware, error handling
│   ├── lib/
│   │   └── prisma.js          # Prisma client singleton (pg adapter)
│   ├── routes/                # Route definitions
│   ├── controllers/           # Request validation & HTTP responses
│   └── services/              # Business logic & database access
└── postman/                   # Postman collection for API testing
```

### Request Flow

```
Client Request
    │
    ▼
server.js ──► app.js (cors, json parser, error handler)
    │
    ▼
routes/ ──► controllers/ ──► services/ ──► Prisma ──► PostgreSQL
    │
    ▼
JSON Response { data: ... } or { error: ... }
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Routes** | Map HTTP methods and paths to controller handlers |
| **Controllers** | Validate input, handle HTTP status codes, catch errors |
| **Services** | Encapsulate business logic and Prisma queries |
| **lib/prisma** | Single Prisma client instance with PostgreSQL driver adapter |

### Key Technical Choices

- **Express 5** for the HTTP layer
- **Prisma 7** with `@prisma/adapter-pg` and the `pg` driver for PostgreSQL
- **tsx** to run the app and import the generated TypeScript Prisma client from JavaScript
- **ES Modules** (`import`/`export`) throughout the source code

---

## Database Design

PostgreSQL is the primary datastore. All primary keys use **UUID** (`@db.Uuid`) for distributed-friendly identifiers.

### Entity Relationship Diagram

```
┌─────────────────┐       1:N        ┌──────────────────┐
│     Vendor      │─────────────────►│  VendorDocument  │
├─────────────────┤                  ├──────────────────┤
│ id (PK)         │                  │ id (PK)          │
│ name            │                  │ vendorId (FK)    │
│ vendorType      │                  │ documentType     │
│ category        │                  │ expiryDate       │
│ contactName     │                  │ isVerified       │
│ email           │                  │ createdAt        │
│ phone           │                  └──────────────────┘
│ operatingLocation│
│ rating          │
│ status          │        ┌──────────────────┐
│ createdAt       │        │ WorkRequirement  │
│ updatedAt       │        ├──────────────────┤
└─────────────────┘        │ id (PK)          │
                           │ title            │
                           │ category         │
                           │ location         │
                           │ estimatedValue   │
                           │ priority         │
                           │ expectedStartDate│
                           │ createdAt        │
                           └──────────────────┘
```

`WorkRequirement` is intentionally **decoupled** from `Vendor` at the schema level. Matching is performed at runtime by the recommendation engine rather than through a foreign key assignment.

### Models

#### Vendor

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `name` | String | Company or vendor name |
| `vendorType` | String | e.g. Contractor, Supplier |
| `category` | String | Service category for matching |
| `contactName` | String | Primary contact |
| `email` | String | Contact email |
| `phone` | String? | Optional phone number |
| `operatingLocation` | String | Geographic service area |
| `rating` | Float | 0–5 scale, default `0` |
| `status` | VendorStatus | `ACTIVE`, `INACTIVE`, `SUSPENDED` |

#### VendorDocument

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `vendorId` | UUID | FK → Vendor (cascade delete) |
| `documentType` | String | e.g. LICENSE, INSURANCE |
| `expiryDate` | DateTime? | Optional expiration |
| `isVerified` | Boolean | Compliance verification flag |

#### WorkRequirement

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `title` | String | Job title |
| `category` | String | Required service category |
| `location` | String | Job site location |
| `estimatedValue` | Decimal(12,2) | Budget estimate |
| `priority` | Priority | `LOW`, `MEDIUM`, `HIGH` |
| `expectedStartDate` | DateTime | Planned start date |

### Indexes

Indexes are defined on frequently filtered columns: `Vendor.status`, `Vendor.category`, `VendorDocument.vendorId`, `WorkRequirement.category`, `WorkRequirement.priority`, and `WorkRequirement.expectedStartDate`.

---

## API Design

All resources are served under `/api`. Responses use a consistent envelope:

```json
{ "data": { ... } }
```

Errors return:

```json
{ "error": "Human-readable message" }
```

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vendors` | List vendors (`?status`, `?category`, `?vendorType`) |
| `GET` | `/api/vendors/:id` | Get vendor with nested documents |
| `POST` | `/api/vendors` | Create vendor |
| `PUT` | `/api/vendors/:id` | Update vendor |
| `DELETE` | `/api/vendors/:id` | Delete vendor |

### Vendor Documents

Nested under vendors to reflect the parent-child relationship.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vendors/:vendorId/documents` | List documents (`?documentType`, `?isVerified`) |
| `GET` | `/api/vendors/:vendorId/documents/:documentId` | Get document |
| `POST` | `/api/vendors/:vendorId/documents` | Create document |
| `PUT` | `/api/vendors/:vendorId/documents/:documentId` | Update document |
| `DELETE` | `/api/vendors/:vendorId/documents/:documentId` | Delete document |

### Work Requirements

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/work-requirements` | List requirements (`?category`, `?priority`, `?location`) |
| `GET` | `/api/work-requirements/:id` | Get requirement |
| `POST` | `/api/work-requirements` | Create requirement |
| `PUT` | `/api/work-requirements/:id` | Update requirement |
| `DELETE` | `/api/work-requirements/:id` | Delete requirement |

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/recommendations/:workRequirementId` | Top 3 vendor recommendations with scores and reasons |
| `POST` | `/api/recommendations/:workRequirementId/summary` | Deterministic narrative summary per recommended vendor |

> `/api/recommendation/:workRequirementId` is also supported as a legacy alias.

---

## Recommendation Logic

The recommendation engine is **rule-based and fully deterministic** — no machine learning models are involved. Given the same work requirement and vendor data, the output is always identical.

### Algorithm

1. Fetch the `WorkRequirement` by ID; return `404` if not found.
2. Query all vendors with `status = ACTIVE`.
3. Score each vendor against the work requirement.
4. Sort by score descending; break ties alphabetically by vendor name.
5. Return the **top 3** vendors.

### Scoring Rules

| Criterion | Points | Condition |
|-----------|--------|-----------|
| Category match | **+40** | `vendor.category` equals `workRequirement.category` (case-insensitive) |
| Location match | **+30** | `vendor.operatingLocation` equals `workRequirement.location` (case-insensitive) |
| Rating | **rating × 6** | Always applied based on vendor rating |
| Active status | **+10** | Vendor status is `ACTIVE` |

**Maximum possible score:** 40 + 30 + 30 + 10 = **110** (assuming a 5.0 rating).

### Example

For a work requirement with `category: "Construction"` and `location: "Austin, TX"`:

| Vendor | Category | Location | Rating | Score |
|--------|----------|----------|--------|-------|
| A | Construction | Austin, TX | 4.5 | 40 + 30 + 27 + 10 = **107** |
| B | Electrical | Austin, TX | 4.5 | 0 + 30 + 27 + 10 = **67** |
| C | Construction | Dallas, TX | 3.0 | 40 + 0 + 18 + 10 = **68** |

### Summary Endpoint

`POST /api/recommendations/:workRequirementId/summary` uses the same scoring pipeline but returns a structured narrative for each recommended vendor, explaining category alignment, location alignment, rating contribution, status contribution, and the full score breakdown.

---

## AI Usage

### Recommendation Engine

The vendor recommendation system does **not** use AI or machine learning. Scoring is performed by a transparent, hand-crafted rules engine in `src/services/recommendationService.js`. This was an intentional design choice to ensure:

- **Explainability** — every point is accounted for with human-readable reasons
- **Determinism** — identical inputs always produce identical outputs
- **Auditability** — scoring rules can be reviewed, tested, and adjusted without retraining models

### Development Tooling

AI-assisted coding tools (e.g. Cursor) may have been used during development for scaffolding boilerplate, generating CRUD layers, and writing documentation. No AI inference runs at application runtime.

### Future AI Integration

The architecture supports future enhancement with AI/ML without structural changes:

- Replace or augment `scoreVendor()` with an ML model while keeping the same service interface
- Add embedding-based category/location matching
- Use an LLM to generate richer natural-language summaries from structured score data

---

## Assumptions

| # | Assumption |
|---|-----------|
| 1 | **Category and location are free-text strings** compared with case-insensitive exact equality. No taxonomy, geocoding, or fuzzy matching is applied. |
| 2 | **Vendor ratings are pre-populated** and trusted. The system does not collect or compute ratings from job outcomes. |
| 3 | **Only ACTIVE vendors** are eligible for recommendations. Document verification (`isVerified`) is not factored into scoring. |
| 4 | **Work requirements are independent entities** with no direct assignment to vendors in the database. |
| 5 | **A single category per vendor** is sufficient for matching; vendors are not modeled with multiple categories or skills. |
| 6 | **Authentication and authorization are out of scope** for this version. All endpoints are publicly accessible. |
| 7 | **Location matching is exact** — "Austin, TX" and "Austin" are treated as different locations. |
| 8 | **The top 3 vendors** is a fixed result size regardless of how many vendors meet a minimum quality threshold. |

---

## Trade-offs

### Rule-based scoring vs. machine learning

| | Rule-based (current) | ML-based |
|---|---------------------|----------|
| Explainability | High — every point has a reason | Low — black-box predictions |
| Accuracy on complex patterns | Limited | Higher with sufficient training data |
| Operational cost | None | Model hosting, retraining, monitoring |
| Determinism | Guaranteed | Probabilistic |

**Decision:** Prioritize transparency and explainability for a compliance-sensitive vendor selection use case.

### Exact string matching vs. fuzzy/semantic matching

Exact case-insensitive matching is simple and predictable but misses near-matches (e.g. "Electrical" vs "Electrical Services", "Austin" vs "Austin, TX"). Fuzzy or embedding-based matching would improve recall at the cost of complexity and potential false positives.

### Nested document routes vs. flat resource routes

Documents are nested under `/api/vendors/:vendorId/documents` to enforce the parent-child relationship in the URL. This makes document creation intuitive but requires a valid `vendorId` for every document operation.

### No vendor–work-requirement assignment model

Decoupling work requirements from vendors keeps the schema simple and makes the recommendation engine stateless. The trade-off is that recommended vendors are not persisted — each request recomputes results from current data.

### In-memory scoring vs. database-side ranking

All ACTIVE vendors are loaded and scored in application memory. This is fast and simple for small-to-medium vendor pools but would need optimization (SQL filtering, pagination, caching) at scale.

### Prisma 7 with driver adapter

Using `@prisma/adapter-pg` with a custom client output path adds setup complexity (`tsx` runtime, generated TypeScript client) but aligns with Prisma 7's architecture and provides direct PostgreSQL connection pooling via `pg.Pool`.

---

## License

ISC
