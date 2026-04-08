from datetime import datetime, timedelta
import math
from .geo_service import haversine_distance

def calculate_heuristic_score(
    pool_source: tuple, pool_dest: tuple, pool_time: str,
    req_source: tuple, req_dest: tuple, req_time: str
) -> float:
    """
    Formula: 0.3*source + 0.25*destination(include direction part also cosine rule) + 0.3*time window (max+-of 30 min)
    Total base is 0.85
    """
    # 1. Source score (max 0.3)
    # Let's say if distance is 0km -> 0.3, if > 5km -> 0
    source_dist = haversine_distance(pool_source[0], pool_source[1], req_source[0], req_source[1])
    source_score = max(0, 0.3 * (1 - (source_dist / 5.0)))
    
    # 2. Destination score (max 0.25)
    dest_dist = haversine_distance(pool_dest[0], pool_dest[1], req_dest[0], req_dest[1])
    # Cosine direction (simplistic approximation using vectors)
    # Vector of Pool: P_dest - P_src
    v_pool_lat = pool_dest[0] - pool_source[0]
    v_pool_lng = pool_dest[1] - pool_source[1]
    
    # Vector of Req: R_dest - R_src
    v_req_lat = req_dest[0] - req_source[0]
    v_req_lng = req_dest[1] - req_source[1]
    
    # Dot product
    dot_product = v_pool_lat * v_req_lat + v_pool_lng * v_req_lng
    
    # Magnitudes
    mag_pool = math.sqrt(v_pool_lat**2 + v_pool_lng**2)
    mag_req = math.sqrt(v_req_lat**2 + v_req_lng**2)
    
    cosine_sim = 1.0 # default if magnitudes are 0
    if mag_pool > 0 and mag_req > 0:
        cosine_sim = dot_product / (mag_pool * mag_req)
        
    # Scale cosine from [-1, 1] to [0, 1]
    direction_match = (cosine_sim + 1) / 2.0
    
    # Dest match decays up to 5km
    dest_proximity = max(0, 1 - (dest_dist / 5.0))
    
    dest_score = 0.25 * ((dest_proximity * 0.7) + (direction_match * 0.3))
    
    # 3. Time window score (max 0.3 => +- 30 min)
    try:
        pt = datetime.fromisoformat(pool_time.replace('Z', '+00:00'))
        rt = datetime.fromisoformat(req_time.replace('Z', '+00:00'))
        
        time_diff_minutes = abs((pt - rt).total_seconds()) / 60.0
        
        if time_diff_minutes <= 30:
            time_score = 0.3 * (1 - (time_diff_minutes / 30.0))
        else:
            time_score = 0.0
    except Exception:
        # fallback
        time_score = 0.0
        
    total_score = source_score + dest_score + time_score
    
    # Normalize to 1.0 (out of 100%)
    final_score = (total_score / 0.85) * 100
    
    return round(final_score, 2)
