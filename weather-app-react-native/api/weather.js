import axios from "axios";


const axiosConfig = {
  headers: {
    'User-Agent': 'MyWeatherApp/1.0 (contact@example.com)' 
  }
};


const getCoordsFromCity = async (cityName) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`;
    const response = await axios.get(url, axiosConfig);
    if (response.data && response.data.length > 0) {
      const place = response.data[0];
      return {
        latitude: Number(place.lat),
        longitude: Number(place.lon),
      };
    }
    throw new Error("Location not found");
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
};

const forecastEndpoint = (latitude, longitude, days = 1) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
  `&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;


const apiCall = async (endpoint) => {
  try {
    const response = await axios.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("API call error:", error);
    return {};
  }
};

export const fetchWeatherForecast = async (params) => {
  try {
    const { latitude, longitude } = await getCoordsFromCity(params.cityName);
    const url = forecastEndpoint(latitude, longitude, params.days);
    return await apiCall(url);
  } catch (error) {
    console.error("fetchWeatherForecast error:", error);
    return {};
  }
};

// Fetch locations matching city name using Nominatim search
export const fetchLocations = async (params) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(params.cityName)}`;
    const response = await axios.get(url, axiosConfig);
    return response.data.map(place => ({
      name: place.display_name,
      latitude: Number(place.lat),
      longitude: Number(place.lon),
    }));
  } catch (error) {
    console.error("fetchLocations error:", error);
    return [];
  }
};
