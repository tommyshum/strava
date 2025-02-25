import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Activity, Calendar, MapPin, Clock } from 'lucide-react'

// Strava OAuth Configuration
const CLIENT_ID = '146008';
const CLIENT_SECRET = '92b5e1d02cfec5f1b1b38bcccba65cb82c5124b2';
// Change callback to root path
const REDIRECT_URI = 'https://cool-puppy-d8445a.netlify.app';

function StravaApp() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for authorization code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      console.log('Authorization code received:', code);
      handleAuthCode(code);
    }
  }, []);

  const initiateAuth = () => {
    const scope = 'read,activity:read';
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;
    console.log('Starting auth:', authUrl);
    window.location.href = authUrl;
  };

  const handleAuthCode = async (code) => {
    try {
      setLoading(true);
      console.log('Exchanging code for token...');
      
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code'
        })
      });

      const data = await response.json();
      console.log('Token response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to exchange token');
      }

      // Save token
      localStorage.setItem('stravaToken', data.access_token);
      
      // Fetch activities with new token
      await fetchActivities(data.access_token);
      
      // Clear the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async (token) => {
    try {
      console.log('Fetching activities...');
      const response = await fetch('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      console.log('Activities received:', data.length);
      setActivities(data);
    } catch (err) {
      console.error('Activities error:', err);
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const metersToMiles = (meters) => {
    return (meters * 0.000621371).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-red-500 mb-4">{error}</div>
        <button 
          onClick={initiateAuth}
          className="bg-[#fc4c02] hover:bg-[#e34402] text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (activities.length === 0 && !window.location.search.includes('code')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-2xl font-bold text-center">Strava Activities Viewer</h1>
        <button 
          onClick={initiateAuth}
          className="bg-[#fc4c02] hover:bg-[#e34402] text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Activity className="w-5 h-5" />
          Connect with Strava
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Strava Activities</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {activities.map((activity) => (
          <div key={activity.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5" />
              <h2 className="text-lg font-semibold">{activity.name}</h2>
            </div>
            <div className="space-y-2 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(activity.start_date_local)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{metersToMiles(activity.distance)} miles</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(activity.moving_time)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StravaApp />
  </React.StrictMode>
);
