import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import COLORS from '@/constants/Colors';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name='home' size={24} color={color} />
          ),
          headerRight: () => (
            <Link href='/modal' asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name='info-circle'
                    size={25}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name='workouts'
        options={{
          title: 'Plany',
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
