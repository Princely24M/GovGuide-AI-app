# GovGuide AI Development Documentation

**Document type:** Technical development record and maintenance guide  
**Application:** GovGuide AI  
**Author:** Manus AI  
**Status:** Production deployment completed  
**Production URL:** [https://govguideai-ggyjtx95.manus.space](https://govguideai-ggyjtx95.manus.space)

## 1. Executive Summary

GovGuide AI is a full-stack South African civic technology platform that helps people discover government services, understand application requirements, obtain AI-assisted guidance, manage service-related tasks, locate government offices, generate civic content, and analyse citizen feedback.

The application was developed as a new React and TypeScript web application on the WebDev platform. Its production data layer uses the user’s existing Supabase project. Supabase Auth provides real account registration, login, password recovery, email confirmation support, session management, and logout. Supabase PostgreSQL stores government reference data and all user-owned records. Row Level Security (RLS) policies isolate user data at the database layer.

The central product journey is:

> **Find a government service → Understand it → Get AI guidance → Add tasks to a checklist → Find the relevant office → Take action.**

The final implementation includes a branded civic-teal interface, responsive desktop and mobile navigation, persistent checklists, persisted AI conversations, saved content, sentiment analyses, reports, activity history, a verified-office map, PostGIS-backed nearby-office search, and server-side AI procedures.

## 2. Project Objectives

The development brief established five primary objectives.

| Objective | Implementation result |
|---|---|
| Make South African government services easier to discover | A searchable Government Services directory and service-first map experience were implemented. |
| Explain services in practical language | Service pages expose descriptions, departments, eligibility, documents, steps, costs, processing information, application channels, and official sources where available. |
| Connect AI features to the service journey | Ask GovGuide, Content Generator, and Sentiment Analyzer are presented as related civic tools rather than unrelated AI utilities. |
| Persist important user data | Checklists, checklist items, conversations, messages, saved content, analyses, reports, profiles, and activity are stored in Supabase. |
| Provide reliable office discovery | Verified records from `public.offices` are used as the source of truth, with coordinate-aware map results, filtering, geolocation, directions, and data-quality messaging. |

The build explicitly avoided mock users, fake authentication, LocalStorage as a primary database, static office data, fabricated coordinates, and a second service catalogue.

## 3. Product Scope

### 3.1 Core user-facing capabilities

Authenticated users can access the following application areas:

| Area | Route | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Personalised entry point showing service discovery, Ask GovGuide, checklist progress, office coverage, saved-content statistics, report statistics, and recent activity. |
| Government Services | `/services` | Browse, search, filter, and open government-service records. |
| Service detail | `/services/:slug` | Review a service and add it to My Checklist or ask the assistant with service context. |
| Services Map | `/services-map` | Find verified offices by service, organisation, province, city, search term, distance, and map interaction. |
| Ask GovGuide | `/ask-govguide` | Conduct persisted conversations with the civic information assistant. |
| Content Generator | `/content-generator` | Generate civic content from user-provided topic, content type, audience, tone, and instructions. |
| Sentiment Analyzer | `/sentiment-analyzer` | Analyse direct feedback or multiple feedback entries and produce persisted results. |
| Reports | `/reports` | View and delete generated sentiment reports. |
| My Checklist | `/checklist` | Review service-specific tasks, mark tasks complete, delete items, and remove checklists. |
| Saved Content | `/saved-content` | View and delete generated content saved by the user. |
| Nearby Offices | `/nearby-offices` | Access the office-finder flow. The item was removed from the left sidebar during the final navigation refinement, but the route remains available through the application flow. |
| Settings | `/settings` | Update profile and account preferences, including theme and password-related actions. |

Unauthenticated users can access the public landing page and authentication routes. Protected application routes redirect unauthenticated visitors to `/login` with the original destination encoded as a redirect parameter.

### 3.2 Supported government-service catalogue

The authoritative service records are stored in `public.services`. The implemented catalogue contains eight services:

1. Smart ID Card.
2. South African Passport.
3. Learner’s Licence.
4. Driving Licence.
5. Motor Vehicle Licence Renewal.
6. Social Grants.
7. UIF Benefits.
8. Business (Company) Registration.

The interface includes normalisation and alias handling for naming differences such as apostrophe styles, Smart ID naming, vehicle-licence naming, and business-registration naming. The database UUID, rather than a slug or display label, is used as the checklist foreign key.

### 3.3 South African provincial coverage

The map filters support all nine South African provinces:

| Province | Supported |
|---|---:|
| Eastern Cape | Yes |
| Free State | Yes |
| Gauteng | Yes |
| KwaZulu-Natal | Yes |
| Limpopo | Yes |
| Mpumalanga | Yes |
| Northern Cape | Yes |
| North West | Yes |
| Western Cape | Yes |

## 4. Technology Stack

| Layer | Technology | Role in the application |
|---|---|---|
| Frontend | React 19 | Component-based user interface and application state composition. |
| Language | TypeScript | Shared type safety across client and server code. |
| Styling | Tailwind CSS 4 and custom CSS tokens | Responsive layout, civic brand system, themes, spacing, and visual states. |
| Routing | Wouter | Lightweight route matching for public, protected, service, AI, map, and settings routes. |
| UI components | shadcn-style components and Radix primitives | Accessible buttons, dialogs, selects, tabs, sheets, alerts, menus, and form controls. |
| Backend | Express-based WebDev server | Serves the application and exposes the tRPC API. |
| API contract | tRPC 11 | Typed client-server procedures for AI and map-related backend operations. |
| Validation | Zod | Runtime validation of tRPC inputs. |
| Database | Supabase PostgreSQL | Persistent relational application data and government reference data. |
| Authentication | Supabase Auth | Email/password registration, login, session persistence, confirmation, reset, profile state, and logout. |
| Security | Supabase Row Level Security | Database-enforced isolation of user-owned records. |
| Geospatial database | PostGIS | Geographic points, spatial indexing, and nearby-office calculations. |
| Map provider | Google Maps JavaScript API | Map display, markers, directions, geocoding integration, and marker clustering. |
| AI integration | Manus built-in LLM gateway using `gpt-5-mini` | Server-side civic assistance, content generation, and structured sentiment analysis. |
| Testing | Vitest | Unit and integration-style tests for AI procedures, connectivity, authentication, and production contracts. |
| Build | Vite and esbuild | Frontend production bundle and server bundle. |
| Package manager | pnpm | Dependency installation and project scripts. |

## 5. High-Level Architecture

The application uses a layered architecture.

```text
Browser
  |
  | React routes, components, Supabase client, authenticated session
  v
Client application
  |
  | Direct Supabase queries for user-owned data and reference data
  | tRPC calls for server-side AI and map procedures
  v
Application server
  |
  | Express + tRPC
  | Supabase bearer-token authentication
  | AI gateway integration
  | Map data helpers
  v
Supabase project
  |
  | Supabase Auth
  | PostgreSQL tables
  | RLS policies
  | PostGIS geography and RPC functions
  v
External services
  |
  | Google Maps JavaScript API and geocoding services
  | Manus built-in LLM gateway
```

### 5.1 Client composition

`client/src/App.tsx` is the top-level composition point. It wraps the application with:

- `ErrorBoundary` for runtime error containment.
- `SupabaseAuthProvider` for session and profile state.
- `ThemeProvider` for light and dark themes.
- `TooltipProvider` for accessible tooltips.
- `Toaster` for user-facing success and error notifications.
- Wouter route definitions for public and protected pages.

`ProtectedHome` checks the Supabase session before rendering authenticated application content. While authentication is loading, the user sees a secure-session loading state. If no user is available, the browser is redirected to the login route.

### 5.2 Data-access composition

`client/src/hooks/useSupabaseData.ts` is the main client data hook. It loads and manages:

- Checklists and checklist items.
- Saved content.
- The latest sentiment analysis.
- Conversations and messages.
- Reports.
- Recent activity.
- Dashboard statistics.

The hook scopes queries by the authenticated user UUID and also relies on Supabase RLS. After important writes, it reloads database state so the rendered UI reflects persisted records rather than only a temporary React object.

### 5.3 Server composition

`server/routers.ts` defines the typed tRPC procedures:

| Procedure | Access | Purpose |
|---|---|---|
| `auth.me` | Public procedure | Exposes the server-recognised session user when available. |
| `auth.logout` | Public mutation | Clears the legacy application session cookie where applicable. Supabase Auth logout is handled by the client auth context. |
| `map.locations` | Public query | Provides map-related location data through the server data helper. |
| `ai.ask` | Protected mutation | Sends validated conversation messages to the civic AI assistant. |
| `ai.generateContent` | Protected mutation | Generates civic content from validated user parameters. |
| `ai.analyzeSentiment` | Protected mutation | Produces structured sentiment results from user-supplied feedback. |

The server authenticates Supabase bearer tokens through `server/_core/supabaseAuth.ts`. AI requests use `protectedProcedure`, which prevents unauthenticated use of the AI procedures.

## 6. Supabase Integration and Security

### 6.1 Project connection

The application is configured to use the existing Supabase project through environment variables:

- `VITE_SUPABASE_URL` for the project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY` for the browser-safe publishable key.

The Supabase client is created in `client/src/lib/supabase.ts`. It uses the Supabase JavaScript SDK and enables session persistence appropriate for browser use.

Secrets are not hard-coded into application source files. Deployment environments must provide the required variables through the project configuration.

### 6.2 Authentication lifecycle

The authentication context in `client/src/contexts/SupabaseAuthContext.tsx` implements the following lifecycle:

1. Load the existing session with `supabase.auth.getSession()`.
2. Subscribe to changes with `supabase.auth.onAuthStateChange()`.
3. Expose `loading`, `session`, `user`, `profile`, and `error` to the application.
4. Load the matching profile from `public.profiles` using the authenticated user UUID.
5. Convert low-level authentication errors into safe, user-readable messages.
6. Support sign-in, sign-up, sign-out, password reset, password update, profile update, confirmation resend, and profile refresh.

The application does not display raw Supabase errors directly to users. For example, invalid credentials, duplicate registration, unconfirmed email, password-length errors, and rate-limit errors are converted into clear messages.

### 6.3 User-owned data model

User-specific records contain a `user_id` column linked to the authenticated Supabase user. This supports both application-level scoping and database-level RLS.

The principal user-owned tables are:

| Table | Purpose |
|---|---|
| `profiles` | User profile metadata associated with `auth.users`. |
| `conversations` | Persisted Ask GovGuide conversations. |
| `messages` | User and assistant messages belonging to conversations. |
| `checklists` | User service checklists. |
| `checklist_items` | Tasks belonging to a checklist. |
| `saved_content` | Content explicitly saved by the user. |
| `sentiment_analyses` | Persisted sentiment-analysis summaries. |
| `sentiment_feedback` | Optional detailed feedback records associated with an analysis. |
| `reports` | Persisted generated reports. |
| `activity` | User activity history used by the dashboard. |

Government reference tables are separate:

| Table | Purpose |
|---|---|
| `departments` | Government departments and source metadata. |
| `services` | Authoritative government-service catalogue. |
| `offices` | Verified government-office records and map fields. |
| `service_checklist_templates` | Read-only master checklist templates linked to services. |

### 6.4 Row Level Security principle

RLS is the final security boundary. Frontend filters are not treated as sufficient protection.

The intended access pattern is:

```text
Supabase authenticated session
        ↓
Authenticated user UUID
        ↓
user_id on application records
        ↓
Supabase RLS policy
        ↓
Only the current user's records are readable or writable
```

Reference data can be readable to authenticated users as appropriate. Master checklist templates are readable to authenticated users but are not intended to be modified by normal users.

## 7. Government Services Implementation

### 7.1 Service directory

The Government Services directory is designed around the authoritative `public.services` table. It supports search, category filtering, service cards, service details, and checklist actions.

The implementation keeps the service display architecture extensible. Additional records can be added to the database without requiring a second frontend catalogue. Service slugs are used for navigation, but database UUIDs are used for relationships and persistence.

### 7.2 Service detail experience

A service detail view is intended to expose the service in plain language and connect the user to an action. The page may include:

- Overview.
- Responsible department.
- Eligibility information.
- Required documents.
- Application steps.
- Cost information where verified.
- Processing time where verified.
- Online and physical application channels.
- Official source link.
- Add to My Checklist action.
- Ask GovGuide action with service context.

Information that can change, such as fees, processing times, requirements, and deadlines, must be verified against the relevant official source before being treated as definitive.

### 7.3 AI safety behaviour

The server-side civic system prompt instructs the assistant not to invent fees, deadlines, addresses, requirements, departments, or URLs. When a detail may change or is uncertain, the assistant is instructed to tell users to verify it with the relevant official department.

This safety constraint is important because the platform provides civic guidance rather than legal or official administrative determinations.

## 8. Checklist System Development

### 8.1 Problem addressed

The initial checklist flow could reject valid services because a frontend or authenticated catalogue did not match the authoritative Supabase service records. This produced an incorrect message stating that a service was not available in the verified catalogue.

The final implementation removes that dependency and resolves services against `public.services`.

### 8.2 Authoritative relationship

The final checklist relationship is:

```text
public.services
      |
      | services.id
      v
service_checklist_templates
      |
      v
checklists
      |
      v
checklist_items
```

The actual `services.id` UUID is used when creating a checklist. The application does not use a slug, name, hard-coded identifier, or frontend-generated identifier as the foreign key.

### 8.3 Checklist creation flow

When a user selects **Add to Checklist**, the application:

1. Confirms that a Supabase user session is available.
2. Loads the public services table.
3. Normalises the requested slug and name.
4. Resolves known naming aliases.
5. Uses the matched service UUID.
6. Checks for an existing checklist with the same `user_id` and `service_id`.
7. Returns the existing checklist when a duplicate is found.
8. Creates a new checklist when no duplicate exists.
9. Loads ordered templates from `service_checklist_templates`.
10. Creates checklist items from those templates.
11. Uses service application steps and required documents as a secondary source when templates are unavailable.
12. Uses a five-step generic fallback for future valid services with no configured metadata.
13. Records the addition in `activity`.
14. Reloads checklist data from Supabase.
15. Displays the persisted checklist in My Checklist.

The duplicate-safe key is the logical combination of `user_id` and `service_id`.

### 8.4 Checklist template migration

The migration `supabase/migrations/20260909_service_checklist_templates.sql` creates:

- `public.service_checklist_templates`.
- A foreign key to `public.services(id)` with cascading deletion.
- An index on `service_id`.
- RLS enablement.
- A read policy for authenticated users.
- Seed data linked by normalised service names.

The final seeded dataset contains **68 ordered templates across the eight authoritative services**. Template counts vary by service. Business registration has eleven steps, UIF has nine, and most other services have eight.

### 8.5 Checklist operations

Users can:

- Mark checklist items complete or incomplete.
- Delete individual checklist items.
- Delete a parent checklist.
- Review progress from persisted item state.
- Return to the related service.
- Ask GovGuide for assistance.

The UI applies a responsive update for immediate feedback and then reloads from Supabase. This provides responsiveness without making transient client state the source of truth.

### 8.6 Partial-creation consideration

The client implementation treats checklist creation and item insertion as one user-facing operation and reports a safe error if either write fails. The data model and deletion behaviour are designed to prevent the user from working with a misleading empty checklist. A future hardening step should move the two-write operation into a database RPC or server transaction so atomicity is enforced by the database rather than by client orchestration alone.

## 9. Ask GovGuide and AI Features

### 9.1 Ask GovGuide

Ask GovGuide accepts a bounded list of user and assistant messages. The server validates message roles and content length before invoking the LLM gateway. The conversation flow is:

```text
User question
      ↓
Persist user message
      ↓
Call protected server AI procedure
      ↓
Receive assistant answer
      ↓
Persist assistant message
      ↓
Update conversation title and activity
      ↓
Reload conversation history
```

Users can create new conversations, search conversations, open previous conversations, rename them, save or unsave them, and delete them. Conversation messages are loaded from Supabase rather than recreated from a local-only state.

### 9.2 Content Generator

The Content Generator accepts:

- Topic.
- Content type.
- Audience.
- Tone.
- Optional instructions.

The server sends these values to the LLM with civic-safety instructions. Content is saved only when the user selects the save action. Saved records include title, content type, topic, audience, tone, content, and timestamps.

### 9.3 Sentiment Analyzer

The Sentiment Analyzer accepts direct text or multiple feedback entries. The server requests structured JSON output using a schema containing:

- Total record count.
- Positive count.
- Neutral count.
- Negative count.
- Sentiment score.
- Themes.
- Complaints.
- Observations.
- Insights.

The result is persisted to `sentiment_analyses`. The application can then create a report record linked to the analysis. The implementation includes a safe fallback response when the AI service is temporarily unavailable, while logging the underlying server error for diagnosis.

### 9.4 AI failure handling

AI procedures catch gateway failures and return useful, civic-safe fallback messages or structured fallback analysis. This prevents the interface from becoming unusable during a temporary provider outage. It does not represent fallback content as official government information.

## 10. Government Offices and Map Development

### 10.1 Data-quality issue

The office feature originally returned no nearby results because verified office records had valid addresses but missing coordinates. A distance query that required coordinates therefore excluded otherwise valid offices.

The correction preserved data integrity rather than inventing coordinates. Verified offices remain verified independently of their geocoding status.

### 10.2 Single source of truth

All office results originate from `public.offices`. The application does not use hard-coded office arrays, mock markers, static JSON locations, or a second office catalogue.

The normal map query filters to `verification_status = 'verified'`. Offices without coordinates can remain visible in the list with a **Map location pending** message, but they do not receive map markers or directions until valid coordinates are available.

### 10.3 Office fields used by the application

The map layer reads fields such as:

- Office ID.
- Department ID.
- Office name.
- Address.
- City.
- Province.
- Postal code.
- Latitude.
- Longitude.
- Phone.
- Email.
- Opening hours.
- Services supported.
- Official source URL.
- Source name.
- Verification status.
- Verification date.
- Geocoding status.

Department names are resolved from `public.departments`, and office service arrays are normalised before being matched to map-service filters.

### 10.4 Geocoding policy

The controlled geocoding process is designed to use an approved geocoding service, preferably Google Geocoding because the application already uses Google Maps. The input combines the office name, physical address, city, province, postal code, and South Africa.

Coordinates must be persisted to Supabase. Browser-only temporary geocoding is insufficient because the result must work after refresh, logout, login, and on another device.

Geocoding metadata separates location quality from source verification:

| Concept | Example values |
|---|---|
| Verification status | `verified`, `needs_review` |
| Geocoding status | `geocoded`, `failed`, `needs_review` |
| Geocoding source | `Google Geocoding` |
| Geocoding accuracy | Provider-specific accuracy classification |

A verified address must not be downgraded merely because geocoding is incomplete.

### 10.5 Map interactions

The final map experience supports:

- Initial loading of verified offices from Supabase.
- Service selection.
- Service-category filtering.
- Organisation filtering.
- Province filtering.
- City and address searching.
- Text search across office name, department, city, province, address, and mapped service aliases.
- Browser geolocation.
- Distance display.
- Map/list synchronisation.
- Marker selection and detail cards.
- Official source links.
- Google Maps directions.
- Marker clustering through `@googlemaps/markerclusterer`.
- Bounds fitting around visible results.
- Pending-coordinate messaging.
- Mobile list/map switching.

The map starts with a nationwide South Africa view rather than a hard-coded city. Filters are composable, so a user can combine service, organisation, province, city, and search constraints.

### 10.6 Nearby search behaviour

The intended nearby flow is:

```text
User selects Find services near me
      ↓
Browser requests location permission
      ↓
Latitude and longitude are received
      ↓
Supabase/PostGIS nearby search is called
      ↓
Verified offices are ordered by distance
      ↓
Results and markers are displayed
      ↓
Map bounds fit the returned offices
```

The search should begin at 25 km, expand to 50 km and then 100 km when appropriate, and explain the actual radius shown. If location permission is denied, the user should be told that location access is required and offered city or province search instead of receiving a misleading zero-result message.

## 11. User Interface and Responsive Design

### 11.1 Brand system

The UI uses a civic-teal visual system based on the following tokens:

| Token | Hex value | Usage |
|---|---|---|
| Civic Teal | `#087E8B` | Primary actions, active states, links, and important controls. |
| Deep Teal / Ink | `#073B4C` | Sidebar, headers, dark surfaces, and primary dark text. |
| Teal Glow | `#46B5C2` | AI accents, hover states, highlights, and secondary interactions. |
| Warm Gold | `#F4C95D` | Important highlights, notifications, and status indicators. |
| Off White | `#F7FAFA` | Main light application background. |
| Border | `#DDE7E9` | Low-contrast borders and separators. |
| Muted Text | `#64748B` | Supporting text and secondary metadata. |
| Success | `#2E8B57` | Verified and positive states. |
| Warning | `#D99A00` | Caution states. |
| Error | `#C94C4C` | Error states. |

The supplied GovGuide AI logo was integrated into the shared branded Logo component and reused across the landing page, preview card, and dashboard sidebar.

### 11.2 Navigation changes

The original product brief requested Nearby Offices in the sidebar. During refinement, the user requested its removal from the left navigation. The final build removes it from the sidebar while preserving the route and map capability through the Services Map flow.

Desktop uses a persistent sidebar. Mobile uses a responsive navigation drawer with the same general hierarchy. AI Tools remains grouped and collapsible.

### 11.3 No-overlap pass

A final responsive pass addressed content overlap across the application. The changes included:

- Global horizontal-overflow containment.
- Long-word wrapping.
- Safer authenticated-shell widths.
- Narrow-screen header constraints.
- Safer mobile header controls.
- Full-width, constrained Select triggers.
- Text truncation for long selected values.
- Page-level stacking context for map filters.
- Responsive filter containment.
- Filter dropdown sizing from its own trigger.

Visual verification confirmed the public application rendered cleanly. Direct visual capture of protected pages required an authenticated browser session, so protected route QA was supplemented with type checks, tests, builds, and application-level validation.

## 12. Testing and Validation

### 12.1 Automated validation

The final implementation passed the following validation categories:

| Validation | Result |
|---|---|
| TypeScript check | Passed. |
| Vitest suite | Passed; six tests across four test files were recorded in the final checkpoints. |
| Production build | Passed. |
| Supabase connectivity | Covered by connectivity tests and production-contract tests. |
| AI procedure tests | Passed for the server-side AI procedures. |
| Authentication contract tests | Passed for the relevant authentication behaviour. |
| Dev server health | Confirmed running on the WebDev-managed server. |
| Responsive visual review | Public pages rendered cleanly; protected pages require an authenticated session for direct capture. |

### 12.2 Test commands

Run the following commands from the project root:

```bash
cd /home/ubuntu/govguide-ai
pnpm check
pnpm test
pnpm run build
```

The available package scripts are:

| Script | Command | Purpose |
|---|---|---|
| `dev` | `NODE_ENV=development tsx watch server/_core/index.ts` | Start the development server with file watching. |
| `build` | `vite build && esbuild ...` | Build the frontend and bundled server. |
| `start` | `NODE_ENV=production node dist/index.js` | Start the production server bundle. |
| `check` | `tsc --noEmit` | Run TypeScript validation without emitting files. |
| `format` | `prettier --write .` | Format the project. |
| `test` | `vitest run` | Run the automated test suite. |
| `db:push` | `drizzle-kit generate && drizzle-kit migrate` | Generate and apply Drizzle migrations where applicable to the template database. |

### 12.3 Functional acceptance checklist

For each of the eight services, the intended acceptance flow is:

```text
Open service
  ↓
Select Add to Checklist
  ↓
No catalogue error
  ↓
Checklist and service-specific items are created
  ↓
Refresh the browser
  ↓
Checklist remains
  ↓
Log out and log in again
  ↓
Checklist remains
```

The same validation should be repeated for the map filters across all nine provinces, the three AI tools, saved content, reports, password recovery, and mobile navigation.

## 13. Development Milestones

The major implementation milestones were recorded as WebDev checkpoints.

| Milestone | Result |
|---|---|
| Initial product foundation | Branded civic-teal system, landing page, dashboard shell, services, checklist, offices, saved content, settings, and AI tool surfaces. |
| Services Map | Added service-first map, service recognition, organisation and province filters, city search, distance sorting, geolocation fallback, marker selection, directions, and responsive map/list views. |
| Supabase migration | Connected browser Auth, profiles, RLS-scoped user data, persisted AI and checklist data, office reference data, and protected routes. |
| Reports and conversations | Added persisted reports, report page, multi-conversation Ask GovGuide, search, save/unsave, rename, delete, and message persistence. |
| Checklist repair | Fixed service matching, duplicate prevention, service-specific task generation, immediate UI refresh, and fallback tasks. |
| Brand asset integration | Added the supplied logo and removed Nearby Offices from the left sidebar. |
| Service template migration | Made `public.services` authoritative, created `service_checklist_templates`, and seeded 68 templates across eight services. |
| Office data repair | Made `public.offices` the map source of truth, supported verified offices without coordinates, added metadata and nearby-search architecture, and avoided invented locations. |
| Filter layout repair | Fixed map filter-grid sizing, stacking, and dropdown separation. |
| Responsive no-overlap pass | Added global overflow containment, safer widths, constrained selects, mobile header improvements, and filter containment. |
| Production deployment | Deployment completed successfully after a transient infrastructure callback failure was retried. |

## 14. Deployment

The application was deployed to:

[https://govguideai-ggyjtx95.manus.space](https://govguideai-ggyjtx95.manus.space)

A previous deployment attempt failed with:

```text
deployment failed: failed to send callback via kafka: cannot produce message ...: circuit breaker is open
```

The failure was identified as an infrastructure callback problem rather than an application-code failure. The deployment was retried after the circuit breaker recovered, and the production deployment completed successfully.

### 14.1 Deployment checklist

Before a future deployment, verify:

1. Supabase environment variables are present in the deployment environment.
2. The production build succeeds locally or in the WebDev validation environment.
3. `pnpm check` passes.
4. `pnpm test` passes.
5. Database migrations are applied to the intended Supabase project.
6. RLS policies are enabled and tested.
7. The production URL loads the landing page.
8. Login and signup can reach Supabase Auth.
9. A protected route redirects unauthenticated users.
10. An authenticated user can create a checklist and see it after refresh.
11. AI procedures return safe results or a clear provider-unavailable state.
12. The Services Map loads verified office data.
13. Official links and directions do not use invented records or coordinates.

## 15. Operations and Maintenance Guide

### 15.1 Adding a new government service

To add a new service safely:

1. Insert the authoritative record into `public.services`.
2. Associate it with the correct department.
3. Add current service metadata and official source information.
4. Add ordered rows to `service_checklist_templates`.
5. Add any map-service normalisation required for office service arrays.
6. Confirm that the service appears in the directory and detail page.
7. Test Add to Checklist using the database UUID.
8. Confirm duplicate protection.
9. Confirm persistence after refresh and re-authentication.
10. Confirm that any costs, requirements, or deadlines are clearly marked for verification when they may change.

Do not create a frontend-only catalogue entry as a substitute for the database record.

### 15.2 Adding or correcting an office

To add or correct an office:

1. Update `public.offices` with an authoritative record.
2. Preserve the correct verification status.
3. Use an approved geocoding process for coordinates.
4. Store geocoding metadata and source.
5. Confirm latitude and longitude are within valid ranges.
6. Confirm the PostGIS geography point is correctly derived using longitude first and latitude second.
7. Confirm the record appears in list results when verified.
8. Confirm marker and direction behaviour when coordinates are valid.
9. Confirm province, department, service, and text filters.

Never use guessed coordinates merely to create a marker.

### 15.3 Updating AI behaviour

AI prompts and procedures are in `server/routers.ts` and the related LLM integration helpers. Any change should preserve:

- Protected access for user-specific AI tools.
- Input bounds and Zod validation.
- Civic safety instructions.
- Explicit uncertainty around changing government information.
- Safe fallback behaviour.
- Tests for successful and failure paths.

If a new structured AI output is introduced, define a strict schema and test malformed output handling.

### 15.4 Updating the database

Database changes should be made through a migration rather than an ad hoc frontend assumption. For Supabase-specific changes:

1. Write a migration under `supabase/migrations/`.
2. Include indexes, foreign keys, defaults, and RLS policies where relevant.
3. Apply it to the intended Supabase project.
4. Verify the schema and policies.
5. Update the relevant TypeScript types and data-access code.
6. Add or update tests.
7. Run `pnpm check`, `pnpm test`, and `pnpm run build`.

## 16. Known Limitations and Recommended Future Improvements

The final application is functionally complete, but the following improvements are recommended for future iterations.

### 16.1 Make checklist creation atomic

The current client flow creates the checklist and then creates its items. A database RPC or server-side transaction would guarantee that both operations either succeed together or roll back together. This is the strongest next improvement for data consistency.

### 16.2 Complete coordinate coverage

The final map intentionally distinguishes verified addresses from verified map points. Offices with missing or uncertain coordinates should continue through the controlled geocoding and review workflow. Coordinate coverage should be monitored with a query that reports verified offices lacking valid latitude and longitude.

### 16.3 Add comprehensive end-to-end tests

The automated suite covers core contracts, but a future browser test suite should exercise:

- Signup and email-confirmation states.
- Login and logout.
- Password recovery.
- All eight service checklist additions.
- Duplicate checklist attempts.
- Checklist persistence after re-authentication.
- Map filters across all nine provinces.
- Geolocation-denied and no-result states.
- AI provider failure states.
- Mobile navigation and dropdown layering.

### 16.4 Improve activity statistics

The dashboard currently derives some counts from the loaded activity window. A production analytics requirement may justify dedicated count queries or database views so totals remain accurate beyond the most recent activity rows.

### 16.5 Strengthen reference-data governance

Government services, requirements, fees, processing times, office addresses, and opening hours can change. A future administration workflow should track source URLs, verification timestamps, review status, and change history for reference data.

### 16.6 Improve structured sentiment ingestion

The current Sentiment Analyzer supports direct and multiple-text input. A future release can add robust CSV parsing, column mapping, row-level validation, privacy controls, and persisted `sentiment_feedback` records for every analysed row.

## 17. File and Directory Guide

| Path | Responsibility |
|---|---|
| `client/src/App.tsx` | Providers, public routes, protected routes, and top-level routing. |
| `client/src/pages/Home.tsx` | Main application controller and route-dispatched product views. |
| `client/src/pages/Auth.tsx` | Login, signup, password reset, and confirmation-related UI. |
| `client/src/pages/GovernmentServicesMap.tsx` | Services Map data loading, filters, list/map synchronisation, markers, clustering, and directions. |
| `client/src/pages/Reports.tsx` | Persisted report list and report actions. |
| `client/src/contexts/SupabaseAuthContext.tsx` | Supabase Auth session, profile, and account actions. |
| `client/src/hooks/useSupabaseData.ts` | Supabase-backed user data loading and mutations. |
| `client/src/lib/supabase.ts` | Browser Supabase client configuration. |
| `client/src/components/DashboardLayout.tsx` | Authenticated shell, sidebar, header, and responsive navigation. |
| `client/src/components/Map.tsx` | Google Maps loading and map wrapper. |
| `client/src/index.css` | Global design tokens, responsive safeguards, and theme styling. |
| `server/routers.ts` | tRPC procedures for authentication compatibility, map data, and AI tools. |
| `server/db.ts` | Server database helpers and location data access. |
| `server/_core/supabaseAuth.ts` | Supabase bearer-token authentication for server requests. |
| `server/ai.test.ts` | AI procedure tests. |
| `server/supabase.connectivity.test.ts` | Supabase connection validation. |
| `server/supabase.production-contract.test.ts` | Production data-contract tests. |
| `supabase/migrations/20260909_service_checklist_templates.sql` | Checklist-template table, RLS, index, and seed data. |
| `shared/govguide-map.ts` | Shared map-service, province, category, and location types/constants. |
| `drizzle/schema.ts` | Template-side relational schema definitions retained by the WebDev project. |
| `package.json` | Dependency metadata and development, test, build, and start scripts. |

## 18. Conclusion

GovGuide AI was developed as a connected civic-service platform rather than a collection of isolated screens. The implementation links service discovery, plain-language explanation, AI assistance, checklist generation, office search, persistence, and user activity into one workflow.

The most important engineering decisions were the use of the existing Supabase project as the production source of truth, database-enforced user isolation through RLS, service UUID-based checklist relationships, service-specific template generation, verified-office filtering, coordinate integrity, and safe AI uncertainty handling.

The application is deployed and available at [https://govguideai-ggyjtx95.manus.space](https://govguideai-ggyjtx95.manus.space). Future work should prioritise atomic checklist transactions, continued office geocoding and verification, end-to-end browser coverage, and governance processes for changing government reference information.

## References

[1]: https://react.dev/ "React documentation"

[2]: https://www.typescriptlang.org/docs/ "TypeScript documentation"

[3]: https://supabase.com/docs "Supabase documentation"

[4]: https://supabase.com/docs/guides/auth "Supabase Auth documentation"

[5]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"

[6]: https://postgis.net/documentation/ "PostGIS documentation"

[7]: https://developers.google.com/maps/documentation/javascript/overview "Google Maps JavaScript API documentation"

[8]: https://developers.google.com/maps/documentation/geocoding/overview "Google Geocoding API documentation"

[9]: https://trpc.io/docs "tRPC documentation"

[10]: https://vitest.dev/guide/ "Vitest documentation"

[11]: https://vite.dev/guide/ "Vite documentation"

[12]: https://www.radix-ui.com/primitives/docs/overview/introduction "Radix Primitives documentation"

[13]: https://github.com/googlemaps/js-markerclusterer "Google Maps JavaScript marker clustering library"
