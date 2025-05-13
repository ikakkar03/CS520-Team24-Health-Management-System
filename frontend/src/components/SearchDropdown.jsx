import { useState, useEffect } from 'react';
import axios from 'axios';

// Add the backend base URL
const BACKEND_URL = 'http://localhost:5000';

export default function SearchDropdown({ 
  type, // 'patient' or 'doctor'
  onSelect,
  placeholder = 'Search...',
  className = ''
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);

  // Debug log when query changes
  useEffect(() => {
    console.log('Query changed:', query);
  }, [query]);

  useEffect(() => {
    const searchItems = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Use the correct endpoint based on type with full backend URL
        const endpoint = type === 'patient' 
          ? `${BACKEND_URL}/api/patients/search?query=${encodeURIComponent(query)}`
          : `${BACKEND_URL}/api/doctors/search?query=${encodeURIComponent(query)}`;
        
        console.log('Making search request to:', endpoint);
        const response = await axios.get(endpoint);
        console.log('Received search results:', response.data);
        
        if (!Array.isArray(response.data)) {
          console.error('Expected array but received:', response.data);
          setError('Invalid response format');
          setResults([]);
          return;
        }

        setResults(response.data);
      } catch (error) {
        console.error('Search error:', error.response || error);
        setError(error.response?.data?.message || 'Failed to fetch results');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search to avoid too many API calls
    const debounceTimer = setTimeout(searchItems, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, type]);

  const handleSelect = (item) => {
    console.log('Selected item:', item);
    onSelect(item);
    setQuery(`${item.first_name} ${item.last_name}`);
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const newQuery = e.target.value;
          console.log('Input changed:', newQuery);
          setQuery(newQuery);
          setShowDropdown(true);
        }}
        onFocus={() => {
          console.log('Input focused');
          setShowDropdown(true);
        }}
        onBlur={() => {
          // Delay hiding dropdown to allow for click events
          setTimeout(() => setShowDropdown(false), 200);
        }}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {showDropdown && (query.length >= 2 || results.length > 0) && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-2 text-red-500">{error}</div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <div className="font-medium">{`${item.first_name} ${item.last_name}`}</div>
                {type === 'doctor' && item.specialization && (
                  <div className="text-sm text-gray-600">{item.specialization}</div>
                )}
                {type === 'patient' && (
                  <div className="text-sm text-gray-600">{item.email}</div>
                )}
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
} 