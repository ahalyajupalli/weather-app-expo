import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker'; 

const STORAGE_KEY = '@storm_entries';

export default function SavedEntriesScreen() {
  const [entries, setEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState('latest');

  const loadEntries = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setEntries(sortEntries(parsed, sortOrder));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load entries');
      console.error(error);
    }
  };

  const sortEntries = (list, order) => {
    return [...list].sort((a, b) => {
      if (order === 'latest') return new Date(b.date) - new Date(a.date);
      else return new Date(a.date) - new Date(b.date);
    });
  };

  useEffect(() => {
    loadEntries();
  }, [sortOrder]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries().finally(() => setRefreshing(false));
  };

  if (entries.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-600">No saved entries found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="bg-white"
      contentContainerStyle={{ padding: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text className="text-xl font-semibold mb-4">Saved Storm Entries</Text>

      <View className="mb-4 bg-gray-100 rounded">
        <Picker
          selectedValue={sortOrder}
          onValueChange={(itemValue) => setSortOrder(itemValue)}
          mode="dropdown"
        >
          <Picker.Item label="Latest First" value="latest" />
          <Picker.Item label="Oldest First" value="oldest" />
        </Picker>
      </View>

   
      {entries.map((entry) => (
        <View
          key={entry.id}
          className="mb-4 border border-gray-300 rounded-lg p-4"
        >
          <Image
            source={{ uri: entry.image }}
            className="w-full h-40 rounded"
          />
          <Text className="mt-2 font-bold text-lg">{entry.stormType}</Text>
          <Text className="text-gray-500">{new Date(entry.date).toLocaleString()}</Text>
          <Text className="mt-2 text-gray-700" numberOfLines={3}>
            {entry.notes}
          </Text>
          <Text className="mt-2 text-sm text-gray-600">
            📍 Lat: {entry.location?.latitude.toFixed(5)}, Lon: {entry.location?.longitude.toFixed(5)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
 