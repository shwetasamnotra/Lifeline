from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./lifeline.db"
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"
    usgs_base_url: str = "https://earthquake.usgs.gov/fdsnws/event/1"
    gdacs_base_url: str = "https://www.gdacs.org"
    map_provider: str = "openstreetmap"
    map_api_key: Optional[str] = None
    routing_provider: str = "internal"
    routing_api_key: Optional[str] = None
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
