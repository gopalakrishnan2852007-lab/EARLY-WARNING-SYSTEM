from pydantic import BaseModel
from typing import Literal

class EnvironmentalData(BaseModel):
    location_id: int
    rainfall: float
    temperature: float
    humidity: float
    wind_speed: float
    soil_moisture: float
    river_level: float
    vegetation_dryness: float

class RiskPredictionResponse(BaseModel):
    flood_risk_score: float
    fire_risk_score: float
    risk_level: Literal["safe", "moderate", "high", "critical"]
