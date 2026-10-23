import React from 'react';
import { View, StyleSheet, ColorValue } from 'react-native';
import { Home, Clapperboard, Plus, MessageSquare, User, LayoutGrid } from 'lucide-react-native';
import { palette } from '../../constants/tokens';

export type TabIconName = 'home' | 'reels' | 'listings' | 'create' | 'chats' | 'account';

export interface TabIconProps {
  name: TabIconName;
  focused: boolean;
  color?: ColorValue | string;
  size?: number;
}

export const TabIcon: React.FC<TabIconProps> = ({
  name,
  focused,
  color,
  size = 22,
}) => {
  const iconColor = typeof color === 'string' ? color : palette.slate400;
  const strokeWidth = focused ? 2.5 : 2;

  if (name === 'create') {
    return (
      <View style={styles.sellButtonOuter}>
        <View style={styles.sellButtonInner}>
          <Plus size={22} color="#002f34" strokeWidth={3} />
        </View>
      </View>
    );
  }

  const renderIcon = () => {
    switch (name) {
      case 'home':
        return <Home size={size} color={iconColor} strokeWidth={strokeWidth} />;
      case 'reels':
        return <Clapperboard size={size} color={iconColor} strokeWidth={strokeWidth} />;
      case 'listings':
        return <LayoutGrid size={size} color={iconColor} strokeWidth={strokeWidth} />;
      case 'chats':
        return <MessageSquare size={size} color={iconColor} strokeWidth={strokeWidth} />;
      case 'account':
        return <User size={size} color={iconColor} strokeWidth={strokeWidth} />;
      default:
        return <Home size={size} color={iconColor} strokeWidth={strokeWidth} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  sellButtonOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#002f34',
    borderTopColor: '#23e5db',
    borderRightColor: '#ffce32',
    borderBottomColor: '#23e5db',
    borderLeftColor: '#002f34',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.pureWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    marginTop: -8,
  },
  sellButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.pureWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
