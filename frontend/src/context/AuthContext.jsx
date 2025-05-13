import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Set baseURL for all axios calls
  useEffect(() => {
    axios.defaults.baseURL = API_URL;
    console.log('Axios baseURL set to', axios.defaults.baseURL);
  }, []);

  // On mount, load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);


  const signup = async (firstName, lastName, email, password, role, dateOfBirth, gender, phoneNumber, specialization) => {
    try {
      console.log('Attempting to register user:', { 
        firstName, 
        lastName, 
        email, 
        role,
        dateOfBirth,
        gender,
        phoneNumber,
        specialization
      });
      
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        firstName,
        lastName,
        email,
        password,
        role,
        dateOfBirth,
        gender,
        phoneNumber,
        specialization
      });
      console.log('Register response:', response.data);

      // Immediately log them in
      const loginRes = await axios.post('/api/auth/login', {
        email,
        password,
      });
      console.log('Login response:', loginRes.data);

      const { token, user } = loginRes.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return user;
    } catch (err) {
      console.error('Signup error details:', err);
      // Axios network errors have no response
      if (err.response) {
        throw new Error(err.response.data.message || 'Failed to create account');
      } else {
        throw new Error(`Network Error: could not reach ${API_URL}`);
      }
    }
  };

  const login = async (email, password) => {
    console.log('Logging in to:', `${API_URL}/api/auth/login`);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return user;
    } catch (err) {
      console.error('Login error details:', err);
      if (err.response) {
        throw new Error(err.response.data.message || 'Failed to login');
      } else {
        throw new Error(`Network Error: could not reach ${API_URL}`);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
