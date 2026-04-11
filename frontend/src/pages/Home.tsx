import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Search, Navigation, Globe } from 'lucide-react'; // Added Globe icon
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

const API_BASE_URL = 'http://localhost:8000/api';

const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const Home = () => {
  const [pools, setPools] = useState<any[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>({ lat: 28.7041, lng: 77.1025 });
  const [manualAddress, setManualAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false); // Track if we are in "Global View" mode
  const [nearbyEmpty, setNearbyEmpty] = useState(false);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const locationRef = useRef(location);
  const isGlobalRef = useRef(isGlobal);
  const navigate = useNavigate();

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    isGlobalRef.current = isGlobal;
  }, [isGlobal]);

  const getStatusBadgeClass = (status: string) => {
    if (status === 'open' || status === 'active') return 'badge badge-blue';
    if (status === 'full') return 'badge badge-orange';
    if (status === 'completed') return 'badge badge-gray';
    return 'badge badge-gray';
  };

  const getPoolStatusLabel = (status: string) => {
    if (status === 'active') return 'OPEN';
    return status?.toUpperCase() || 'UNKNOWN';
  };

  const hasRequested = (pool: any) => userRequests.some((req) => req.pool_id === pool.id);
  const getRequestState = (pool: any) => {
    const request = userRequests.find((req) => req.pool_id === pool.id);
    return request?.status || null;
  };

  const isPoolCreator = (pool: any) => currentUserId && pool.creator_id === currentUserId;

  const fetchUserRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const response = await supabase
      .from('pool_requests')
      .select('*')
      .eq('requester_id', user.id);

    const data = response.data as any[] | null;
    if (data) setUserRequests(data);
  };

  const handleRequestJoin = async (pool: any) => {
    if (!currentUserId) {
      alert('Please sign in before requesting to join a pool.');
      return;
    }
    if (pool.creator_id === currentUserId) {
      alert('You are the creator of this pool.');
      return;
    }
    if (pool.status === 'full' || pool.available_seats === 0) {
      alert('This pool is already full.');
      return;
    }
    if (hasRequested(pool)) {
      alert('You already requested to join this pool.');
      return;
    }

    setLoading(true);
    try {
      const source_lat = location?.lat ?? pool.source_lat;
      const source_lng = location?.lng ?? pool.source_lng;
      const dest_lat = pool.dest_lat;
      const dest_lng = pool.dest_lng;
      const requester_time = pool.time_window_start;

      const response = await supabase.from('pool_requests').insert([{ 
        pool_id: pool.id,
        requester_id: currentUserId,
        requester_source_lat: source_lat,
        requester_source_lng: source_lng,
        requester_dest_lat: dest_lat,
        requester_dest_lng: dest_lng,
        requester_time,
        status: 'pending'
      }]);

      const data = response.data as any[] | null;
      const error = response.error;
      if (error) {
        alert('Unable to send request. Please try again.');
        return;
      }

      if (data && data.length > 0) {
        setUserRequests((prev) => [...prev, data[0]]);
      } else {
        await fetchUserRequests();
      }

      alert('Request sent! The pool creator will review it soon.');
    } catch (err) {
      console.error('Join request failed', err);
      alert('Unable to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Updated to accept an optional radius override
const fetchNearbyPools = async (lat: number, lng: number, radiusOverride?: number) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const radius = radiusOverride !== undefined ? radiusOverride : (isGlobal ? 0 : 10.0);

      const response = await axios.post(`${API_BASE_URL}/pools/nearby`, { 
        lat, lng, radius_km: radius, user_id: user?.id 
      });

      const poolsData = response.data.pools || [];
      setPools(poolsData);
      const visibleCount = poolsData.filter((pool: any) => pool.status !== 'completed').length;
      setNearbyEmpty(!isGlobal && visibleCount === 0);
    } catch (err) {
      console.error('Failed to load pools', err);
      setPools([]);
      setNearbyEmpty(!isGlobal);
    } finally {
      setLoading(false);
    }
  };


  const toggleGlobalView = () => {
    const newGlobalState = !isGlobal;
    setIsGlobal(newGlobalState);
    setNearbyEmpty(false);
    if (location) {
      fetchNearbyPools(location.lat, location.lng, newGlobalState ? 0 : 10.0);
    }
  };

  const getUserLocation = () => {
    setIsGlobal(false);
    setNearbyEmpty(false);
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
        },
        (error) => {
          console.warn("GPS failed, using default map view.", error);
          const lat = location?.lat || 28.7041;
          const lng = location?.lng || 77.1025;
          setLocation({ lat, lng });
        }
      );
    } else {
      const lat = location?.lat || 28.7041;
      const lng = location?.lng || 77.1025;
      setLocation({ lat, lng });
    }
  };

  const handleManualGeocode = async () => {
    if (!manualAddress) return;
    setIsGlobal(false);
    setNearbyEmpty(false);
    setLoading(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}`);
      if (res.data && res.data.length > 0) {
        const lat = parseFloat(res.data[0].lat);
        const lng = parseFloat(res.data[0].lon);
        setLocation({ lat, lng });
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  useEffect(() => {
    getUserLocation();
    fetchUserRequests();

    const channel = supabase.channel('pools_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pools' }, () => {
        const currentLoc = locationRef.current;
        const currentGlobal = isGlobalRef.current;
        if (currentLoc) fetchNearbyPools(currentLoc.lat, currentLoc.lng, currentGlobal ? 0 : 10.0);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbyPools(location.lat, location.lng, isGlobal ? 0 : 10.0);
    }
  }, [location, isGlobal]);

  return (
    <div className="container flex-col" style={{ padding: '32px 24px', height: 'calc(100vh - 80px)', display: 'flex' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '24px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '2rem' }}>Discover Rides {isGlobal ? 'Everywhere' : 'Nearby'}</h1>
        <button className="btn btn-accent" onClick={() => navigate('/create-pool')}>
          + Create a Pool
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        <button className={`btn ${!isGlobal ? 'btn-primary' : 'btn-outline'}`} onClick={getUserLocation} disabled={loading}>
          <Navigation size={18} /> GPS
        </button>
        
        {/* Toggle Global Button for testing far away pools */}
        <button className={`btn ${isGlobal ? 'btn-primary' : 'btn-outline'}`} onClick={toggleGlobalView} disabled={loading}>
          <Globe size={18} /> {isGlobal ? 'Back to Nearby' : 'Show All'}
        </button>

        <span style={{ color: 'var(--text-muted)' }}>— OR —</span>
        
        <div style={{ display: 'flex', flex: 1, minWidth: '200px', gap: '8px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search city/area..." 
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
          />
          <button className="btn btn-outline" onClick={handleManualGeocode} disabled={loading}>
            <Search size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-4" style={{ flex: 1, minHeight: 0, paddingBottom: '24px' }}>
        <div className="glass-card" style={{ flex: 2, padding: 0, overflow: 'hidden' }}>
          {location ? (
            <MapContainer center={[location.lat, location.lng]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap lat={location.lat} lng={location.lng} />
              
              <Marker position={[location.lat, location.lng]}>
                <Popup>You are here.</Popup>
              </Marker>

              {pools.filter(pool => pool.status !== 'completed').map(pool => (
                <Marker key={pool.id} position={[pool.source_lat, pool.source_lng]}>
                  <Popup>
                    <strong>{pool.mode_of_transport}</strong><br />
                    To: {pool.dest_text}<br />
                    <span className={getStatusBadgeClass(pool.status)} style={{ marginBottom: '8px', display: 'inline-block' }}>
                      {getPoolStatusLabel(pool.status)}
                    </span><br />
                    {isPoolCreator(pool) ? (
                      <span className="badge badge-indigo">Your Pool</span>
                    ) : getRequestState(pool) === 'pending' ? (
                      <button className="btn btn-outline btn-sm" disabled>
                        Request Pending
                      </button>
                    ) : getRequestState(pool) === 'accepted' ? (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/chat/${pool.id}`)}>
                        Open Chat
                      </button>
                    ) : getRequestState(pool) === 'rejected' ? (
                      <button className="btn btn-outline btn-sm" disabled>
                        Request Rejected
                      </button>
                    ) : pool.status === 'full' ? (
                      <button className="btn btn-outline btn-sm" disabled>
                        Pool Full
                      </button>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => handleRequestJoin(pool)}>
                        Request Join
                      </button>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: '100%' }}>Loading map...</div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(() => {
            const visiblePools = pools.filter(pool => pool.status !== 'completed');
            return (
              <>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
                  Available Pools ({visiblePools.length})
                </h2>
                {visiblePools.length === 0 ? (
                  <div className="glass-card flex-col items-center justify-center" style={{ flex: 1 }}>
                    <MapPin size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <p style={{ textAlign: 'center', maxWidth: '280px' }}>
                      {nearbyEmpty
                        ? 'No nearby pools found. Use "Show All" to view all active/open rides or search a new location.'
                        : isGlobal
                        ? 'No active/open pools are available right now. Try searching another area.'
                        : 'No pools found. Try GPS or search a nearby location.'}
                    </p>
                    {nearbyEmpty && (
                      <button
                        className="btn btn-primary mt-4"
                        onClick={() => {
                          setIsGlobal(true);
                          if (location) fetchNearbyPools(location.lat, location.lng, 0);
                        }}
                        disabled={loading}
                      >
                        Show All Active/Open Pools
                      </button>
                    )}
                  </div>
                ) : (
                  visiblePools.map(pool => (
                    <div key={pool.id} className="glass-card">
                      <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                        <span className="badge badge-indigo">{pool.mode_of_transport}</span>
                        <span className={getStatusBadgeClass(pool.status)}>{pool.status?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                        <span>{pool.available_seats} Seats</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pool.distance_km} km</span>
                      </div>
                      <h3 style={{ fontSize: '1rem' }}>{pool.source_text.split(',')[0]} → {pool.dest_text.split(',')[0]}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Distance: {pool.distance_km}km
                      </p>
                      <div className="flex gap-2" style={{ marginTop: '12px' }}>
                        {isPoolCreator(pool) ? (
                          <button className="btn btn-outline flex-1" disabled>
                            Your Pool
                          </button>
                        ) : getRequestState(pool) === 'pending' ? (
                          <button className="btn btn-outline flex-1" disabled>
                            Request Pending
                          </button>
                        ) : getRequestState(pool) === 'accepted' ? (
                          <button className="btn btn-primary flex-1" onClick={() => navigate(`/chat/${pool.id}`)}>
                            Open Chat
                          </button>
                        ) : getRequestState(pool) === 'rejected' ? (
                          <button className="btn btn-outline flex-1" disabled>
                            Request Rejected
                          </button>
                        ) : pool.status === 'full' ? (
                          <button className="btn btn-outline flex-1" disabled>
                            Pool Full
                          </button>
                        ) : (
                          <button className="btn btn-primary flex-1" onClick={() => handleRequestJoin(pool)}>
                            Request Join
                          </button>
                        )}
                        <button className="btn btn-outline flex-1" onClick={() => navigate(`/chat/${pool.id}`)}>
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Home;