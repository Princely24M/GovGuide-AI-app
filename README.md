# GovGuide AI

GovGuide AI is a full-stack South African civic technology platform that helps people discover government services, understand application requirements, receive AI-assisted guidance, manage service checklists, find verified government offices, generate civic content, and analyse citizen feedback.

The application is deployed at:

**Production:** [https://govguideai-ggyjtx95.manus.space](https://govguideai-ggyjtx95.manus.space)

This repository contains the React frontend, Express/tRPC server, Supabase integration, migrations, automated tests, and development documentation.

## Contents

- [Product overview](#product-overview)
- [Core user journey](#core-user-journey)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Repository structure](#repository-structure)
- [Supabase data model](#supabase-data-model)
- [Prerequisites](#prerequisites)
- [Environment configuration](#environment-configuration)
- [Local development](#local-development)
- [Database setup](#database-setup)
- [Authentication and security](#authentication-and-security)
- [AI tools](#ai-tools)
- [Government services and checklists](#government-services-and-checklists)
- [Government offices and maps](#government-offices-and-maps)
- [Testing and validation](#testing-and-validation)
- [Production build and deployment](#production-build-and-deployment)
- [Maintenance guide](#maintenance-guide)
- [Known limitations and roadmap](#known-limitations-and-roadmap)
- [Contributing](#contributing)
- [License](#license)

## Product overview

GovGuide AI is designed around a simple civic-service problem: government information can be difficult to discover, interpret, and act on. The platform brings service information, AI guidance, personal task tracking, and office discovery into one connected workflow.

The application uses the existing Supabase project as its production backend. It does not use mock authentication, fake users, LocalStorage as a primary database, static office data, fabricated coordinates, or a separate frontend-only service catalogue.

Important user-owned data is persisted in Supabase, including:

- User profiles.
- Government-service checklists and checklist items.
- Ask GovGuide conversations and messages.
- Saved generated content.
- Sentiment analyses.
- Generated reports.
- Recent activity.

## Core user journey

```text
Find a government service
          ↓
Understand eligibility, documents, and steps
          ↓
Ask GovGuide for practical guidance
          ↓
Add the service to My Checklist
          ↓
Complete and track service-specific tasks
          ↓
Find a verified government office
          ↓
Take action using official information
```

Every major product area supports some part of this journey. AI tools are not isolated utilities; they are connected to service discovery, planning, content creation, and feedback analysis.

## Features

### Government Services

The searchable Government Services directory is backed by the authoritative `public.services` table. Users can search, filter, open service details, ask GovGuide about a service, and add a service to My Checklist.

The current catalogue contains eight services:

1. Smart ID Card.
2. South African Passport.
3. Learner’s Licence.
4. Driving Licence.
5. Motor Vehicle Licence Renewal.
6. Social Grants.
7. UIF Benefits.
8. Business (Company) Registration.

Service details are designed to expose plain-language descriptions, responsible departments, eligibility information, required documents, application steps, costs, processing information, application channels, and official sources where available. Fees, requirements, deadlines, and processing times should always be verified against the relevant official department because they may change.

### Ask GovGuide

Ask GovGuide is a persisted, multi-conversation civic information assistant. Users can create conversations, ask questions, return to previous conversations, search conversation titles, rename conversations, save or unsave conversations, and delete conversations.

User and assistant messages are stored in Supabase. The server-side civic prompt instructs the assistant not to invent government fees, deadlines, addresses, requirements, departments, or URLs. When information may have changed or is uncertain, the assistant directs users to verify it with the relevant official source.

### Content Generator

The Content Generator creates civic content from user-provided:

- Topic.
- Content type.
- Audience.
- Tone.
- Optional instructions.

Generated content is saved only when the user explicitly chooses to save it. Saved content is stored in `saved_content` and can be reviewed or deleted from the Saved Content page.

### Sentiment Analyzer

The Sentiment Analyzer processes citizen feedback and returns structured results, including:

- Total feedback records.
- Positive, neutral, and negative counts.
- Sentiment score.
- Key themes.
- Complaints.
- Observations.
- Insights.

Results are stored in `sentiment_analyses`. Users can generate persisted reports from analysis results, which are displayed on the Reports page.

### My Checklist

Adding a service to My Checklist creates a persistent, service-specific checklist. Checklist items are generated from master templates stored in `service_checklist_templates` and linked to the real service UUID in `public.services`.

Users can:

- Add a government service.
- Review service-specific tasks.
- Mark tasks complete or incomplete.
- Delete individual tasks.
- Delete a service checklist.
- Review progress.
- Open the related service.
- Ask GovGuide for assistance.

Duplicate checklists are prevented using the logical combination of the authenticated `user_id` and the authoritative `service_id`.

### Government offices and Services Map

The map and office finder use `public.offices` as the single source of truth. Normal results are restricted to records with `verification_status = 'verified'`.

The experience supports:

- Service selection.
- Organisation and department filtering.
- Province filtering across all nine South African provinces.
- City and address search.
- Office-name and department search.
- Service aliases and naming normalisation.
- Browser geolocation.
- Nearby-office search.
- Distance display.
- Google Maps directions.
- Official source links.
- Marker selection and details.
- Marker clustering.
- Responsive list and map views.
- Pending-coordinate messaging for verified offices without map coordinates.

The application does not invent office records or coordinates. A verified address and a successfully geocoded map point are treated as separate data-quality concepts.

### Responsive interface

The application uses a civic-teal design system with light and dark themes. Desktop uses a persistent sidebar, while mobile uses a responsive navigation drawer. A final responsive pass addressed horizontal overflow, long-word wrapping, narrow headers, constrained select controls, map-filter stacking, and dropdown overlap.

## Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19 | User interface and component composition. |
| Language | TypeScript | Shared static typing across client and server code. |
| Styling | Tailwind CSS 4 and custom CSS | Brand system, responsive layout, themes, and visual states. |
| Routing | Wouter | Client-side route matching. |
| UI components | Radix primitives and shadcn-style components | Accessible controls and interaction patterns. |
| Backend | Express | Application server and API hosting. |
| API | tRPC 11 | Typed client-server procedures. |
| Validation | Zod | Runtime validation of API inputs. |
| Database | Supabase PostgreSQL | Relational persistence and reference data. |
| Authentication | Supabase Auth | Registration, login, sessions, password reset, and logout. |
| Security | Supabase Row Level Security | Database-level user-data isolation. |
| Geospatial | PostGIS | Geographic points, spatial indexes, and nearby search. |
| Maps | Google Maps JavaScript API | Map rendering, markers, clustering, geocoding, and directions. |
| AI | Manus built-in LLM gateway using `gpt-5-mini` | Civic Q&A, content generation, and sentiment analysis. |
| Testing | Vitest | Automated unit and contract tests. |
| Build | Vite and esbuild | Frontend and server production bundles. |
| Package manager | pnpm | Dependency and script management. |

## Architecture

The application uses a layered architecture:

```text
Browser
  ├── React routes and components
  ├── Supabase browser client
  ├── Authenticated session state
  └── tRPC client
          ↓
Express application server
  ├── tRPC procedures
  ├── Supabase bearer-token authentication
  ├── AI gateway calls
  └── Map data helpers
          ↓
Supabase project
  ├── Supabase Auth
  ├── PostgreSQL tables
  ├── Row Level Security policies
  ├── PostGIS geography
  └── Nearby-office RPC
          ↓
External services
  ├── Google Maps and Geocoding
  └── Manus built-in LLM gateway
```

### Client application

The main client composition is in `client/src/App.tsx`. The application wraps routes with:

- `ErrorBoundary` for runtime error containment.
- `SupabaseAuthProvider` for session and profile state.
- `ThemeProvider` for light and dark mode.
- `TooltipProvider` for accessible tooltips.
- `Toaster` for user notifications.

The main user-data hook is `client/src/hooks/useSupabaseData.ts`. It loads and mutates checklists, saved content, sentiment analyses, conversations, reports, activity, and dashboard statistics. Important writes are followed by a Supabase reload so the UI reflects persisted records rather than only transient React state.

### Server application

The main typed API procedures are in `server/routers.ts`:

| Procedure | Access | Purpose |
|---|---|---|
| `auth.me` | Public | Exposes the server-recognised user when available. |
| `auth.logout` | Public mutation | Clears the legacy application session cookie where applicable. |
| `map.locations` | Public query | Loads map-related location data through the server data helper. |
| `ai.ask` | Protected mutation | Generates Ask GovGuide responses. |
| `ai.generateContent` | Protected mutation | Generates civic content. |
| `ai.analyzeSentiment` | Protected mutation | Produces structured sentiment results. |

Supabase bearer-token authentication for server requests is implemented in `server/_core/supabaseAuth.ts`.

## Repository structure

```text
.
├── client/
│   ├── index.html
│   └── src/
│       ├── components/              # Shared UI and application-shell components
│       ├── contexts/                # Supabase Auth and theme providers
│       ├── hooks/                   # Supabase data and responsive hooks
│       ├── lib/                     # Supabase and tRPC clients
│       ├── pages/                   # Auth, services, map, reports, and app views
│       ├── App.tsx                  # Providers and route table
│       └── index.css                # Brand tokens and global responsive styles
├── server/
│   ├── _core/                      # WebDev server and integration infrastructure
│   ├── db.ts                       # Server-side data helpers
│   ├── routers.ts                  # tRPC procedures and AI procedures
│   ├── storage.ts                  # Storage helper integration
│   └── *.test.ts                   # Vitest tests
├── shared/
│   ├── govguide-map.ts              # Shared map-service types and constants
│   └── types.ts                    # Shared application types
├── supabase/
│   └── migrations/                 # Supabase-specific migrations
├── drizzle/                        # Template-side relational schema and migrations
├── docs/
│   └── GOVGUIDE_AI_DEVELOPMENT_DOCUMENTATION.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## Supabase data model

### Reference tables

| Table | Purpose |
|---|---|
| `departments` | Government departments, organisations, websites, and contact metadata. |
| `services` | Authoritative government-service catalogue. |
| `offices` | Verified government-office records and location fields. |
| `service_checklist_templates` | Read-only ordered master tasks linked to `services`. |

### User-owned tables

| Table | Purpose |
|---|---|
| `profiles` | Profile records linked to `auth.users`. |
| `conversations` | Ask GovGuide conversation headers. |
| `messages` | Conversation messages. |
| `checklists` | User service checklists. |
| `checklist_items` | Tasks belonging to a checklist. |
| `saved_content` | User-saved generated content. |
| `sentiment_analyses` | Persisted sentiment summaries. |
| `sentiment_feedback` | Optional row-level feedback records. |
| `reports` | Persisted analysis reports. |
| `activity` | Recent user activity. |

Every user-owned record should contain a `user_id` linked to the authenticated Supabase user UUID. RLS policies must enforce that users can only access their own records.

### Checklist relationship

```text
public.services
      ↓ services.id
public.service_checklist_templates
      ↓ service_id
public.checklists
      ↓ checklist_id
public.checklist_items
```

The migration at `supabase/migrations/20260909_service_checklist_templates.sql` creates the checklist-template table, index, RLS read policy, and seed data. The current migration seeds **68 ordered templates across the eight authoritative services**.

## Prerequisites

Install the following before starting local development:

- Node.js 22 or a compatible current Node.js release.
- pnpm 10 or compatible pnpm.
- A Supabase project containing the GovGuide AI schema.
- A configured Supabase Auth provider for email/password login.
- Google Maps credentials if map rendering, geocoding, or directions are enabled in the environment.
- Access to the Manus built-in API gateway for server-side AI procedures.

Check installed versions:

```bash
node --version
pnpm --version
```

## Environment configuration

Create a local environment file outside version control, such as `.env.local`, or configure these variables through the deployment environment. Never commit secrets.

### Supabase variables

| Variable | Required | Description |
|---|---:|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe Supabase publishable key. |

The browser Supabase client requires both variables and enables persistent sessions, token refresh, and session detection in the URL.

### WebDev and server integration variables

The WebDev runtime normally supplies the following variables. They are listed here for maintainers who need to understand the server configuration.

| Variable | Purpose |
|---|---|
| `BUILT_IN_FORGE_API_URL` | Manus built-in API gateway base URL. |
| `BUILT_IN_FORGE_API_KEY` | Server-side key for built-in integrations, including the LLM gateway. |
| `DATABASE_URL` | Template-side database connection where applicable. |
| `JWT_SECRET` | Template/server cookie secret. |
| `VITE_APP_ID` | WebDev/Manus application identifier. |
| `OAUTH_SERVER_URL` | OAuth server base URL used by template infrastructure. |
| `OWNER_OPEN_ID` | Project-owner identity used by template infrastructure. |
| `NODE_ENV` | Runtime mode, normally `development` or `production`. |
| `PORT` | Server port, defaulting to `3000`. |

Do not copy production keys into issues, commits, screenshots, documentation, or chat messages.

## Local development

Clone the repository and install dependencies:

```bash
git clone https://github.com/Princely24M/GovGuide-AI-app.git
cd GovGuide-AI-app
pnpm install
```

Configure the required Supabase variables, then start the development server:

```bash
pnpm dev
```

The development server uses the command:

```bash
NODE_ENV=development tsx watch server/_core/index.ts
```

The default local port is `3000`. Open:

```text
http://localhost:3000
```

The WebDev environment may expose the same server through a managed preview URL.

## Database setup

The supplied Supabase project is expected to contain the GovGuide AI relational schema. Apply Supabase migrations through the project’s controlled migration workflow rather than creating a second local mock database.

The repository includes:

```text
supabase/migrations/20260909_service_checklist_templates.sql
```

This migration:

1. Creates `public.service_checklist_templates`.
2. Links templates to `public.services(id)`.
3. Adds an index on `service_id`.
4. Enables Row Level Security.
5. Allows authenticated users to read master templates.
6. Seeds ordered templates for the eight current services.

After applying a migration, verify:

- All expected `public.services` rows exist.
- Every current service has checklist templates.
- User-owned tables have RLS enabled.
- Policies use the authenticated user UUID.
- Verified offices have accurate verification and geocoding metadata.
- The PostGIS nearby-office RPC is available when nearby search is enabled.

Do not put database credentials in frontend code. The browser should use only the Supabase publishable key, while privileged operations must be performed through controlled server or database mechanisms.

## Authentication and security

Authentication is implemented with Supabase Auth through `client/src/contexts/SupabaseAuthContext.tsx`.

Supported account flows include:

- Email/password signup.
- Email/password login.
- Session restoration after refresh.
- Auth-state change subscription.
- Email-confirmation messaging and resend support.
- Password reset email.
- Password update.
- Profile update.
- Logout.

Protected routes include:

```text
/dashboard
/services
/services/:slug
/services-map
/ask-govguide
/content-generator
/sentiment-analyzer
/reports
/checklist
/saved-content
/nearby-offices
/settings
```

Unauthenticated users are redirected to `/login`. The requested destination is preserved as a redirect parameter where applicable.

### RLS principle

Frontend filtering is not a security boundary. Every user-owned table must enforce ownership through Supabase RLS.

```text
Authenticated session
        ↓
Supabase user UUID
        ↓
user_id on the record
        ↓
RLS policy
        ↓
Only the current user's data is accessible
```

When adding a new user-owned table:

1. Add a `user_id` column.
2. Add an index if appropriate.
3. Enable RLS.
4. Add policies for authenticated reads and writes.
5. Test access with two separate users.
6. Confirm that no query relies solely on client-side filtering.

## AI tools

The AI procedures are implemented in `server/routers.ts` and use protected tRPC mutations.

### Ask GovGuide

Input is validated as a bounded array of user and assistant messages. The assistant is given a civic-safety system instruction and returns practical guidance. Conversation persistence is handled through Supabase tables from the client data layer.

### Content Generator

Input fields are validated for topic, content type, audience, tone, and optional instructions. Generated content is not automatically saved; the user must explicitly choose to save it.

### Sentiment Analyzer

Feedback is sent to the AI gateway with a strict JSON schema. The expected response contains counts, score, themes, complaints, observations, and insights. The result is persisted to `sentiment_analyses`, and the user can create a linked report.

### AI failure handling

The server logs provider failures and returns civic-safe fallback content or a fallback analysis structure. Fallback results must not be presented as official government facts. Important details such as fees, deadlines, addresses, and requirements should be verified with official sources.

## Government services and checklists

### Adding a service

To add a new service:

1. Insert the authoritative record into `public.services`.
2. Associate the service with the correct department.
3. Add official source and current metadata.
4. Add ordered rows to `service_checklist_templates`.
5. Add any required service-name normalisation or aliases.
6. Verify directory search and service details.
7. Test Add to Checklist with the database UUID.
8. Test duplicate protection.
9. Test refresh and logout/login persistence.

Do not add a frontend-only service record as a substitute for the database record.

### Checklist creation flow

When a user adds a service, the application:

1. Confirms an active Supabase session.
2. Resolves the service against `public.services`.
3. Uses the actual `services.id` UUID.
4. Checks whether the user already has that service.
5. Creates the parent checklist.
6. Loads ordered master templates.
7. Creates checklist items.
8. Falls back to service metadata when templates are missing.
9. Uses a generic five-step fallback for future valid services with no metadata.
10. Records activity.
11. Reloads from Supabase.
12. Renders the persisted result in My Checklist.

The service must not be rejected merely because a separate frontend catalogue is incomplete.

## Government offices and maps

The Services Map implementation reads verified offices from `public.offices` and resolves department names from `public.departments`.

### Data quality rules

- Do not create fake office records.
- Do not invent coordinates.
- Do not use static JSON as the office source of truth.
- Keep verification status separate from geocoding status.
- Allow a verified office with a valid address to remain in list results even when its map coordinate is pending.
- Only create a marker or directions link when latitude and longitude are valid.

### Nearby search flow

```text
User clicks Find services near me
          ↓
Browser requests location permission
          ↓
Coordinates are received
          ↓
find_nearby_offices PostGIS RPC is called
          ↓
Verified offices are ordered by distance
          ↓
Results and markers are synchronised
          ↓
Map bounds fit the result set
```

A nearby search should use a sensible radius strategy and explain the actual radius to the user. If location permission is denied, show a permission-specific message and offer city or province search instead of reporting a misleading zero-result state.

### Geocoding

Use an approved geocoding service, preferably Google Geocoding for this application. Persist returned coordinates and geocoding metadata to Supabase. Browser-only temporary geocoding is not sufficient because results must work across refreshes, sessions, and devices.

## Testing and validation

Run the main checks from the repository root:

```bash
pnpm check
pnpm test
pnpm run build
```

The project currently includes tests for:

- AI procedure behaviour.
- Authentication logout behaviour.
- Supabase connectivity.
- Supabase production contracts.

The final application was validated with TypeScript checks, the Vitest suite, a production build, dev-server health checks, and responsive UI review.

### Manual acceptance checks

For each of the eight current services:

```text
Open the service
  ↓
Click Add to Checklist
  ↓
Confirm no catalogue error
  ↓
Confirm checklist items are created
  ↓
Refresh the browser
  ↓
Confirm the checklist remains
  ↓
Log out and log in again
  ↓
Confirm the checklist remains
```

Also verify:

- Protected routes redirect correctly.
- Signup, email confirmation, login, logout, and password reset work.
- Saved content persists after refresh.
- Conversations and messages persist.
- Reports are created from saved analyses.
- Map filters work across all nine provinces.
- Offices without coordinates are labelled rather than assigned invented markers.
- Mobile navigation does not overlap content.
- Map dropdown menus remain within their own layout cells.

## Package scripts

| Script | Command | Purpose |
|---|---|---|
| `pnpm dev` | `NODE_ENV=development tsx watch server/_core/index.ts` | Start the development server with watch mode. |
| `pnpm build` | `vite build && esbuild server/_core/index.ts ...` | Build the frontend and server bundles. |
| `pnpm start` | `NODE_ENV=production node dist/index.js` | Run the production server bundle. |
| `pnpm check` | `tsc --noEmit` | Run TypeScript validation. |
| `pnpm test` | `vitest run` | Run the automated test suite. |
| `pnpm format` | `prettier --write .` | Format project files. |
| `pnpm db:push` | `drizzle-kit generate && drizzle-kit migrate` | Generate and apply template-side Drizzle migrations where applicable. |

## Production build and deployment

Build the production assets:

```bash
pnpm check
pnpm test
pnpm run build
```

Start the production bundle locally when needed:

```bash
pnpm start
```

The deployed application is available at:

[https://govguideai-ggyjtx95.manus.space](https://govguideai-ggyjtx95.manus.space)

Before deployment, confirm:

1. Supabase variables are configured.
2. The intended migrations are applied.
3. RLS policies are active.
4. The production build passes.
5. Tests pass.
6. Authentication routes work.
7. A protected route redirects unauthenticated users.
8. A checklist can be created and reloaded.
9. AI procedures return either a valid result or a safe provider-unavailable response.
10. Verified office data loads without fabricated locations.

A prior deployment attempt encountered an infrastructure callback error caused by a Kafka circuit breaker. The issue was not code-related; a retry succeeded after infrastructure recovery.

## Maintenance guide

### Database and reference data

Government service and office information can change. Maintain source URLs, verification dates, geocoding status, and review notes. When changing the schema, create a migration, update the relevant TypeScript data access, update RLS policies, add tests, and rerun the full validation suite.

### Checklist atomicity

The current client flow treats parent checklist creation and item insertion as one user-facing action. A future hardening task should move this operation into a database RPC or server-side transaction so the database guarantees all-or-nothing behaviour.

### Office data

Continue the controlled coordinate-verification process for verified offices with missing latitude or longitude. Never lower an office’s verification status merely because geocoding needs review.

### AI behaviour

Preserve input validation, protected access, civic-safety instructions, uncertainty messaging, structured output schemas, and provider-failure fallbacks when modifying AI procedures.

### Analytics

Some dashboard counts are calculated from loaded activity and report windows. If long-term analytics are required, add dedicated count queries or database views rather than relying on a limited recent-activity window.

## Known limitations and roadmap

Recommended future improvements include:

1. Move checklist creation into an atomic Supabase RPC or server transaction.
2. Complete and continuously monitor verified-office coordinate coverage.
3. Add browser-level end-to-end tests for authentication, checklists, maps, and mobile layouts.
4. Add robust CSV parsing, column mapping, and row-level persistence for sentiment ingestion.
5. Create a reference-data governance workflow for changing government requirements and official links.
6. Add stronger analytics queries for dashboard totals beyond recent activity.
7. Add automated monitoring for official source-link availability and stale verification metadata.

## Contributing

When making changes:

1. Create a focused branch.
2. Read the relevant source and integration guidance before editing.
3. Preserve Supabase as the source of truth for persistent user data.
4. Keep RLS policies aligned with new user-owned tables.
5. Avoid hard-coded government-office data and invented coordinates.
6. Add or update tests for changed behaviour.
7. Run `pnpm check`, `pnpm test`, and `pnpm run build`.
8. Review responsive behaviour at desktop and mobile widths.
9. Update the documentation when architecture or operational procedures change.

## Related documentation

- [Detailed development and maintenance documentation](docs/GOVGUIDE_AI_DEVELOPMENT_DOCUMENTATION.md)
- [Production application](https://govguideai-ggyjtx95.manus.space)
- [Supabase documentation](https://supabase.com/docs)
- [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostGIS documentation](https://postgis.net/documentation/)
- [Google Maps JavaScript API documentation](https://developers.google.com/maps/documentation/javascript/overview)
- [tRPC documentation](https://trpc.io/docs)
- [Vitest documentation](https://vitest.dev/guide/)

## License

This project is licensed under the MIT License as declared in `package.json`.
