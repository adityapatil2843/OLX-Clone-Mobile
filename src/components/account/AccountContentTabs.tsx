import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette } from '../../constants/tokens';
import { LayoutGrid, Clapperboard, Bookmark } from 'lucide-react-native';

export type AccountTabKey = 'listings' | 'reels' | 'saved';

export interface AccountContentTabsProps {
  activeTab: AccountTabKey;
  onTabChange: (tab: AccountTabKey) => void;
  listingsCount?: number;
  reelsCount?: number;
  savedCount?: number;
}

export const AccountContentTabs: React.FC<AccountContentTabsProps> = ({
  activeTab,
  onTabChange,
  listingsCount,
  reelsCount,
  savedCount,
}) => {
  return (
    <View style={styles.tabBar}>
      {/* Listings Tab */}
      <TouchableOpacity
        style={[styles.tabItem, activeTab === 'listings' && styles.tabItemActive]}
        onPress={() => onTabChange('listings')}
        activeOpacity={0.7}
      >
        <LayoutGrid
          size={20}
          color={activeTab === 'listings' ? '#002f34' : palette.slate400}
          strokeWidth={activeTab === 'listings' ? 2.5 : 2}
        />
        <Text
          style={[styles.tabLabel, activeTab === 'listings' && styles.tabLabelActive]}
        >
          Listings {typeof listingsCount === 'number' ? `(${listingsCount})` : ''}
        </Text>
      </TouchableOpacity>

      {/* Reels Tab */}
      <TouchableOpacity
        style={[styles.tabItem, activeTab === 'reels' && styles.tabItemActive]}
        onPress={() => onTabChange('reels')}
        activeOpacity={0.7}
      >
        <Clapperboard
          size={20}
          color={activeTab === 'reels' ? '#002f34' : palette.slate400}
          strokeWidth={activeTab === 'reels' ? 2.5 : 2}
        />
        <Text
          style={[styles.tabLabel, activeTab === 'reels' && styles.tabLabelActive]}
        >
          Reels {typeof reelsCount === 'number' ? `(${reelsCount})` : ''}
        </Text>
      </TouchableOpacity>

      {/* Saved / Wishlist Tab */}
      <TouchableOpacity
        style={[styles.tabItem, activeTab === 'saved' && styles.tabItemActive]}
        onPress={() => onTabChange('saved')}
        activeOpacity={0.7}
      >
        <Bookmark
          size={20}
          color={activeTab === 'saved' ? '#002f34' : palette.slate400}
          strokeWidth={activeTab === 'saved' ? 2.5 : 2}
        />
        <Text
          style={[styles.tabLabel, activeTab === 'saved' && styles.tabLabelActive]}
        >
          Saved {typeof savedCount === 'number' ? `(${savedCount})` : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#002f34',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate500,
  },
  tabLabelActive: {
    color: '#002f34',
    fontWeight: '700',
  },
});
