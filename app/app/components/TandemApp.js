'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Car, Clock, MapPin, Users, Star, Calendar, MessageCircle, Shield, LogOut, Send, X, Camera } from 'lucide-react';

const SUPABASE_URL = 'https://uwlvlduhczlyjsgjwupn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bHZsZHVoY3pseWpzZ2p3dXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzUxNDIsImV4cCI6MjA3MDk1MTE0Mn0.LnWqIFoVETBCkqhA__pEoHGwkWaTJ6QDgpNda7eCImc';

let supabaseAuthToken = null;

const TandemApp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [postcode, setPostcode] = useState('');
  const [children, setChildren] = useState('');
  const [photoConsent, setPhotoConsent] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('find');
  const [rides, setRides] = useState([]);
  const [myRides, setMyRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [parentMessages, setParentMessages] = useState([]);
  const [showMessaging, setShowMessaging] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [ridePostcode, setRidePostcode] = useState('');
  const [tripType, setTripType] = useState('pickup');
  const [distance, setDistance] = useState('0.5');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:15');
  const [seats, setSeats] = useState('1');
  const [yearGroups, setYearGroups] = useState('Y1-Y3');

  const sampleRides = [
    {
      id: 'sample1',
      driver_name: 'Sarah Johnson',
      postcode: 'NW6 2AB',
      trip_type: 'pickup',
      distance: '0.5',
      date: '2024-08-19',
      time: '08:15:00',
      seats_available: 2,
      year_groups: 'Y1-Y3',
      driver_verified: true
    },
    {
      id: 'sample2',
      driver_name: 'Mike Parker',
      postcode: 'NW10 5CD',
      trip_type: 'both',
      distance: 'meet',
      date: '2024-08-19',
      time: '08:00:00',
      seats_available: 1,
      year_groups: 'Reception-Y4',
      driver_verified: true
    }
  ];

  const supabaseRequest = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        ...options,
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${supabaseAuthToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`Supabase error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Supabase request failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      if (typeof window !== 'undefined') {
        const savedUser = JSON.parse(localStorage.getItem('tandem-user') || 'null');
        if (savedUser) {
          setUser(savedUser);
          await loadRides();
          await loadMyRides();
          setParentMessages([
            {
              id: 1,
              sender: 'Sarah (Emma\'s Mum)',
              message: 'Thanks for organizing the school run today! 🙏',
              timestamp: '8:10 AM',
              type: 'received'
            },
            {
              id: 2,
              sender: 'Driver Updates',
              message: 'Good morning! Starting the school run now 🚗',
              timestamp: '8:12 AM',
              type: 'system'
            }
          ]);
        } else {
          await loadRides();
        }
      }
      setLoading(false);
    };

    initializeApp();
  }, []);

  const loadRides = async () => {
    try {
      const data = await supabaseRequest('rides_with_driver');
      setRides(data || []);
    } catch (error) {
      console.error('Error loading rides, using sample data:', error);
      setRides(sampleRides);
    }
  };

  const loadMyRides = async () => {
    if (!user) return;
    
    try {
      const data = await supabaseRequest(`rides?driver_id=eq.${user.id}`);
      setMyRides(data || []);
    } catch (error) {
      console.error('Error loading my rides:', error);
    }
  };

  const sendNotification = (title, body) => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        new Notification(title, { body: body, icon: '/favicon.ico' });
      }
    } catch (error) {
      console.log('Notification:', title, body);
    }
  };

  const startActiveRide = (ride) => {
    setActiveRide(ride);
    sendNotification('🚗 Ride Started!', 'Tap for quick actions to update parents');
  };

  const sendQuickMessage = (message) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const parentMessage = {
      id: Date.now(),
      sender: user?.user_metadata?.name || user?.name || 'Driver',
      message: message,
      timestamp: timestamp,
      type: 'sent'
    };
    
    setParentMessages(prev => [...prev, parentMessage]);
    sendNotification('✅ Update Sent', `Parents notified: ${message}`);
  };

  const stopActiveRide = () => {
    setActiveRide(null);
    sendNotification('🏁 Ride Complete', 'Thank you for a safe school run!');
  };

  const startCamera = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setShowCamera(true);
      }
    } catch (error) {
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturedPhoto(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoDataUrl);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const sendPhotoMessage = (photoUrl, caption = '') => {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const message = {
      id: Date.now(),
      sender: user?.user_metadata?.name || user?.name || 'You',
      message: caption || 'Photo update',
      photo: photoUrl,
      timestamp: timestamp,
      type: 'sent'
    };
    
    setParentMessages(prev => [...prev, message]);
    setCapturedPhoto(null);
    setShowCamera(false);
    
    sendNotification('📸 Photo Sent', `Photo shared with parents: ${caption || 'Photo update'}`);
  };

  const sendCustomMessage = () => {
    if (!newMessage.trim()) return;
    
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const message = {
      id: Date.now(),
      sender: user?.user_metadata?.name || user?.name || 'You',
      message: newMessage,
      timestamp: timestamp,
      type: 'sent'
    };
    
    setParentMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const loginData = await loginResponse.json();
      
      if (loginData.user && loginData.access_token) {
        const authUser = {
          id: loginData.user.id,
          email: loginData.user.email,
          user_metadata: loginData.user.user_metadata || {}
        };
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('tandem-user', JSON.stringify(authUser));
        }
        setUser(authUser);
        
        supabaseAuthToken = loginData.access_token;
        
        await loadRides();
        await loadMyRides();
        
        setParentMessages([
          {
            id: 1,
            sender: 'Sarah (Emma\'s Mum)',
            message: 'Thanks for organizing the school run today! 🙏',
            timestamp: '8:10 AM',
            type: 'received'
          },
          {
            id: 2,
            sender: 'Driver Updates',
            message: 'Good morning! Starting the school run now 🚗',
            timestamp: '8:12 AM',
            type: 'system'
          }
        ]);
        
        alert('Successfully logged in with Supabase!');
      } else {
        throw new Error(loginData.error?.message || 'Login failed');
      }
      
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Login error:', error);
      
      const demoUser = {
        id: Date.now().toString(),
        email: email,
        user_metadata: {
          name: 'Demo User',
          postcode: 'NW10 4EB',
          children: 'Emma Y3, Jack Y1',
          photoConsent: false,
          school: 'Maple Walk Prep'
        }
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('tandem-user', JSON.stringify(demoUser));
      }
      setUser(demoUser);
      
      await loadRides();
      setEmail('');
      setPassword('');
      
      setParentMessages([
        {
          id: 1,
          sender: 'Sarah (Emma\'s Mum)',
          message: 'Thanks for organizing the school run today! 🙏',
          timestamp: '8:10 AM',
          type: 'received'
        },
        {
          id: 2,
          sender: 'Driver Updates',
          message: 'Good morning! Starting the school run now 🚗',
          timestamp: '8:12 AM',
          type: 'system'
        }
      ]);
      
      alert('Demo mode login (real Supabase auth failed)');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password,
          data: {
            name: name,
            postcode: postcode,
            children: children,
            photoConsent: photoConsent,
            school: 'Maple Walk Prep'
          }
        })
      });

      const signupData = await signupResponse.json();
      
      if (signupData.user) {
        const newUser = {
          id: signupData.user.id,
          email: signupData.user.email,
          user_metadata: {
            name: name,
            postcode: postcode,
            children: children,
            photoConsent: photoConsent,
            school: 'Maple Walk Prep'
          }
        };
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('tandem-user', JSON.stringify(newUser));
        }
        setUser(newUser);
        
        alert('Account created successfully!');
      } else {
        throw new Error(signupData.error?.message || 'Signup failed');
      }
      
      await loadRides();
      
      setEmail('');
      setPassword('');
      setName('');
      setPostcode('');
      setChildren('');
      setPhotoConsent(false);
    } catch (error) {
      console.error('Signup error:', error);
      
      const demoUser = {
        id: Date.now().toString(),
        email: email,
        user_metadata: {
          name: name,
          postcode: postcode,
          children: children,
          photoConsent: photoConsent,
          school: 'Maple Walk Prep'
        }
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('tandem-user', JSON.stringify(demoUser));
      }
      setUser(demoUser);
      
      await loadRides();
      
      setEmail('');
      setPassword('');
      setName('');
      setPostcode('');
      setChildren('');
      setPhotoConsent(false);
      
      alert('Demo account created!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tandem-user');
    }
    setUser(null);
    setRides([]);
    setMyRides([]);
    setParentMessages([]);
  };

  const createRide = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      const rideData = {
        driver_id: user.id,
        postcode: ridePostcode,
        trip_type: tripType,
        distance: distance,
        date: date,
        time: time,
        seats_available: parseInt(seats),
        year_groups: yearGroups,
        school: 'Maple Walk Prep'
      };

      const newRide = {
        id: Date.now().toString(),
        driver_name: user.user_metadata?.name || user.name || user.email,
        driver_verified: true,
        ...rideData
      };
      
      setRides(prev => [newRide, ...prev]);
      setMyRides(prev => [newRide, ...prev]);
      alert('Ride posted successfully!');
    } catch (error) {
      setError('Failed to create ride. Please try again.');
    }
    
    setRidePostcode('');
    setTripType('pickup');
    setDistance('0.5');
    setDate('');
    setTime('08:15');
    setSeats('1');
    setYearGroups('Y1-Y3');
    setLoading(false);
  };

  const requestRide = async (rideId) => {
    if (!user) {
      alert('Please sign in to request a ride.');
      return;
    }
    alert('Ride request sent!');
  };

  const CameraInterface = () => (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-black text-white p-4 flex items-center justify-between">
        <button onClick={stopCamera} className="text-white hover:text-gray-300">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-semibold">Take Photo</h2>
        <div className="w-6"></div>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {!capturedPhoto ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <button
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-blue-500 transition-colors"
              >
                <Camera className="w-8 h-8 mx-auto text-gray-600" />
              </button>
            </div>
            
            <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
              <p className="text-sm text-center">📸 Take a quick photo to share with parents</p>
            </div>
          </>
        ) : (
          <>
            <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
            
            <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-4">
              <button
                onClick={() => setCapturedPhoto(null)}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
              >
                Retake
              </button>
              <button
                onClick={() => sendPhotoMessage(capturedPhoto, 'Quick update from the school run! 📸')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                Send Photo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const ParentMessageFeed = () => (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="bg-green-600 text-white p-4 flex items-center justify-between">
        <button onClick={() => setShowMessaging(false)} className="text-white hover:text-gray-200">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Parent Group Chat</h2>
          <p className="text-green-200 text-sm">Maple Walk Prep - School Run</p>
        </div>
        <div className="w-6"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-4">
          {parentMessages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'sent' 
                  ? 'bg-green-600 text-white' 
                  : message.type === 'system'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-white text-gray-800 border'
              }`}>
                {message.type !== 'sent' && message.type !== 'system' && (
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    {message.sender}
                  </div>
                )}
                
                {message.photo && (
                  <div className="mb-2">
                    <img src={message.photo} alt="Shared photo" className="max-w-full h-auto rounded-lg border" style={{ maxHeight: '200px' }} />
                  </div>
                )}
                
                <div className="text-sm">{message.message}</div>
                <div className={`text-xs mt-1 ${message.type === 'sent' ? 'text-green-200' : 'text-gray-500'}`}>
                  {message.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendCustomMessage()}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {user?.user_metadata?.photoConsent && (
            <button onClick={startCamera} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
              <Camera className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={sendCustomMessage}
            disabled={!newMessage.trim()}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button onClick={() => setNewMessage('On my way! 🚗')} className="bg-blue-100 text-blue-800 py-2 px-3 rounded text-sm hover:bg-blue-200">
            📍 On my way
          </button>
          <button onClick={() => setNewMessage('Running 5 mins late ⏰')} className="bg-orange-100 text-orange-800 py-2 px-3 rounded text-sm hover:bg-orange-200">
            ⏰ Running late
          </button>
          <button onClick={() => setNewMessage('All children safe! ✅')} className="bg-green-100 text-green-800 py-2 px-3 rounded text-sm hover:bg-green-200">
            ✅ All safe
          </button>
          <button onClick={() => setNewMessage('Arrived at school 🏫')} className="bg-purple-100 text-purple-800 py-2 px-3 rounded text-sm hover:bg-purple-200">
            🏫 At school
          </button>
          {user?.user_metadata?.photoConsent && (
            <button onClick={startCamera} className="bg-blue-100 text-blue-800 py-2 px-3 rounded text-sm hover:bg-blue-200 flex items-center space-x-1 col-span-2">
              <Camera className="w-4 h-4" />
              <span>📸 Take Photo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const QuickActionsPanel = () => {
    if (!activeRide) return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 z-40">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Active Ride</span>
            </div>
            <button onClick={stopActiveRide} className="text-green-200 hover:text-white text-sm">
              End Ride
            </button>
          </div>
          
          <div className="text-sm text-green-100 mb-3">Quick actions - tap to notify parents:</div>
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => sendQuickMessage('Emma safely picked up ✅')} className="bg-green-700 hover:bg-green-800 p-2 rounded text-sm font-medium">
              ✅ Child Picked Up
            </button>
            <button onClick={() => sendQuickMessage('All children arrived safely at school 🏫')} className="bg-green-700 hover:bg-green-800 p-2 rounded text-sm font-medium">
              🏫 At School
            </button>
            <button onClick={() => sendQuickMessage('Running 5 minutes late ⏰')} className="bg-green-700 hover:bg-green-800 p-2 rounded text-sm font-medium">
              ⏰ Running Late
            </button>
            <button onClick={() => sendQuickMessage('All children safe and happy 😊')} className="bg-green-700 hover:bg-green-800 p-2 rounded text-sm font-medium">
              😊 All Safe
            </button>
            {user?.user_metadata?.photoConsent && (
              <button onClick={startCamera} className="bg-blue-700 hover:bg-blue-800 p-2 rounded text-sm font-medium flex items-center justify-center space-x-1 col-span-2">
                <Camera className="w-4 h-4" />
                <span>📸 Quick Photo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Tandem...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-blue-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-blue-600 mb-2">Tandem</h1>
            <p className="text-gray-600">School run coordination for Maple Walk Prep</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {authMode === 'signup' && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Postcode (e.g. NW10 4AB)"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Children (e.g. Emma Y3, Jack Y1)"
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <input
                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div className="flex items-start space-x-3">
    <input
      type="checkbox"
      id="photoConsent"
      checked={photoConsent}
      onChange={(e) => setPhotoConsent(e.target.checked)}
      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <div className="flex-1">
      <label htmlFor="photoConsent" className="text-sm font-medium text-blue-900 cursor-pointer">
        📸 Photo Sharing Consent
      </label>
      <p className="text-xs text-blue-700 mt-1">
        I consent to receiving photos of my child(ren) during school runs via this app.
      </p>
    </div>
  </div>
</div>
                       I consent to receiving photos of my child(ren) during school runs via this app.
                     </p>
                   </div>
                 </div>
               </div>
             </>
           )}
           
           <input
             type="email"
             placeholder="Email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             className="w-full border border-gray-300 rounded-lg px-3 py-2"
           />
           
           <input
             type="password"
             placeholder="Password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             className="w-full border border-gray-300 rounded-lg px-3 py-2"
           />

           {authMode === 'signin' ? (
             <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
               {loading ? 'Signing In...' : 'Sign In'}
             </button>
           ) : (
             <button onClick={handleSignup} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
               {loading ? 'Creating Account...' : 'Sign Up'}
             </button>
           )}

           <button onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')} className="w-full text-blue-600 text-sm py-2 hover:underline">
             {authMode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
           </button>
         </div>

         <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
           <p className="font-medium mb-1">Demo Mode Available:</p>
           <p><strong>Sign In:</strong> Use any email/password for demo</p>
           <p><strong>Sign Up:</strong> Creates demo account with Supabase integration</p>
         </div>
       </div>
     </div>
   );
 }

 return (
   <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
     {showMessaging && <ParentMessageFeed />}
     {showCamera && <CameraInterface />}
     <QuickActionsPanel />
     
     <div className="bg-blue-600 text-white p-4">
       <div className="flex justify-between items-center mb-3">
         <h1 className="text-xl font-bold">Tandem</h1>
         <div className="flex items-center space-x-3">
           <div className="flex items-center space-x-2 text-sm">
             <Shield className="w-4 h-4" />
             <span>Verified</span>
           </div>
           <button onClick={handleLogout} className="text-white hover:text-gray-200">
             <LogOut className="w-4 h-4" />
           </button>
         </div>
       </div>
       
       <div className="bg-blue-700 rounded-lg p-3 text-sm">
         <div className="flex items-center space-x-2 mb-1">
           <MapPin className="w-4 h-4" />
           <span className="font-medium">Maple Walk Prep School Network</span>
         </div>
         <div className="text-blue-200">
           Welcome {user?.user_metadata?.name || user?.name || user?.email}
         </div>
       </div>
     </div>

     <div className="bg-white border-b flex">
       <button onClick={() => setActiveTab('find')} className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'find' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
         Find Rides
       </button>
       <button onClick={() => setActiveTab('offer')} className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'offer' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
         Offer Rides
       </button>
       <button onClick={() => setActiveTab('my')} className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'my' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
         My Rides
       </button>
     </div>

     <div className="p-4">
       <div className="bg-white rounded-lg p-3 mb-4 border">
         <div className="flex items-center justify-between">
           <div className="flex items-center space-x-2">
             <MessageCircle className="w-5 h-5 text-green-600" />
             <span className="font-medium">Parent Group Messages</span>
           </div>
           <div className="flex items-center space-x-2">
             {parentMessages.length > 0 && (
               <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                 {parentMessages.length} new
               </span>
             )}
             <button onClick={() => setShowMessaging(true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
               View Messages
             </button>
           </div>
         </div>
       </div>
       
       {activeTab === 'find' && (
         <div>
           <div className="mb-4">
             <h3 className="font-semibold mb-2">Available Rides</h3>
             <div className="text-sm text-gray-600">{rides.length} rides available</div>
           </div>

           {rides.map(ride => (
             <div key={ride.id} className="bg-white rounded-lg p-4 mb-3 border">
               <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center space-x-2">
                   <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                     <Users className="w-4 h-4 text-blue-600" />
                   </div>
                   <div>
                     <div className="font-medium">{ride.driver_name}</div>
                     <div className="flex items-center space-x-1 text-sm text-gray-600">
                       <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                       <span>4.8</span>
                       {ride.driver_verified && <Shield className="w-3 h-3 text-green-600" />}
                     </div>
                   </div>
                 </div>
                 <div className="text-right">
                   <div className="text-xs text-gray-500">{ride.seats_available} seats</div>
                 </div>
               </div>

               <div className="space-y-1 text-sm text-gray-600 mb-3">
                 <div className="flex items-center space-x-2">
                   <MapPin className="w-3 h-3" />
                   <span>{ride.postcode} area → Maple Walk Prep</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Clock className="w-3 h-3" />
                   <span>{ride.time} • {ride.trip_type}</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Calendar className="w-3 h-3" />
                   <span>{ride.date}</span>
                 </div>
               </div>

               <div className="text-xs text-blue-600 mb-3">
                 {ride.year_groups} welcome
               </div>

               <div className="flex space-x-2">
                 <button onClick={() => requestRide(ride.id)} className="bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700">
                   Request Ride
                 </button>
                 <button onClick={() => setShowMessaging(true)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                   <MessageCircle className="w-4 h-4" />
                 </button>
               </div>
             </div>
           ))}
         </div>
       )}

       {activeTab === 'offer' && (
         <div>
           <div className="bg-white rounded-lg p-4 mb-4">
             <h3 className="font-semibold mb-3">Offer a Ride</h3>
             
             <div className="space-y-3">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Your Postcode</label>
                 <input 
                   type="text" 
                   placeholder="e.g. NW10 4AB" 
                   value={ridePostcode}
                   onChange={(e) => setRidePostcode(e.target.value)}
                   className="w-full border border-gray-300 rounded-lg px-3 py-2"
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type</label>
                   <select 
                     value={tripType}
                     onChange={(e) => setTripType(e.target.value)}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2"
                   >
                     <option value="pickup">Pick up (to school)</option>
                     <option value="dropoff">Drop off (from school)</option>
                     <option value="both">Both ways</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Travel Distance</label>
                   <select 
                     value={distance}
                     onChange={(e) => setDistance(e.target.value)}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2"
                   >
                     <option value="0.25">Within 0.25 miles</option>
                     <option value="0.5">Within 0.5 miles</option>
                     <option value="1">Within 1 mile</option>
                     <option value="2">Within 2 miles</option>
                     <option value="3">Within 3 miles</option>
                     <option value="meet">Meet at my address</option>
                   </select>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                   <input 
                     type="date" 
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                   <input 
                     type="time" 
                     value={time}
                     onChange={(e) => setTime(e.target.value)}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                   />
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Seats Available</label>
                   <select 
                     value={seats}
                     onChange={(e) => setSeats(e.target.value)}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2"
                   >
                     <option value="1">1 seat</option>
                     <option value="2">2 seats</option>
                     <option value="3">3 seats</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Year Groups</label>
                   <select 
                     value={yearGroups}
                     onChange={(e) => setYearGroups(e.target.value)}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2"
                   >
                     <option value="Reception">Reception only</option>
                     <option value="Y1">Y1 only</option>
                     <option value="Y2">Y2 only</option>
                     <option value="Y3">Y3 only</option>
                     <option value="Y4">Y4 only</option>
                     <option value="Y5">Y5 only</option>
                     <option value="Y6">Y6 only</option>
                     <option value="Reception-Y2">Reception-Y2</option>
                     <option value="Y3-Y6">Y3-Y6</option>
                     <option value="Y1-Y4">Y1-Y4</option>
                     <option value="Any">Any year group</option>
                   </select>
                 </div>
               </div>

               <div className="bg-blue-50 p-3 rounded-lg">
                 <div className="text-sm font-medium text-blue-800 mb-1">💡 Connected to Supabase!</div>
                 <div className="text-xs text-blue-600">
                   Real-time data sync and secure authentication enabled
                 </div>
               </div>
               
               <button 
                 onClick={createRide}
                 disabled={loading}
                 className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
               >
                 {loading ? 'Posting...' : 'Post Ride Offer'}
               </button>
             </div>
           </div>

           <div className="bg-blue-50 p-4 rounded-lg">
             <h4 className="font-medium text-blue-900 mb-2">📸 Photo Sharing Settings</h4>
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-blue-800">Photo sharing with parents</p>
                 <p className="text-xs text-blue-600">
                   {user?.user_metadata?.photoConsent ? 'You have consented to photo sharing' : 'Photo sharing disabled'}
                 </p>
               </div>
               <div className={`w-3 h-3 rounded-full ${user?.user_metadata?.photoConsent ? 'bg-green-500' : 'bg-gray-400'}`}></div>
             </div>
           </div>
         </div>
       )}

       {activeTab === 'my' && (
         <div>
           <div className="bg-white rounded-lg p-4 mb-4">
             <h3 className="font-semibold mb-3">My Rides</h3>
             
             {myRides.length === 0 ? (
               <div className="text-center py-8">
                 <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                 <p className="text-gray-600">No rides yet</p>
                 <p className="text-sm text-gray-500">Your posted rides will appear here</p>
               </div>
             ) : (
               myRides.map(ride => (
                 <div key={ride.id} className="border-l-4 border-green-500 bg-green-50 p-3 rounded-r-lg mb-3">
                   <div className="flex justify-between items-start mb-2">
                     <div>
                       <div className="font-medium">Offering Ride</div>
                       <div className="text-sm text-gray-600">{ride.postcode} → Maple Walk Prep</div>
                     </div>
                     <div className="text-xs text-gray-500">Active</div>
                   </div>
                   
                   <div className="text-sm space-y-1">
                     <div>{ride.time} • {ride.date}</div>
                     <div className="text-gray-600">
                       {ride.seats_available} seats • {ride.year_groups}
                     </div>
                   </div>
                   
                   <div className="flex space-x-2 mt-3">
                     <button className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700">
                       View Requests
                     </button>
                     <button 
                       onClick={() => startActiveRide(ride)}
                       className="bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600"
                     >
                       🚗 Start Ride
                     </button>
                   </div>
                 </div>
               ))
             )}
           </div>

           <div className="bg-white rounded-lg p-4">
             <h4 className="font-medium mb-2">This Week</h4>
             <div className="grid grid-cols-2 gap-4 text-center">
               <div>
                 <div className="text-2xl font-bold text-green-600">{myRides.length}</div>
                 <div className="text-sm text-gray-600">Rides Offered</div>
               </div>
               <div>
                 <div className="text-2xl font-bold text-blue-600">2</div>
                 <div className="text-sm text-gray-600">Families Helped</div>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   </div>
 );
};

export default TandemApp;
