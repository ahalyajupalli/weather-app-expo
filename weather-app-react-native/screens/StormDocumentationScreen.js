import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActionSheetIOS,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from 'lodash';
import { fetchLocations } from '../api/weather'; 
import DateTimePicker from '@react-native-community/datetimepicker';

const STORAGE_KEY = '@storm_entries';
const backgroundImage = require('../assets/images/Storm.png');

export default function StormDocumentationScreen() {
  const [image, setImage] = useState(null);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState({ name: '', latitude: null, longitude: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);
  const [stormType, setStormType] = useState(null);
  const [items, setItems] = useState([
    { label: 'Thunderstorm', value: 'Thunderstorm' },
    { label: 'Hail', value: 'Hail' },
    { label: 'Tornado', value: 'Tornado' },
    { label: 'Snowstorm', value: 'Snowstorm' },
    { label: 'Other', value: 'Other' },
  ]);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
        alert('Camera and location permissions are required.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        name: 'Current Location',
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      loadEntries();
    })();
  }, []);

  const handleLocationSearch = useCallback(
    debounce(async (query) => {
      if (query.length > 2) {
        const results = await fetchLocations({ cityName: query });
        setLocationSuggestions(results);
      } else {
        setLocationSuggestions([]);
      }
    }, 800),
    []
  );

  const loadEntries = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setEntries(JSON.parse(saved));
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const saveEntriesToStorage = async (newEntries) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    } catch (error) {
      console.error('Failed to save entries:', error);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto();
          else if (buttonIndex === 2) pickFromGallery();
        }
      );
    } else {
     
      pickFromGallery();
    }
  };

  const saveEntry = () => {
    if (!image || !stormType?.trim()) {
      Alert.alert('Validation', 'Please capture a photo and select storm type.');
      return;
    }

    const entry = {
      id: Date.now().toString(),
      image,
      notes,
      stormType,
      location,
      date: date.toISOString(),
    };

    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    saveEntriesToStorage(newEntries);

    Alert.alert('Success', 'Entry saved successfully!');
    setImage(null);
    setNotes('');
    setStormType(null);
    setSearchQuery('');
    setLocationSuggestions([]);
    setDate(new Date());
  };

  const deleteEntry = async (id) => {
    const filteredEntries = entries.filter((entry) => entry.id !== id);
    setEntries(filteredEntries);
    await saveEntriesToStorage(filteredEntries);
  };

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} blurRadius={3}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formCard}>
          <TouchableOpacity style={styles.captureButton} onPress={showImagePickerOptions}>
            <Text style={styles.captureButtonText}>📷 Choose Photo</Text>
          </TouchableOpacity>

          {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

          <Text style={styles.label}>Notes</Text>
          <TextInput
            placeholder="Describe the storm..."
            placeholderTextColor="#888"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={styles.inputArea}
          />

          <Text style={styles.label}>Storm Type</Text>
          <View style={{ zIndex: 1000, marginBottom: 15 }}>
            <DropDownPicker
              placeholder="Select Storm Type"
              open={open}
              value={stormType}
              items={items}
              setOpen={setOpen}
              setValue={setStormType}
              setItems={setItems}
              style={{ backgroundColor: '#FFF' }}
              dropDownContainerStyle={{ backgroundColor: '#EEE' }}
              textStyle={{ color: '#000' }}
            />
          </View>

          <Text style={styles.label}>Date & Time</Text>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>📅 {date.toLocaleString()}</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onDateChange}
            />
          )}

          <Text style={styles.label}>Location</Text>
          <TextInput
            placeholder="Enter city name..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleLocationSearch(text);
            }}
            style={styles.locationInput}
          />

          {locationSuggestions.length > 0 && (
            <View style={styles.suggestionBox}>
              {locationSuggestions.map((loc, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setLocation({
                      name: loc.name,
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                    });
                    setSearchQuery(loc.name);
                    setLocationSuggestions([]);
                  }}
                  style={styles.suggestionItem}
                >
                  <Text>{loc.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {entries.length > 0 && (
          <View style={styles.entriesSection}>
            <Text style={styles.savedTitle}>Saved Entries</Text>
            {entries.map((entry) => (
              <View key={entry.id} style={styles.savedCard}>
                <Image source={{ uri: entry.image }} style={styles.savedImage} />
                <View style={styles.entryInfo}>
                  <Text style={styles.savedStormType}>{entry.stormType}</Text>
                  <Text style={styles.savedDate}>{new Date(entry.date).toLocaleString()}</Text>
                  <Text numberOfLines={2} style={styles.savedNotes}>
                    {entry.notes}
                  </Text>
                  <Text style={styles.savedLocation}>📍 {entry.location?.name}</Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Delete Entry',
                      'Are you sure you want to delete this entry?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => deleteEntry(entry.id),
                        },
                      ]
                    )
                  }
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  formCard: {
    backgroundColor: '#E0E4EB',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
  },
  captureButton: {
    backgroundColor: '#2F4A7D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 15,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 15,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  inputArea: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    minHeight: 80,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#2F4A7D',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 5,
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  locationInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  suggestionBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  suggestionItem: {
    padding: 10,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  saveButton: {
    backgroundColor: '#2F4A7D',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 20,
    alignItems: 'center',
    alignSelf: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  entriesSection: {
    marginTop: 20,
  },
  savedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  savedCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
  },
  savedImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  entryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  savedStormType: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  savedDate: {
    color: '#555',
    fontSize: 12,
  },
  savedNotes: {
    fontSize: 12,
    color: '#333',
  },
  savedLocation: {
    marginTop: 2,
    fontSize: 11,
    color: '#666',
  },
  deleteButton: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#ff4d4d',
    borderRadius: 8,
    alignSelf: 'center',
    marginLeft: 10,
    height: 32,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
