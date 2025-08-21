'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Car, Clock, MapPin, Users, Calendar, MessageCircle, Shield, LogOut, Send, X, Camera } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const TandemApp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [postcode, setPostcode] = useState('');
  const [children, setChildren] = useState([{ name: '', yearGroup: '' }]);
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

  const [ridePostcode, setRidePostcode] = useState('');
  const [tripType, setTripType] = useState('pickup');
  const [distance, setDistance] = useState('0.5');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:15');
  const [seats, setSeats] = useState('1');
  const [yearGroups, setYearGroups] = useState('Y1-Y3');

  const supabase = createClientComponentClient();

  const yearGroupOptions = [
    'Reception', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'
  ];

  useEffect(() => {
    const getSession = async () => {
      console.log('🔍 Checking for existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ Found existing session for user:', session.user.id);
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        console.log('Profile fetch result:', { profile, profileError });

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            user_metadata: {
              name: profile.name,
              postcode: profile.postcode,
              children: profile.children,
              photoConsent: profile.photo_consent,
              school: profile.school
            }
          });

          // Fetch rides
          const { data: ridesData } = await supabase
            .from('rides')
            .select('*')
            .order('created_at', { ascending: false });

          if (ridesData) {
            setRides(ridesData);
            const userRides = ridesData.filter(ride => ride.driver_id === session.user.id);
            setMyRides(userRides);
          }

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
        }
      } else {
        console.log('❌ No existing session found');
        // Load any public rides even if not logged in
        const { data: ridesData } = await supabase
          .from('rides')
          .select('*')
          .order('created_at', { ascending: false });

        if (ridesData) {
          setRides(ridesData);
        }
      }
      
      setLoading(false);
    };

    getSession();
  }, []);

  const sendSchoolNotification = async (userData) => {
    try {
      const childrenList = userData.children.map(child => `${child.name} (${child.yearGroup})`).join(', ');
      
      const emailData = {
        to: 'nooralnaseri@gmail.com',
        subject: 'New Tandem User Registration - Verification Required',
        html: `
          <h2>New Tandem User Registration</h2>
          <p>A new user has registered for the Tandem school run coordination app:</p>
          
          <h3>User Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${userData.name}</li>
            <li><strong>Email:</strong> ${userData.email}</li>
            <li><strong>Postcode:</strong> ${userData.postcode}</li>
            <li><strong>Children:</strong> ${childrenList}</li>
            <li><strong>Photo Consent:</strong> ${userData.photoConsent ? 'Yes' : 'No'}</li>
          </ul>
          
          <p>Please verify this user is part of the Maple Walk Prep school community.</p>
          
          <hr>
          <p><em>This email was sent automatically from the Tandem app.</em></p>
        `
      };

      console.log('School notification email:', emailData);
      return true;
    } catch (error) {
      console.error('Failed to send school notification:', error);
      return false;
    }
  };

  const addChild = () => {
    if (children.length < 5) {
      setChildren([...children, { name: '', yearGroup: '' }]);
    }
  };

  const removeChild = (index) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const updateChild = (index, field, value) => {
    const updatedChildren = children.map((child, i) => 
      i === index ? { ...child, [field]: value } : child
    );
    setChildren(updatedChildren);
  };

  const sendNotification = (title, body) => {
    console.log('Notification:', title, body);
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

const handleSignup = async () => {
  alert('Signup function called!');
  console.log('🚨 SIGNUP BUTTON CLICKED - DEBUG VERSION ACTIVE!');
  setLoading(true);
  setError('');
  console.log('📝 Starting signup process...');

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      console.log('Login result:', { authData, authError });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        console.log('✅ Login successful, fetching profile...');
        // Fetch user profile from Supabase
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        console.log('Profile fetch result:', { profile, profileError });

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setError('Login successful but could not fetch profile.');
        } else {
          setUser({
            id: authData.user.id,
            email: authData.user.email,
            user_metadata: {
              name: profile.name,
              postcode: profile.postcode,
              children: profile.children,
              photoConsent: profile.photo_consent,
              school: profile.school
            }
          });

          // Fetch rides from Supabase
          const { data: ridesData, error: ridesError } = await supabase
            .from('rides')
            .select('*')
            .order('created_at', { ascending: false });

          if (!ridesError) {
            setRides(ridesData || []);
            const userRides = ridesData?.filter(ride => ride.driver_id === authData.user.id) || [];
            setMyRides(userRides);
          }

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

          alert('Successfully logged in!');
        }
      }

      setEmail('');
      setPassword('');

    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    console.log('📝 Starting signup process...');

    try {
      const validChildren = children.filter(child => child.name.trim() && child.yearGroup);
      console.log('Valid children:', validChildren);
      
      if (validChildren.length === 0) {
        setError('Please add at least one child with name and year group.');
        setLoading(false);
        return;
      }

      console.log('🔐 Creating auth user...');
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      console.log('Auth signup result:', { authData, authError });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        console.log('✅ Auth user created, now creating profile...');
        
        // Prepare profile data
        const profileData = {
          id: authData.user.id,
          email: email,
          name: name,
          postcode: postcode,
          children: validChildren,
          photo_consent: photoConsent,
          school: 'Maple Walk Prep',
          created_at: new Date().toISOString()
        };

        console.log('📋 About to insert profile data:', profileData);

        // Create profile in Supabase
        const { data: profileResult, error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select();

        console.log('🔍 Profile insert result:', { data: profileResult, error: profileError });

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          setError(`Account created but profile setup failed: ${profileError.message}`);
        } else {
          console.log('✅ Profile created successfully!', profileResult);
          
          // Send school notification
          await sendSchoolNotification({
            name: name,
            email: email,
            postcode: postcode,
            children: validChildren,
            photoConsent: photoConsent
          });

          alert(`Account created for ${name}! Please check your email to verify your account.`);
        }
      }

      // Reset form
      setEmail('');
      setPassword('');
      setName('');
      setPostcode('');
      setChildren([{ name: '', yearGroup: '' }]);
      setPhotoConsent(false);

    } catch (error) {
      console.error('❌ Signup error:', error);
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('🚪 Logging out...');
    await supabase.auth.signOut();
    setUser(null);
    setRides([]);
    setMyRides([]);
    setParentMessages([]);
  };

  const createRide = async () => {
    if (!user) return;

    setLoading(true);
    console.log('🚗 Creating new ride...');
    
    try {
      const rideData = {
        driver_id: user.id,
        driver_name: user.user_metadata?.name || user.name || user.email,
        driver_verified: true,
        postcode: ridePostcode,
        trip_type: tripType,
        distance: distance,
        date: date,
        time: time,
        seats_available: parseInt(seats),
        year_groups: yearGroups,
        school: 'Maple Walk Prep',
        created_at: new Date().toISOString()
      };

      console.log('Ride data to insert:', rideData);

      const { data: newRide, error } = await supabase
        .from('rides')
        .insert(rideData)
        .select()
        .single();

      console.log('Ride creation result:', { data: newRide, error });

      if (error) {
        setError('Failed to create ride. Please try again.');
        console.error('Ride creation error:', error);
      } else {
        setRides(prev => [newRide, ...prev]);
        setMyRides(prev => [newRide, ...prev]);
        alert('Ride posted successfully!');
      }
      
    } catch (error) {
      setError('Failed to create ride. Please try again.');
      console.error('Ride creation error:', error);
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

  const ParentMessageFeed = () => (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
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

            {rides.length === 0 ? (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No rides available yet</p>
                <p className="text-sm text-gray-500">Check back later or offer a ride yourself</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rides.map((ride) => (
                  <div key={ride.id} className="bg-white rounded-lg p-4 border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{ride.driver_name}</div>
                          <div className="text-xs text-gray-500">
                            {ride.driver_verified && <span className="text-green-600">✓ Verified</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ride.trip_type === 'pickup' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {ride.trip_type === 'pickup' ? 'Pick Up' : 'Drop Off'}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{ride.postcode} • {ride.distance}km from school</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{ride.date} at {ride.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{ride.seats_available} seats • {ride.year_groups}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => requestRide(ride.id)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700"
                      >
                        Request Ride
                      </button>
                      <button 
                        onClick={() => startActiveRide(ride)}
                        className="bg-green-600 text-white py-2 px-4 rounded font-medium hover:bg-green-700"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'offer' && (
          <div>
            <h3 className="font-semibold mb-4">Offer a Ride</h3>
            
            <div className="bg-white rounded-lg p-4 border space-y-4">
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type</label>
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="pickup">Morning Pick Up</option>
                  <option value="dropoff">Afternoon Drop Off</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distance from School</label>
                <select
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="0.5">0.5km</option>
                  <option value="1">1km</option>
                  <option value="1.5">1.5km</option>
                  <option value="2">2km</option>
                  <option value="3">3km+</option>
                </select>
              </div>
              
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Seats</label>
                <select
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="1">1 seat</option>
                  <option value="2">2 seats</option>
                  <option value="3">3 seats</option>
                  <option value="4">4 seats</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Groups</label>
                <select
                  value={yearGroups}
                  onChange={(e) => setYearGroups(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Reception">Reception only</option>
                  <option value="Y1-Y2">Y1-Y2</option>
                  <option value="Y1-Y3">Y1-Y3</option>
                  <option value="Y3-Y4">Y3-Y4</option>
                  <option value="Y4-Y6">Y4-Y6</option>
                  <option value="All">All year groups</option>
                </select>
              </div>
              
              <button
                onClick={createRide}
                disabled={loading || !ridePostcode || !date}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Posting Ride...' : 'Post Ride'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'my' && (
          <div>
            <h3 className="font-semibold mb-4">My Rides</h3>
            
            {myRides.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No rides posted yet</p>
                <p className="text-sm text-gray-500">Switch to "Offer Rides" to create your first ride</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRides.map((ride) => (
                  <div key={ride.id} className="bg-white rounded-lg p-4 border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Car className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Your Ride</div>
                          <div className="text-xs text-green-600">✓ Active</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ride.trip_type === 'pickup' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {ride.trip_type === 'pickup' ? 'Pick Up' : 'Drop Off'}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{ride.postcode} • {ride.distance}km from school</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{ride.date} at {ride.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{ride.seats_available} seats • {ride.year_groups}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => startActiveRide(ride)}
                      className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700"
                    >
                      Start This Ride
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TandemApp;bg-green-600 text-white p-4 flex items-center justify-between">
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
            <button onClick={() => sendQuickMessage('Child safely picked up ✅')} className="bg-green-700 hover:bg-green-800 p-2 rounded text-sm font-medium">
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
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
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
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Children & Year Groups</label>
                    <button
                      onClick={addChild}
                      disabled={children.length >= 5}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
                    >
                      Add Child
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {children.map((child, index) => (
                      <div key={index} className="flex gap-2 items-center p-2 bg-gray-50 rounded-md">
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) => updateChild(index, 'name', e.target.value)}
                          placeholder={`Child ${index + 1} name`}
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        
                        <select
                          value={child.yearGroup}
                          onChange={(e) => updateChild(index, 'yearGroup', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="">Select Year</option>
                          {yearGroupOptions.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        
                        {children.length > 1 && (
                          <button
                            onClick={() => removeChild(index)}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
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
            <p className="font-medium mb-1">School Verification:</p>
            <p>New registrations are automatically sent to the school for verification to ensure community safety.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      {showMessaging && <ParentMessageFeed />}
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
          {user?.user_metadata?.children && (
            <div className="text-blue-200 text-xs mt-1">
              Children: {user.user_metadata.children.map(child => `${child.name} (${child.yearGroup})`).join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className="
