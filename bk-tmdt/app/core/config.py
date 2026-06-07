from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "TMDT Backend"
    api_v1_prefix: str = "/api/v1"
    db_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/tmdt",
        validation_alias="DB_URL",
    )
    jwt_secret: str = Field(default="change-me", validation_alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=60, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, validation_alias="REFRESH_TOKEN_EXPIRE_DAYS")
    verification_token_expire_minutes: int = Field(default=60, validation_alias="VERIFICATION_TOKEN_EXPIRE_MINUTES")
    reset_token_expire_minutes: int = Field(default=30, validation_alias="RESET_TOKEN_EXPIRE_MINUTES")
    cors_origins: list[str] = Field(default=["*"], validation_alias="CORS_ORIGINS")
    reward_points_earn_threshold_vnd: int = Field(default=100000, validation_alias="REWARD_POINTS_EARN_THRESHOLD_VND")
    reward_point_value_vnd: int = Field(default=1000, validation_alias="REWARD_POINT_VALUE_VND")
    webhook_secret: str = Field(default="change-me", validation_alias="WEBHOOK_SECRET")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
