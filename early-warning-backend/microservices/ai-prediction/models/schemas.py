from pydantic import BaseModel
from typing import Literal, Optional

class EnvironmentalData(BaseModel):
    location_id: int
    rainfall: float
    temperature: float
    humidity: float
    wind_speed: float
    soil_moisture: float
    river_level: float
    vegetation_dryness: float

class SimulationData(BaseModel):
    rainfall_multiplier: float = 1.0
    river_level_multiplier: float = 1.0

class RiskPredictionResponse(BaseModel):
    flood_probability: float
    landslide_probability: float
    storm_surge_probability: float
    risk_level: Literal["safe", "moderate", "high", "critical"]
    risk_score: float
    prediction_6h: str
    prediction_24h: str
    confidence: float
