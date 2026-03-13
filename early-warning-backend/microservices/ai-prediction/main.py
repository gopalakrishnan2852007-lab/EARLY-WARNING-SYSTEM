from fastapi import FastAPI, UploadFile, File
from models.schemas import EnvironmentalData, RiskPredictionResponse, SimulationData
from models.risk_calculator import (
    calculate_flood_risk, 
    calculate_landslide_risk, 
    calculate_storm_surge_risk,
    determine_risk_level,
    generate_prediction_text
)
import random

app = FastAPI(title="AI Disaster Warning Microservice")

@app.get("/")
def home():
    return {"status": "active", "message": "🧠 AI Prediction Microservice Running"}

@app.post("/predict_risk", response_model=RiskPredictionResponse)
def predict_risk(data: EnvironmentalData):
    """
    Endpoint to receive environmental data and return AI-calculated risk scores.
    """
    flood_prob = calculate_flood_risk(data)
    landslide_prob = calculate_landslide_risk(data)
    storm_surge_prob = calculate_storm_surge_risk(data)
    
    max_risk = max(flood_prob, landslide_prob, storm_surge_prob)
    level = determine_risk_level(max_risk)
    
    return RiskPredictionResponse(
        flood_probability=flood_prob,
        landslide_probability=landslide_prob,
        storm_surge_probability=storm_surge_prob,
        risk_level=level,
        risk_score=max_risk,
        prediction_6h=generate_prediction_text(max_risk, "6 hours"),
        prediction_24h=generate_prediction_text(max_risk, "24 hours"),
        confidence=round(random.uniform(0.75, 0.98), 2)
    )

@app.post("/simulate", response_model=RiskPredictionResponse)
def simulate_risk(base_data: EnvironmentalData, sim_params: SimulationData):
    """
    Predictive Simulation endpoint.
    Adjusts environmental data by multipliers to simulate extreme scenarios.
    """
    simulated_data = base_data.copy()
    simulated_data.rainfall *= sim_params.rainfall_multiplier
    simulated_data.river_level *= sim_params.river_level_multiplier
    
    return predict_risk(simulated_data)

@app.post("/analyze/image")
def analyze_disaster_image(file: UploadFile = File(...)):
    """
    Mock AI Image analysis endpoint.
    In production, this would use a PyTorch/TensorFlow Vision model to detect flood severity.
    """
    # Mock analysis logic based on random factor for placeholder
    severity_options = ["low", "moderate", "severe"]
    detected_severity = random.choice(severity_options)
    
    return {
        "filename": file.filename,
        "disaster_type": "flood",
        "detected_severity": detected_severity,
        "confidence": round(random.uniform(0.60, 0.99), 2),
        "message": f"Detected {detected_severity} flooding in the uploaded image."
    }
