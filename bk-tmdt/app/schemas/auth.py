from typing import Annotated
from pydantic import BaseModel, Field, AfterValidator
import email_validator
from email_validator import validate_email, EmailNotValidError

# Clear special use domains so .local or .test can be used
email_validator.SPECIAL_USE_DOMAIN_NAMES = []

def validate_email_test_env(v: str) -> str:
    try:
        valid = validate_email(v, test_environment=True, check_deliverability=False)
        return valid.normalized
    except EmailNotValidError as e:
        raise ValueError(str(e))

EmailStr = Annotated[str, AfterValidator(validate_email_test_env)]

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SocialLoginRequest(BaseModel):
    token: str


class UserRead(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    is_verified: bool


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)
