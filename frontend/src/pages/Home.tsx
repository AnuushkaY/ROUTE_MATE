import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Search, Navigation } from 'lucide-react';
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
  const navigate = useNavigate();

  const fetchNearbyPools = async (lat: number, lng: number) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/pools/nearby`, { lat, lng, radius_km: 100.0 }); // Increased heavily to cover dummy random drifts reliably
      setPools(response.data.pools);
    } catch (err) {
      console.error("Failed to fetch pools", err);
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          fetchNearbyPools(lat, lng);
          setLoading(false);
        },
        (error) => {
          console.warn("GPS failed, using default map view.", error);
          fetchNearbyPools(location?.lat || 28.7041, location?.lng || 77.1025);
          setLoading(false);
        }
      );
    } else {
      fetchNearbyPools(location?.lat || 28.7041, location?.lng || 77.1025);
      setLoading(false);
    }
  };

  const handleManualGeocode = async () => {
    if (!manualAddress) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}`);
      if (res.data && res.data.length > 0) {
        const lat = parseFloat(res.data[0].lat);
        const lng = parseFloat(res.data[0].lon);
        setLocation({ lat, lng });
        fetchNearbyPools(lat, lng);
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    getUserLocation();
    
    const channel = supabase.channel('pools_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pools' }, () => {
        if (location) fetchNearbyPools(location.lat, location.lng);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container flex-col" style={{ padding: '32px 24px', height: 'calc(100vh - 80px)', display: 'flex' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '24px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '2rem' }}>Discover Rides Nearby</h1>
        <button className="btn btn-accent" onClick={() => navigate('/create-pool')}>
          + Create a Pool
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        <button className="btn btn-primary" onClick={getUserLocation} disabled={loading}>
          <Navigation size={18} /> GPS
        </button>
        <span style={{ color: 'var(--text-muted)' }}>— OR —</span>
        <div style={{ display: 'flex', flex: 1, minWidth: '200px', gap: '8px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Enter manual address..." 
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
          />
          <button className="btn btn-outline" onClick={handleManualGeocode} disabled={loading}>
            <Search size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-4" style={{ flex: 1, minHeight: 0, paddingBottom: '24px' }}>
        {/* Left Side: Map */}
        <div className="glass-card" style={{ flex: 2, padding: 0, overflow: 'hidden' }}>
          {location ? (
            <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap lat={location.lat} lng={location.lng} />
              
              {/* You are here marker */}
              <Marker position={[location.lat, location.lng]}>
                <Popup>You are currently here.</Popup>
              </Marker>

              {/* Pool Markers */}
              {pools.map(pool => (
                <Marker key={pool.id} position={[pool.source_lat, pool.source_lng]}>
                  <Popup>
                    <strong>{pool.mode_of_transport}</strong> - {pool.available_seats} Seats<br />
                    To: {pool.dest_text || 'Coordinates'}<br />
                    <button className="btn btn-primary" style={{ marginTop: '8px', padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => navigate(`/chat/${pool.id}`)}>
                      Join / Chat
                    </button>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: '100%', color: 'var(--text-muted)' }}>
              Enable Location or Search Address to view Map
            </div>
          )}
        </div>

        {/* Right Side: List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
            Available Pools ({pools.length})
          </h2>
          {pools.length === 0 ? (
            <div className="glass-card flex-col items-center justify-center" style={{ flex: 1, border: '1px dashed var(--border)', background: 'transparent' }}>
              <MapPin size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No available pools nearby. Be the first!</p>
            </div>
          ) : (
            pools.map(pool => (
              <div key={pool.id} className="glass-card">
                <div className="flex justify-between" style={{ marginBottom: '12px' }}>
                  <span className="badge badge-indigo">{pool.mode_of_transport}</span>
                  <span className="badge badge-green">{pool.available_seats} Seats Left</span>
                </div>
                <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Destination: {pool.dest_text || 'Coordinates'}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Distance: {pool.distance_km}km
                </p>
                <div className="flex gap-2">
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate(`/chat/${pool.id}`)}>Chat Room</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
