import React from 'react';
import { View, Text, StyleSheet, ColorValue } from 'react-native';
import { palette } from '../../constants/tokens';

export type TabIconName = 'home' | 'reels' | 'create' | 'chats' | 'account';

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
  size = 20,
}) => {
  const renderGlyph = () => {
    switch (name) {
      case 'home':
        return '⌂';
      case 'reels':
        return '▶';
      case 'chats':
        return '✉';
      case 'account':
        return '👤';
      default:
        return '●';
    }
  };

  if (name === 'create') {
    return (
      <View style={styles.sellButtonOuter}>
        <View style={styles.sellButtonInner}>
          <Text style={styles.createGlyph}>+</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.glyph,
          {
            color,
            fontSize: size,
            fontWeight: focused ? '800' : '500',
          },
        ]}
      >
        {renderGlyph()}
      </Text>
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
  glyph: {
    textAlign: 'center',
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
  createGlyph: {
    fontSize: 24,
    fontWeight: '800',
    color: '#002f34',
    marginTop: -2,
    lineHeight: 26,
  },
});
