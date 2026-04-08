import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import httpx 
from dotenv import load_dotenv
from services.geo_service import calculate_geohash, haversine_distance
from services.matching_service import calculate_heuristic_score

load_dotenv() 

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

router = APIRouter()

def get_headers():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured.")
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

class NearbyRequest(BaseModel):
    lat: float
    lng: float
    radius_km: float = 0.5
    
class MatchRequest(BaseModel):
    pool_id: str

@router.post("/pools/nearby")
async def get_nearby_pools(req: NearbyRequest):
    headers = get_headers()
    try:
        async with httpx.AsyncClient() as client:
            # Fetch open pools
            url = f"{SUPABASE_URL}/rest/v1/pools?status=eq.open&available_seats=gt.0"
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            pools = response.json()
        
        nearby_pools = []
        for p in pools:
            dist = haversine_distance(req.lat, req.lng, float(p['source_lat']), float(p['source_lng']))
            if dist <= req.radius_km:
                p['distance_km'] = round(dist, 2)
                nearby_pools.append(p)
                
        # Sort by distance
        nearby_pools.sort(key=lambda x: x['distance_km'])
        return {"pools": nearby_pools}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/pools/{pool_id}/requests")
async def get_pool_requests_scored(pool_id: str):
    headers = get_headers()
    try:
        async with httpx.AsyncClient() as client:
            # Fetch the pool details
            url_pool = f"{SUPABASE_URL}/rest/v1/pools?id=eq.{pool_id}"
            pool_res = await client.get(url_pool, headers=headers)
            pool_res.raise_for_status()
            pool_data = pool_res.json()
            if not pool_data:
                raise HTTPException(status_code=404, detail="Pool not found")
            pool = pool_data[0]
            
            # Fetch the requests with user profiles (using PostgREST relation syntax `select=*,user_profiles(*)`)
            url_req = f"{SUPABASE_URL}/rest/v1/pool_requests?pool_id=eq.{pool_id}&status=eq.pending&select=*,user_profiles(*)"
            req_res = await client.get(url_req, headers=headers)
            req_res.raise_for_status()
            requests = req_res.json()
        
        scored_requests = []
        async with httpx.AsyncClient() as client:
            for req in requests:
                score = calculate_heuristic_score(
                    pool_source=(float(pool['source_lat']), float(pool['source_lng'])),
                    pool_dest=(float(pool['dest_lat']), float(pool['dest_lng'])),
                    pool_time=pool['time_window_start'],
                    req_source=(float(req['requester_source_lat']), float(req['requester_source_lng'])),
                    req_dest=(float(req['requester_dest_lat']), float(req['requester_dest_lng'])),
                    req_time=req['requester_time']
                )
                
                # Update score in DB
                update_url = f"{SUPABASE_URL}/rest/v1/pool_requests?id=eq.{req['id']}"
                await client.patch(update_url, headers=headers, json={"heuristic_score": score})
                
                req['heuristic_score'] = score
                scored_requests.append(req)
            
        # Sort by score descending
        scored_requests.sort(key=lambda x: x['heuristic_score'], reverse=True)
        return {"requests": scored_requests}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
