# Video Meetings API & Architecture

## Overview

NexusWork Video Meetings enable secure, contract-scoped real-time video conferences between clients and student freelancers. Audio and video media are transmitted directly peer-to-peer using **WebRTC**, while signaling, room authorization, and lifecycle state changes are handled over the dedicated `/meetings` **Socket.IO** namespace.

## Data Model

Meeting entities are stored in MongoDB under `meetings`:

- `contract_id` (ObjectId, ref: `Contract`): The contract governing the meeting.
- `milestone_id` (ObjectId, optional): Associated milestone.
- `created_by` (ObjectId, ref: `User`): Authenticated creator.
- `host_user_id` (ObjectId, ref: `User`): Meeting host.
- `title` (String): Meeting title.
- `description` (String): Optional description.
- `scheduled_start` (Date): Scheduled start time.
- `scheduled_end` (Date, optional): Scheduled end time.
- `status` (`scheduled` | `waiting` | `active` | `ended` | `cancelled`): Current state.
- `room_id` (String): Cryptographically secure random room token.
- `participants` (Array of `{ user_id, role, joined_at, left_at }`): Authorized participants (`host` or `participant`).

## REST API Endpoints

All endpoints require JWT Authentication (`requireAuth`) and verify contract membership.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/v1/meetings` | Schedule a meeting for a contract |
| `GET` | `/v1/meetings/contract/:contractId` | List meetings for a contract |
| `GET` | `/v1/meetings/:id` | Get details of a meeting |
| `PATCH` | `/v1/meetings/:id` | Update scheduled meeting (Host only) |
| `POST` | `/v1/meetings/:id/start` | Start meeting (Host only) |
| `POST` | `/v1/meetings/:id/end` | End meeting (Host only) |
| `POST` | `/v1/meetings/:id/join` | Join meeting & obtain ICE servers |
| `POST` | `/v1/meetings/:id/leave` | Leave meeting |
| `DELETE` | `/v1/meetings/:id` | Cancel meeting (Host only) |

## Socket.IO Signaling Events (`/meetings` namespace)

- `meeting:join` — Connect to meeting room with `{ room_id }`.
- `meeting:leave` — Leave meeting room.
- `webrtc:offer` — Send WebRTC SDP offer to target user.
- `webrtc:answer` — Send WebRTC SDP answer to target user.
- `webrtc:ice-candidate` — Exchange ICE candidates.
- `meeting:mute` / `meeting:unmute` — Audio state broadcasts.
- `meeting:camera-on` / `meeting:camera-off` — Video state broadcasts.
- `meeting:participant-joined` / `meeting:participant-left` — Room presence notifications.

## ICE Configuration & Environment Variables

- `WEBRTC_STUN_URL` — Public STUN server (default: `stun:stun.l.google.com:19302`).
- `WEBRTC_TURN_URL` — Production TURN server URL (optional).
- `WEBRTC_TURN_USERNAME` — TURN authentication username (optional).
- `WEBRTC_TURN_CREDENTIAL` — TURN authentication credential (optional).
