import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import StrongDocumentationScreen from '../screens/StormDocumentationScreen';
import { LogBox, Text, View } from 'react-native';
import SavedEntriesScreen from '../screens/SavedEntriesScreen';
const Stack = createNativeStackNavigator();

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" options={{headerShown: false}} component={HomeScreen} />
        <Stack.Screen name="SavedEntries" component={SavedEntriesScreen} />
         <Stack.Screen name="StrongDocumentation" component={StrongDocumentationScreen} options={{ title: 'Documentation' }} />
        {/* <Stack.Screen name="SavedEntries" component={SavedEntries} options={{ title: 'Documentation' }} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  )
  
}
