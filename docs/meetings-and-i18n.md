# Meetings and internationalization

Meetings are contract-scoped resources exposed under `/v1/meetings`. The API derives the host and participants from the authenticated contract parties, persists a cryptographically random `room_id`, and records lifecycle events in the existing audit log. `POST /:id/join` returns the authorized participant role and configured ICE servers. Media stays in browser WebRTC; the authenticated `/meetings` Socket.IO namespace only relays offer, answer, ICE, and participant media-state events.

Configure `WEBRTC_STUN_URL`, and optionally `WEBRTC_TURN_URL`, `WEBRTC_TURN_USERNAME`, and `WEBRTC_TURN_CREDENTIAL` in the backend environment. Never commit TURN credentials. Endpoints are `POST /`, `GET /:id`, `GET /contract/:contractId`, `PATCH /:id`, `POST /:id/start`, `POST /:id/end`, `POST /:id/join`, `POST /:id/leave`, and `DELETE /:id` (cancellation).

The frontend uses i18next with English (`en`), Amharic (`am`), and Afaan Oromoo (`af`) resources. The selected language is persisted in `localStorage` under `nw_language`, falls back to the browser language and then English, and sets `document.dir` for future RTL locales. Add keys to the locale JSON resources and use `useTranslation()` in new UI. User preference is persisted by `PATCH /v1/users/me/preferences`.
