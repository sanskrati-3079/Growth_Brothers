"""User auth routes — register, login, current-user lookup."""
from __future__ import annotations

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

from app.services import users as users_svc

router = APIRouter(prefix="/users", tags=["Users"])

bearer = HTTPBearer(auto_error=False)


# ── Request bodies ────────────────────────────────────────────────────────

class RegisterBody(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


# ── Auth dependency ───────────────────────────────────────────────────────

def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = users_svc.decode_token(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = users_svc.find_by_id(payload.get("sub", ""))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return users_svc._public(user)


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.post("/register")
def register(body: RegisterBody):
    try:
        user = users_svc.register(body.name, body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = users_svc.issue_token(user["id"])
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login")
def login(body: LoginBody):
    user = users_svc.authenticate(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = users_svc.issue_token(user["id"])
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {"user": user}
