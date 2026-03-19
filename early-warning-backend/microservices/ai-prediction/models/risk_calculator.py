from models.schemas import EnvironmentalData

def calculate_flood_risk(data: EnvironmentalData) -> float:
    risk = 0.0
    
    if data.rainfall > 30:
        risk += 0.4
    elif data.rainfall > 10:
        risk += 0.2
        
    if data.river_level > 10:
        risk += 0.4
    elif data.river_level > 7:
        risk += 0.2
        
    if data.soil_moisture > 40:
        risk += 0.2
        
    return min(risk, 1.0)

def calculate_landslide_risk(data: EnvironmentalData) -> float:
    risk = 0.0
    # Landslides are driven heavily by soil moisture and heavy rainfall
    if data.soil_moisture > 60:
        risk += 0.5
    elif data.soil_moisture > 40:
        risk += 0.2
        
    if data.rainfall > 50:
        risk += 0.4
    elif data.rainfall > 20:
        risk += 0.15
        
    return min(risk, 1.0)

def calculate_storm_surge_risk(data: EnvironmentalData) -> float:
    risk = 0.0
    # Storm surge primarily driven by wind speed and low pressure (low temp sometimes correlates with storms)
    if data.wind_speed > 100:
        risk += 0.6
    elif data.wind_speed > 60:
        risk += 0.3
        
    if data.rainfall > 40:
        risk += 0.2
        
    return min(risk, 1.0)

def determine_risk_level(score: float) -> str:
    if score >= 0.8:
        return "critical"
    elif score >= 0.6:
        return "high"
    elif score >= 0.3:
        return "moderate"
    else:
        return "safe"

def generate_prediction_text(score: float, timeframe: str) -> str:
    if score >= 0.8:
        return f"High probability of severe disaster events within {timeframe}."
    elif score >= 0.5:
        return f"Moderate risk of incident escalation in the next {timeframe}."
    else:
        return f"Conditions expected to remain stable over the next {timeframe}."
