# Authentication

The FastAPI backend supports email/password accounts with Argon2 password
hashing, short-lived JWT access tokens, and revocable refresh-token sessions.

## Configuration

Set these values in `.env` for a deployed environment:

```env
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
```

`JWT_SECRET_KEY` must be unique and must not use the development fallback.
Never commit `.env` or production secrets.

## Endpoints

- `POST /api/auth/register` creates an account and returns an access/refresh pair.
- `POST /api/auth/login` authenticates an account and creates a device session.
- `POST /api/auth/refresh` rotates an active refresh token.
- `POST /api/auth/logout` revokes the supplied refresh token.
- `GET /api/auth/me` returns the authenticated account.
- `POST /api/auth/change-password` changes the password and revokes sessions.

Send access tokens as `Authorization: Bearer <token>`. User-owned API routes
use that account when a token is supplied. Anonymous requests remain supported
for the legacy local Streamlit workflow and use the compatibility local user.

## StrangeUtility security modes

Default `AUTH_MODE=local`: use loopback only. Missing or old example key is replaced with a random process-local signing key; restart invalidates tokens when no explicit key is configured. The anonymous local profile is isolated from registered accounts. `AUTH_MODE=authenticated` rejects anonymous requests for user-owned state, requires a unique random secret of at least 32 characters and HS256, and never uses the local profile fallback. Generate a secret with `python -c "import secrets; print(secrets.token_urlsafe(48))"` and store it outside Git. This mode is not a public deployment approval: rate limiting, TLS, secure storage, concurrency tests, access-token revocation policy and persistent hosting are still required. Use the Streamlit UI only as a trusted local single-user application. Refresh tokens now have unique IDs and rotation atomically claims an unrevoked session. Existing anonymous data accidentally attributed to a registered account is not moved automatically; review a backup before any manual reassignment.
