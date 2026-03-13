from models.schemas import EnvironmentalData

def calculate_flood_risk(data: EnvironmentalData) -> float:
    """
    Simplified Mock AI Model for Flood Risk Prediction
    Factors: rainfall, river_level, soil_moisture
    """
    risk = 0.0
    
    # High rainfall increases risk significantly
    if data.rainfall > 30:
        risk += 0.4
    elif data.rainfall > 10:
        risk += 0.2
        
    # River level (assuming dangerous if > 10m)
    if data.river_level > 10:
        risk += 0.3
    elif data.river_level > 7:
        risk += 0.15
        
    # High soil moisture means less absorption
    if data.soil_moisture > 40:
        risk += 0.2
        
    return min(risk, 1.0) # Max 1.0 (100%)

def calculate_fire_risk(data: EnvironmentalData) -> float:
    """
    Simplified Mock AI Model for Fire Risk Prediction
    Factors: temperature, humidity, wind_speed, vegetation_dryness
    """
    risk = 0.0
    
    if data.temperature > 35:
        risk += 0.3
    elif data.temperature > 30:
        risk += 0.15
        
    if data.humidity < 20:
        risk += 0.3
    elif data.humidity < 40:
        risk += 0.15
        
    if data.wind_speed > 60:
        risk += 0.2
        
    if data.vegetation_dryness > 80:
        risk += 0.2
        
    return min(risk, 1.0)

def determine_risk_level(flood_score: float, fire_score: float) -> str:
    max_risk = max(flood_score, fire_score)
    
    if max_risk >= 0.8:
        return "critical"
    elif max_risk >= 0.6:
        return "high"
    elif max_risk >= 0.3:
        return "moderate"
    else:
        return "safe"
