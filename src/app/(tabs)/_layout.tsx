import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Clapperboard, MessageSquare, User } from 'lucide-react-native';
import { TabIcon } from '../../components/ui/TabIcon';
import { palette } from '../../constants/tokens';

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Dynamic bottom inset ensuring safe clearance over Android 3-button bar, gesture pill, and iOS home bar
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const tabHeight = 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.brand500,
        tabBarInactiveTintColor: palette.slate400,
        tabBarStyle: {
          backgroundColor: palette.pureWhite,
          borderTopColor: palette.slate200,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home', 'Home'),
          tabBarIcon: ({ color, focused }) => (
            <Clapperboard size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="listings"
        options={{
          title: t('nav.listings', 'Listings'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="listings" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="reels"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="listing"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: t('nav.create', 'Sell'),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="create" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          title: t('nav.chats', 'Chats'),
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: t('nav.account', 'Account'),
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}