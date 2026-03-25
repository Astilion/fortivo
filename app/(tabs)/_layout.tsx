import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import colors from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.primary,
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.text.primary,
        sceneStyle: {
          backgroundColor: colors.primary,
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name='home' size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='workout-history'
        options={{
          title: 'Historia',
          tabBarIcon: ({ color }) => (
            <Ionicons name='bar-chart' size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='workouts'
        options={{
          title: 'Plany Treningowe',
          tabBarIcon: ({ color }) => (
            <Ionicons name='clipboard-outline' size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='current-workout'
        options={{
          title: 'Mój Trening',
          tabBarIcon: ({ color }) => (
            <Ionicons name='barbell-sharp' size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='exercises'
        options={{
          title: 'Lista ćwiczeń',
          tabBarIcon: ({ color }) => (
            <Ionicons name='list-outline' size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <Ionicons name='person-outline' size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
