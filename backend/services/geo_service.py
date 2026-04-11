import math

BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

def calculate_geohash(lat: float, lng: float, precision: int = 6) -> str:
    """
    Encode latitude/longitude into a geohash string.
    """
    lat_interval = [-90.0, 90.0]
    lon_interval = [-180.0, 180.0]
    geohash = []
    bit = 0
    ch = 0
    even = True

    while len(geohash) < precision:
        if even:
            mid = (lon_interval[0] + lon_interval[1]) / 2
            if lng >= mid:
                ch = (ch << 1) + 1
                lon_interval[0] = mid
            else:
                ch = ch << 1
                lon_interval[1] = mid
        else:
            mid = (lat_interval[0] + lat_interval[1]) / 2
            if lat >= mid:
                ch = (ch << 1) + 1
                lat_interval[0] = mid
            else:
                ch = ch << 1
                lat_interval[1] = mid

        even = not even
        bit += 1

        if bit == 5:
            geohash.append(BASE32[ch])
            bit = 0
            ch = 0

    return ''.join(geohash)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in kilometers.
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r
