from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_hostname: str
    database_port: str
    database_password: str
    database_name: str
    database_username: str
    alpha_vantage_api_key: str | None=None
    finnhub_api_key: str | None = None
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    

    class Config:
        env_file = ".env",
        extra="ignore"


settings = Settings()
