import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    create_refresh_token,
    get_token_subject,
    hash_password,
    verify_password,
)
from app.models import ShoppingCart, User, AuthProviderEnum
from datetime import datetime, timedelta, timezone
from app.schemas.auth import (
    LoginRequest, RegisterRequest, TokenResponse, UserRead, SocialLoginRequest,
    ForgotPasswordRequest, VerifyResetOtpRequest, ResetPasswordRequest
)
from app.services.email import send_otp_email, send_password_reset_email
import random
from app.core.config import settings


router = APIRouter()


def _serialize_user(user: User) -> UserRead:
    return UserRead(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_verified=user.is_verified,
    )


def _queue_verification_email(email: str, name: str, otp: str) -> None:
    send_otp_email(email, name, otp)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> TokenResponse:
    existing_user = db.scalar(select(User).where(User.email == payload.email))
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        is_verified=False,
    )
    db.add(user)
    db.flush()
    db.add(ShoppingCart(user_id=user.id))
    db.commit()
    db.refresh(user)

    otp = f"{random.randint(100000, 999999)}"
    user.verification_otp = otp
    user.verification_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()
    db.refresh(user)

    background_tasks.add_task(_queue_verification_email, user.email, user.full_name, otp)

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=_serialize_user(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or user.password_hash is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=_serialize_user(user),
    )


@router.post("/google", response_model=TokenResponse)
async def login_with_google(payload: SocialLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.token}")
            resp.raise_for_status()
            user_info = resp.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token")
        
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email not provided by Google")

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            email=email,
            full_name=user_info.get("name", "Google User"),
            auth_provider=AuthProviderEnum.GOOGLE,
            provider_id=user_info.get("sub"),
            is_verified=True,
            avatar_url=user_info.get("picture"),
        )
        db.add(user)
        db.flush()
        db.add(ShoppingCart(user_id=user.id))
        db.commit()
        db.refresh(user)
    else:
        if user.auth_provider != AuthProviderEnum.GOOGLE and user.provider_id is None:
            user.auth_provider = AuthProviderEnum.GOOGLE
            user.provider_id = user_info.get("sub")
            if not user.avatar_url:
                user.avatar_url = user_info.get("picture")
            db.commit()

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=_serialize_user(user),
    )


@router.post("/facebook", response_model=TokenResponse)
async def login_with_facebook(payload: SocialLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://graph.facebook.com/me?fields=id,name,email,picture&access_token={payload.token}")
            resp.raise_for_status()
            user_info = resp.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Facebook token")
        
    email = user_info.get("email")
    if not email:
        email = f"{user_info.get('id')}@facebook.local"

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        picture_data = user_info.get("picture", {}).get("data", {})
        avatar_url = picture_data.get("url")

        user = User(
            email=email,
            full_name=user_info.get("name", "Facebook User"),
            auth_provider=AuthProviderEnum.FACEBOOK,
            provider_id=user_info.get("id"),
            is_verified=True,
            avatar_url=avatar_url,
        )
        db.add(user)
        db.flush()
        db.add(ShoppingCart(user_id=user.id))
        db.commit()
        db.refresh(user)
    else:
        if user.auth_provider != AuthProviderEnum.FACEBOOK and user.provider_id is None:
            user.auth_provider = AuthProviderEnum.FACEBOOK
            user.provider_id = user_info.get("id")
            db.commit()

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user=_serialize_user(user),
    )


def _queue_reset_email(email: str, name: str, otp: str) -> None:
    send_password_reset_email(email, name, otp)


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is not None:
        otp = f"{random.randint(100000, 999999)}"
        user.verification_otp = otp
        user.verification_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()
        background_tasks.add_task(_queue_reset_email, user.email, user.full_name, otp)
    return {"message": "Nếu email tồn tại, OTP lấy lại mật khẩu đã được gửi."}


@router.post("/verify-reset-otp")
def verify_reset_otp(
    payload: VerifyResetOtpRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
        
    if settings.test_mode and payload.otp == "676767":
        return {"message": "OTP hợp lệ"}

    if not user.verification_otp or user.verification_otp != payload.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã OTP không đúng")
        
    if user.verification_otp_expires_at and user.verification_otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã OTP đã hết hạn")

    return {"message": "OTP hợp lệ"}


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")
        
    if settings.test_mode and payload.otp == "676767":
        pass # Allow bypass in test mode
    else:
        if not user.verification_otp or user.verification_otp != payload.otp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã OTP không đúng")
            
        if user.verification_otp_expires_at and user.verification_otp_expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã OTP đã hết hạn")
            
    user.password_hash = hash_password(payload.new_password)
    user.verification_otp = None
    user.verification_otp_expires_at = None
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}
