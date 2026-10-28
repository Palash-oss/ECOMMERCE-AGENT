from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Response, HTTPException, status, Depends
from backend.app.security.auth import (
    DEMO_USERS, verify_password, create_access_token, create_refresh_token, get_current_user
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(payload: LoginRequest, response: Response):
    user = DEMO_USERS.get(payload.email)
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token_data = {"sub": user["email"], "role": user["role"], "id": user["id"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Set httpOnly cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production HTTPS
        samesite="lax",
        max_age=1800
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800
    )

    clean_user = user.copy()
    clean_user.pop("hashed_password", None)
    return {
        "status": "success",
        "user": clean_user,
        "token": access_token
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"status": "success", "message": "Logged out successfully."}

@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return user
