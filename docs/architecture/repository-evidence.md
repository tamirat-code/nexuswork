# Repository-integrated work evidence

Repository evidence is a descriptive audit trail for contracted work. It is
not an automatic performance score and must not be used as a proxy for student
worth, identity, or code quality.

## Flow

1. The contracted student starts OAuth from `/contracts/:id/evidence` and
   chooses one exact GitHub or GitLab repository.
2. The backend stores a short-lived, single-use OAuth state containing the
   contract, student, provider, and normalized repository name.
3. The callback exchanges the code, identifies the provider account, verifies
   repository access, and stores only an AES-GCM encrypted token.
4. A manual or scheduled sync imports provider commits as idempotent
   `TaskArtifact` records keyed by `(repository_connection_id, external_id)`.
5. Commits may be attached to a contract milestone during sync. Files, links,
   text updates, and neutral project check-ins remain supported as fallback
   evidence.
6. Clients can record checkpoint approval or revision requests. These are
   append-only decisions and do not automatically change milestone payment
   state.

## Reliability and security boundaries

- Provider pages are fetched in bounded batches of 100, with a timestamp
  cursor so routine syncs do not repeatedly scan the full history.
- Duplicate provider events are upserted, so retries do not duplicate the
  timeline.
- Provider authorization failures move a connection to
  `needs_reauthorization`; the encrypted token is never returned by an API
  response.
- Contract access is checked for every read and write. Students can connect,
  sync, and revoke only their own repository connection; contract clients and
  organization members can read evidence and create checkpoints.
- Commit author metadata is retained as provider evidence when available, but
  attribution is displayed as descriptive metadata rather than a performance
  judgment.
- Repository sync runs behind a distributed job lock every 15 minutes.

## Operational requirements

Production deployments must configure provider OAuth client credentials and
callback URLs, use a strong `JWT_SECRET` as the token-encryption root, expose
HTTPS callbacks, and monitor `last_sync_error` and
`needs_reauthorization` connections. Provider sandbox/live OAuth and rate-limit
behavior must be verified as part of UAT; local tests cannot prove those
external-provider guarantees.
