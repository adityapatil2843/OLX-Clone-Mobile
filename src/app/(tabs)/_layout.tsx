import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../../constants/tokens';
import { TabIcon } from '../../components/ui/TabIcon';

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
            <TabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reels"
        options={{
          title: t('nav.reels', 'Reels'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="reels" focused={focused} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: t('nav.create', 'Sell'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="create" focused={focused} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          title: t('nav.chats', 'Chats'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chats" focused={focused} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: t('nav.account', 'Account'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="account" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
