import { View, Text, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagnifyingGlassIcon, XMarkIcon, Bars3Icon } from 'react-native-heroicons/outline';
import { CalendarDaysIcon, MapPinIcon, CameraIcon } from 'react-native-heroicons/solid';
import { debounce } from 'lodash';
import { theme } from '../theme';
import { fetchLocations, fetchWeatherForecast } from '../api/weather';
import * as Progress from 'react-native-progress';
import { StatusBar } from 'expo-status-bar';
import { weatherImages } from '../constants';
import { getData, storeData } from '../utils/asyncStorage';
import { useNavigation } from '@react-navigation/native';

const weatherCodeToText = (code) => {
  const codes = {
    0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Mist', 48: 'Mist', 51: 'Light rain', 53: 'Moderate rain',
    55: 'Heavy rain', 56: 'Light freezing rain', 57: 'Heavy freezing rain',
    61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
    66: 'Light freezing rain', 67: 'Heavy freezing rain',
    71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow',
    77: 'Snow grains', 80: 'Light rain', 81: 'Moderate rain', 82: 'Heavy rain',
    85: 'Light snow', 86: 'Heavy snow', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
  };
  return codes[code] || 'other';
};

export default function HomeScreen() {
  const navigation = useNavigation();

  const [showSearch, toggleSearch] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({});
  const [cityName, setCityName] = useState('');

  const [showMenu, setShowMenu] = useState(false);

  const handleSearch = search => {
    if (search && search.length > 2) {
      fetchLocations({ cityName: search }).then(setLocations);
    }
  };

  const handleLocation = loc => {
    setLoading(true);
    toggleSearch(false);
    setLocations([]);
    setShowMenu(false); 
    const city = loc.name || loc;
    setCityName(city);
    fetchWeatherForecast({ cityName: city, days: '7' }).then(data => {
      setWeather(data);
      setLoading(false);
      storeData('city', city);
    });
  };

  useEffect(() => {
    const fetchInitialWeather = async () => {
      const myCity = await getData('city') || 'Islamabad';
      setCityName(myCity);
      fetchWeatherForecast({ cityName: myCity, days: '7' }).then(data => {
        setWeather(data);
        setLoading(false);
      });
    };
    fetchInitialWeather();
  }, []);

  const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);

  const current = weather.current_weather;
  const daily = weather.daily;

  return (
    <View className="flex-1 relative">
      <StatusBar style="light" />
      <Image blurRadius={70} source={require('../assets/images/bg.png')} className="absolute w-full h-full" />

      {loading ? (
        <View className="flex-1 flex-row justify-center items-center">
          <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
        </View>
      ) : (
        <SafeAreaView className="flex flex-1">

         
          <View className="mx-4 flex-row items-center justify-between z-50 mb-2 relative">
            {/* Menu Button */}
            <TouchableOpacity
              onPress={() => setShowMenu(!showMenu)}
              className="p-2"
            >
              <Bars3Icon size={25} color="white" />
            </TouchableOpacity>

        
            <View className="flex-1 mx-2">
              {showSearch && (
                <TextInput
                  onChangeText={handleTextDebounce}
                  placeholder="Search city"
                  placeholderTextColor="lightgray"
                  autoFocus
                  className="px-4 py-2 bg-white/20 text-white rounded-full"
                />
              )}
            </View>

          
            <TouchableOpacity
              onPress={() => {
                toggleSearch(!showSearch);
                setShowMenu(false); 
                setLocations([]);   
              }}
              className="p-2 bg-white/20 rounded-full"
            >
              {showSearch ? <XMarkIcon size={24} color="white" /> : <MagnifyingGlassIcon size={24} color="white" />}
            </TouchableOpacity>

          
            {showMenu && (
              <View
                style={{
                  position: 'absolute',
                  top: 50,
                  left: 12,
                  backgroundColor: 'white',
                  borderRadius: 10,
                  paddingVertical: 8,
                  width: 180,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                  zIndex: 100,
                }}
              >
                 <TouchableOpacity
                  style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                  onPress={() => {
                    setShowMenu(false);
                    navigation.navigate('Home');
                  
                  }}
                >
                  <Text style={{ color: 'red' }}>🚪 Home</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#ddd' }}
                  onPress={() => {
                    setShowMenu(false);
                    navigation.navigate('SavedEntries');
                  }}
                >
                  <Text>📂 Saved Entries</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#ddd' }}
                  onPress={() => {
                    setShowMenu(false);
                    navigation.navigate('StrongDocumentation');
                  }}
                >
                  <Text>📸 Document Storm</Text>
                </TouchableOpacity>

               
              </View>
            )}
          </View>

    
          {locations.length > 0 && showSearch && (
            <View className="absolute w-full bg-gray-300 top-24 z-40 rounded-3xl">
              {locations.map((loc, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleLocation(loc)}
                  className="flex-row items-center p-3 px-4 border-b border-gray-400"
                >
                  <MapPinIcon size={20} color="gray" />
                  <Text className="text-black text-lg ml-2">{loc?.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

       
          <View className="mx-4 flex justify-around flex-1 mb-2">
            <Text className="text-white text-center text-2xl font-bold">{cityName}</Text>
            <View className="flex-row justify-center">
              <Image source={weatherImages[weatherCodeToText(current?.weathercode)]} className="w-52 h-52" />
            </View>
            <View className="space-y-2">
              <Text className="text-center font-bold text-white text-6xl ml-5">{current?.temperature?.toFixed(0)}&#176;</Text>
              <Text className="text-center text-white text-xl tracking-widest">{weatherCodeToText(current?.weathercode)}</Text>
            </View>
            <View className="flex-row justify-between mx-4">
              <View className="flex-row space-x-2 items-center">
                <Image source={require('../assets/icons/wind.png')} className="w-6 h-6" />
                <Text className="text-white font-semibold text-base">{current?.windspeed} km/h</Text>
              </View>
              <View className="flex-row space-x-2 items-center">
                <Image source={require('../assets/icons/drop.png')} className="w-6 h-6" />
                <Text className="text-white font-semibold text-base">{current?.precipitation} mm</Text>
              </View>
              <View className="flex-row space-x-2 items-center">
                <Image source={require('../assets/icons/sun.png')} className="w-6 h-6" />
                <Text className="text-white font-semibold text-base">--</Text>
              </View>
            </View>
          </View>

          {/* Daily Forecast Section */}
          <View className="mb-2 space-y-3">
            <View className="flex-row items-center mx-5 space-x-2 justify-between">
              <View className="flex-row items-center space-x-2">
                <CalendarDaysIcon size={22} color="white" />
                <Text className="text-white text-base">Daily forecast</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('StrongDocumentation')} className="p-2 rounded-full bg-white/20">
                <CameraIcon size={22} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: 15 }} showsHorizontalScrollIndicator={false}>
              {daily?.time?.map((dateStr, index) => {
                const date = new Date(dateStr);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                const maxTemp = daily.temperature_2m_max[index]?.toFixed(0);
                const weatherCode = daily.weathercode[index];
                return (
                  <View key={index} className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4" style={{ backgroundColor: theme.bgWhite(0.15) }}>
                    <Image source={weatherImages[weatherCodeToText(weatherCode)]} className="w-11 h-11" />
                    <Text className="text-white">{dayName}</Text>
                    <Text className="text-white text-xl font-semibold">{maxTemp}&#176;</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}
