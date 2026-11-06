"""Sign-in: verifying the session tokens that Clerk gives the frontend.

How it works:
1. The user signs in on the frontend with Clerk. Clerk gives the browser a session token (a JWT).
2. The frontend sends it with each request: "Authorization: Bearer <token>".
3. This file checks that Clerk really signed the token (using Clerk's public keys) and that it
   hasn't expired, then reads the user's id from it. WagaShelf never sees a password.
"""

import os
from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from database import get_session
from models import User

# Your Clerk instance's Frontend API URL, e.g. https://example-name-12.clerk.accounts.dev
CLERK_ISSUER = os.getenv("CLERK_ISSUER", "").rstrip("/")
# Websites allowed to use the tokens (the "azp" claim), e.g. https://obich1.github.io
AUTHORIZED_PARTIES = [
    party.strip().rstrip("/")
    for party in os.getenv("CLERK_AUTHORIZED_PARTIES", "").split(",")
    if party.strip()
]
CLOCK_LEEWAY_SECONDS = 10  # tolerates small differences between Clerk's clock and the server's

bearer_scheme = HTTPBearer(auto_error=False)


class InvalidToken(Exception):
    pass


@lru_cache
def jwks_client() -> jwt.PyJWKClient:
    """Downloads Clerk's public keys once and keeps them in memory (lru_cache)."""
    return jwt.PyJWKClient(f"{CLERK_ISSUER}/.well-known/jwks.json", cache_keys=True)


def signing_key_for(token: str):
    """Find the Clerk public key that matches the key id in the token's header."""
    return jwks_client().get_signing_key_from_jwt(token).key


def verify_token(token: str) -> str:
    """Check a Clerk session token and return the user id it belongs to."""
    try:
        claims = jwt.decode(
            token,
            signing_key_for(token),
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            leeway=CLOCK_LEEWAY_SECONDS,
            options={"require": ["exp", "iat", "sub", "iss"], "verify_aud": False},
        )
    except jwt.PyJWTError as error:
        raise InvalidToken(str(error)) from error

    # "azp" is the website the token was issued to; reject tokens made for other sites.
    authorized_party = claims.get("azp")
    if AUTHORIZED_PARTIES and authorized_party and authorized_party.rstrip("/") not in AUTHORIZED_PARTIES:
        raise InvalidToken("Token was issued to a different website")
    return claims["sub"]


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    session: Annotated[Session, Depends(get_session)],
) -> User:
    """FastAPI dependency for routes that need a signed-in user.

    Returns the user's row, creating it the first time a new Clerk user makes a request.
    """
    if not CLERK_ISSUER:
        raise HTTPException(status_code=503, detail="Sign-in isn't configured on the server")
    if credentials is None:
        raise HTTPException(status_code=401, detail="Please sign in")

    try:
        user_id = verify_token(credentials.credentials)
    except InvalidToken:
        raise HTTPException(status_code=401, detail="Your session is invalid or has expired")
    except jwt.PyJWKClientError:
        raise HTTPException(status_code=503, detail="Sign-in can't be checked right now")

    user = session.get(User, user_id)
    if user is None:
        user = User(id=user_id)
        session.add(user)
        session.commit()
        session.refresh(user)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
