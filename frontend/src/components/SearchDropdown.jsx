import { useState, useEffect } from 'react';
import axios from 'axios';

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

  useEffect(() => {
    const searchItems = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const endpoint = type === 'patient' 
          ? `/api/prescriptions/search-patients?query=${encodeURIComponent(query)}`
          : `/api/doctors/search?query=${encodeURIComponent(query)}`;
        
        const response = await axios.get(endpoint);
        // Ensure results is always an array
        setResults(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error searching:', error);
        setError('Failed to fetch results');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchItems, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, type]);

  const handleSelect = (item) => {
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
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
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