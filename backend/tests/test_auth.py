"""Tests for Clerk token checking (auth.py).

Instead of real Clerk tokens, each test signs its own tokens with a key pair made here,
and auth.py is told to trust that key. This checks the real verification code without
needing Clerk or a network connection.
"""

import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

import auth

ISSUER = "https://example-app.clerk.accounts.dev"
FRONTEND = "https://obich1.github.io"


@pytest.fixture(scope="module")
def private_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(autouse=True)
def trust_test_key(monkeypatch, private_key):
    monkeypatch.setattr(auth, "CLERK_ISSUER", ISSUER)
    monkeypatch.setattr(auth, "AUTHORIZED_PARTIES", [FRONTEND])
    monkeypatch.setattr(auth, "signing_key_for", lambda token: private_key.public_key())


def make_token(private_key, **changes):
    now = int(time.time())
    claims = {"sub": "user_123", "iss": ISSUER, "azp": FRONTEND, "iat": now, "exp": now + 60}
    claims.update(changes)
    claims = {key: value for key, value in claims.items() if value is not None}
    return jwt.encode(claims, private_key, algorithm="RS256")


def get_library(client, token):
    return client.get("/library", headers={"Authorization": f"Bearer {token}"})


def test_valid_token_returns_user_id(private_key):
    assert auth.verify_token(make_token(private_key)) == "user_123"


def test_valid_token_creates_the_user_on_first_request(client, session, private_key):
    from models import User

    response = get_library(client, make_token(private_key))

    assert response.status_code == 200
    assert session.get(User, "user_123") is not None


def test_expired_token_is_rejected(client, private_key):
    old = int(time.time()) - 3600
    token = make_token(private_key, iat=old, exp=old + 60)

    response = get_library(client, token)

    assert response.status_code == 401
    assert response.json()["detail"] == "Your session is invalid or has expired"


def test_token_from_another_issuer_is_rejected(client, private_key):
    token = make_token(private_key, iss="https://someone-else.clerk.accounts.dev")

    assert get_library(client, token).status_code == 401


def test_token_for_another_website_is_rejected(client, private_key):
    token = make_token(private_key, azp="https://evil.example.com")

    assert get_library(client, token).status_code == 401


def test_token_signed_with_another_key_is_rejected(client):
    other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    assert get_library(client, make_token(other_key)).status_code == 401


def test_token_without_user_id_is_rejected(client, private_key):
    assert get_library(client, make_token(private_key, sub=None)).status_code == 401


def test_garbage_token_is_rejected(client):
    assert get_library(client, "not-a-token").status_code == 401


def test_missing_token_asks_user_to_sign_in(client):
    response = client.get("/library")

    assert response.status_code == 401
    assert response.json()["detail"] == "Please sign in"


def test_server_without_clerk_config_says_so(client, monkeypatch, private_key):
    monkeypatch.setattr(auth, "CLERK_ISSUER", "")

    assert get_library(client, make_token(private_key)).status_code == 503
