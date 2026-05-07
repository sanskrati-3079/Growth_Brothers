"""Authentication & OAuth routes for all supported social platforms."""
from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import RedirectResponse

from app.config import settings
from auth import (
    get_auth_url, exchange_code, list_connected_accounts, disconnect_account,
    verify_and_save_linkedin_token, get_linkedin_auth_url, exchange_linkedin_code,
    get_facebook_auth_url, exchange_facebook_code,
    get_instagram_auth_url, exchange_instagram_code,
    verify_and_save_instagram_token, verify_and_save_facebook_token,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

FRONTEND_URL = settings.frontend_url


# ── YouTube / Google ──────────────────────────────────────────

@router.get("/login")
def google_login():
    """Redirect user to Google OAuth consent screen."""
    return RedirectResponse(get_auth_url())


@router.get("/callback")
def google_callback(code: str = None, error: str = None, state: str = None):
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/accounts?error=access_denied")
    try:
        account = exchange_code(code, state=state)
        name = account["channel_name"].replace(" ", "%20")
        return RedirectResponse(
            f"{FRONTEND_URL}/accounts?success=true&platform=youtube&channel={name}&id={account['channel_id']}"
        )
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/accounts?error={str(e)}")


# ── LinkedIn ──────────────────────────────────────────────────

@router.get("/linkedin/login")
def linkedin_login():
    try:
        return RedirectResponse(get_linkedin_auth_url())
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/accounts?error={str(e)}")


@router.get("/linkedin/callback")
def linkedin_callback(code: str = None, error: str = None, state: str = None):
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/accounts?error=access_denied")
    try:
        account = exchange_linkedin_code(code)
        name = account["name"].replace(" ", "%20")
        return RedirectResponse(
            f"{FRONTEND_URL}/accounts?success=true&platform=linkedin&channel={name}&id={account['person_urn']}"
        )
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/accounts?error={str(e)}")


@router.post("/linkedin/accounts")
def linkedin_connect(email: str = Form(...), password: str = Form(...)):
    try:
        from linkedin_private import login_with_credentials
        account = login_with_credentials(email.strip(), password)
        return {
            "success": True,
            "account_id": account["person_urn"],
            "name": account.get("name", email),
            "thumbnail": account.get("picture", ""),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Login failed: {str(e)}")


@router.post("/linkedin/verify")
def linkedin_verify(token: str = Form(...)):
    try:
        account = verify_and_save_linkedin_token(token)
        return {
            "success": True,
            "account_id": account["person_urn"],
            "name": account["name"],
            "thumbnail": account["picture"],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Facebook (Meta) ───────────────────────────────────────────

@router.get("/facebook/login")
def facebook_login():
    try:
        return RedirectResponse(get_facebook_auth_url())
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/accounts?error={str(e)}")


@router.get("/facebook/callback")
def facebook_callback(code: str = None, error: str = None, state: str = None):
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/accounts?error=access_denied")
    try:
        accounts = exchange_facebook_code(code)
        display_name = None
        if accounts.get("facebook"):
            display_name = accounts["facebook"][0]["name"]
        elif accounts.get("instagram"):
            display_name = accounts["instagram"][0]["username"]
        display_name = (display_name or "Meta account").replace(" ", "%20")
        return RedirectResponse(
            f"{FRONTEND_URL}/accounts?success=true&platform=facebook&channel={display_name}"
        )
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/accounts?error={str(e)}")


@router.post("/facebook/verify")
def facebook_verify(token: str = Form(...)):
    try:
        account = verify_and_save_facebook_token(token)
        return {
            "success": True,
            "account_id": account["page_id"],
            "name": account["name"],
            "thumbnail": account["picture"],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Instagram ─────────────────────────────────────────────────

@router.get("/instagram/login")
def instagram_login():
    try:
        return RedirectResponse(get_instagram_auth_url())
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/accounts?error={str(e)}")


@router.get("/instagram/callback")
def instagram_callback(code: str = None, error: str = None, state: str = None):
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/accounts?error=access_denied")
    try:
        accounts = exchange_instagram_code(code)
        display_name = None
        if accounts.get("instagram"):
            display_name = accounts["instagram"][0].get("username")
        elif accounts.get("facebook"):
            display_name = accounts["facebook"][0]["name"]
        display_name = (display_name or "Instagram account").replace(" ", "%20")
        return RedirectResponse(
            f"{FRONTEND_URL}/accounts?success=true&platform=instagram&channel={display_name}"
        )
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/accounts?error={str(e)}")


@router.post("/instagram/accounts")
def instagram_connect(
    username: str = Form(...),
    password: str = Form(...),
    verification_code: str = Form(""),
):
    try:
        from instagram_private import login_with_credentials
        account = login_with_credentials(username.strip(), password, verification_code.strip())
        return {
            "success": True,
            "account_id": account["instagram_user_id"],
            "username": account["username"],
            "name": account.get("name", account["username"]),
            "thumbnail": account.get("picture", ""),
            "requires_2fa": False,
        }
    except ValueError as e:
        if str(e) == "2FA_REQUIRED":
            return {"success": False, "requires_2fa": True, "detail": "2FA code required"}
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Login failed: {str(e)}")


@router.post("/instagram/verify")
def instagram_verify(token: str = Form(...)):
    try:
        account = verify_and_save_instagram_token(token)
        return {
            "success": True,
            "account_id": account["instagram_user_id"],
            "username": account["username"],
            "name": account.get("name", account["username"]),
            "thumbnail": account.get("picture", ""),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Connected accounts management ─────────────────────────────

@router.get("/accounts")
def get_accounts():
    """List all connected social accounts across all platforms."""
    return list_connected_accounts()


@router.delete("/accounts/{platform}/{account_id}")
def remove_account(platform: str, account_id: str):
    if disconnect_account(platform, account_id):
        return {"message": "Account disconnected"}
    raise HTTPException(status_code=404, detail="Account not found")
