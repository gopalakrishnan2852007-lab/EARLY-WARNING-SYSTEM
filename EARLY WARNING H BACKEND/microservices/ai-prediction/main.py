from fastapi import FastAPI
from models.schemas import EnvironmentalData, RiskPredictionResponse
from models.risk_calculator import calculate_flood_risk, calculate_fire_risk, determine_risk_level

app = FastAPI(title="AI Disaster Warning Microservice")

@app.get("/")
def home():
    return {"status": "active", "message": "🧠 AI Prediction Microservice Running"}

@app.post("/predict_risk", response_model=RiskPredictionResponse)
def predict_risk(data: EnvironmentalData):
    """
    Endpoint to receive environmental data and return AI-calculated risk scores.
    """
    flood_score = calculate_flood_risk(data)
    fire_score = calculate_fire_risk(data)
    level = determine_risk_level(flood_score, fire_score)
    
    return RiskPredictionResponse(
        flood_risk_score=flood_score,
        fire_risk_score=fire_score,
        risk_level=level
    )
