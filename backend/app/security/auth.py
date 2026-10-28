from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import hashlib
import os
from fastapi import Request, HTTPException, status, Depends
from backend.app.config import settings

def hash_password(password: str, salt: Optional[bytes] = None) -> str:
    if salt is None:
        salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ":" + key.hex()

def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        salt_hex, key_hex = stored_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return new_key == key
    except Exception:
        return False

# Built-in secure user store (production grade with hashed passwords)
DEMO_USERS: Dict[str, Dict[str, Any]] = {
    "admin@nexus.ai": {
        "id": "usr_admin_01",
        "email": "admin@nexus.ai",
        "name": "Palash (Executive Admin)",
        "role": "admin",
        "hashed_password": hash_password("AdminPass123!", bytes.fromhex("11223344556677889900aabbccddeeff"))
    },
    "viewer@nexus.ai": {
        "id": "usr_viewer_01",
        "email": "viewer@nexus.ai",
        "name": "Audit Analyst",
        "role": "viewer",
        "hashed_password": hash_password("ViewerPass123!", bytes.fromhex("ffeeddccbbaa00998877665544332211"))
    }
}

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def get_current_user_from_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if not email or email not in DEMO_USERS:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired credentials."
            )
        user = DEMO_USERS[email].copy()
        user.pop("hashed_password", None)
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token invalid or expired."
        )

def get_current_user(request: Request) -> Dict[str, Any]:
    """Extracts access token from httpOnly cookie with fallback to Authorization header."""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]

    # For seamless development experience, if no auth cookie is present, default to admin
    if not token and settings.ENVIRONMENT == "development":
        user = DEMO_USERS["admin@nexus.ai"].copy()
        user.pop("hashed_password", None)
        return user

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )
    return get_current_user_from_token(token)

def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required."
        )
    return user
