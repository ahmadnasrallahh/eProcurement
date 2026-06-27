# Security cleanup note

Earlier public revisions of this repository included local environment configuration, Replit state, and runtime upload artifacts. They also included an application database connection string, a session-signing secret, and a known bootstrap administrator credential.

The current working tree removes those files and the known default credential. It also prevents password hashes from being returned by user endpoints and avoids logging response bodies.

## Required response

- Rotate the exposed database credential immediately and review the database provider's access logs.
- Replace the session secret in every environment; existing sessions should be considered invalid.
- Remove or reset any administrator account created from the former default credential.
- Review deployments for reuse of any exposed value.

Removing a file from the latest revision does not remove it from Git history. History cleanup is intentionally not included in this change and should only be done after credentials are rotated and collaborators are prepared to re-clone.
