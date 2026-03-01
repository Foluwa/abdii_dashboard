# Abidii Dashboard

## Curriculum validation + publishing (Phase 9)

This dashboard integrates with the backend admin curriculum endpoints to validate and publish **courses** and **lesson blueprints** safely.

### Admin endpoints used

- Blueprint:
  - `GET /api/v1/admin/lesson-blueprints/{id}`
  - `POST /api/v1/admin/lesson-blueprints/{id}/validate`
  - `POST /api/v1/admin/lesson-blueprints/{id}/publish`
  - `POST /api/v1/admin/lesson-blueprints/{id}/unpublish`
- Course:
  - `GET /api/v1/admin/courses/{id}`
  - `POST /api/v1/admin/courses/{id}/validate`
  - `POST /api/v1/admin/courses/{id}/publish`
  - `POST /api/v1/admin/courses/{id}/unpublish`

### Read-only endpoints used for UI context

Admin responses intentionally don’t include some “public curriculum” fields (like `availability` or the full curriculum tree), so the UI augments detail pages with:

- `GET /api/v1/lesson-blueprints/{id}` (availability)
- `GET /api/v1/courses/{id}/curriculum` (availability + units/sections overview)

### What a `409` means

`POST .../publish` is **default-deny** and server-authoritative. If the backend returns `409 Conflict`, publishing was blocked.

- The response body still contains `{ blueprint|course, validation }`.
- The UI always renders the returned validation payload and does **not** claim success.

### Local verification

1) Ensure the backend is running and `CORS_ORIGINS` includes the dashboard URL.
2) Set the dashboard API base URL:
	- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
3) Run the dashboard:
	- `npm run dev`
4) Open detail screens directly (UUIDs):
	- Blueprint: `/content/curriculum/lesson-blueprints/<blueprint_id>`
	- Course: `/content/curriculum/courses/<course_id>`
5) Use the **Validate / Publish / Unpublish** buttons and confirm dialogs.

### Tests

- `npm test`

Includes targeted unit tests for 409 publish-block parsing and a component test for the validation viewer.