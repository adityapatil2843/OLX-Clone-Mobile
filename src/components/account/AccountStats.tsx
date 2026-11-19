import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette, spacing } from '../../constants/tokens';

export interface AccountStatsProps {
  listingsCount: number;
  reelsCount: number;
  followersCount?: number;
  followingCount?: number;
  onListingsPress?: () => void;
  onReelsPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

export const AccountStats: React.FC<AccountStatsProps> = ({
  listingsCount,
  reelsCount,
  followersCount,
  followingCount,
  onListingsPress,
  onReelsPress,
  onFollowersPress,
  onFollowingPress,
}) => {
  const hasFollowersFeature = typeof followersCount === 'number';
  const hasFollowingFeature = typeof followingCount === 'number';

  return (
    <View style={styles.statsRow}>
      {/* Listings Count */}
      <TouchableOpacity
        style={styles.statBox}
        onPress={onListingsPress}
        activeOpacity={onListingsPress ? 0.7 : 1}
      >
        <Text style={styles.statNumber}>{listingsCount}</Text>
        <Text style={styles.statLabel}>Listings</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Reels Count */}
      <TouchableOpacity
        style={styles.statBox}
        onPress={onReelsPress}
        activeOpacity={onReelsPress ? 0.7 : 1}
      >
        <Text style={styles.statNumber}>{reelsCount}</Text>
        <Text style={styles.statLabel}>Reels</Text>
      </TouchableOpacity>

      {/* Extensible Followers / Following (Rendered ONLY when backend provides data) */}
      {hasFollowersFeature && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.statBox}
            onPress={onFollowersPress}
            activeOpacity={onFollowersPress ? 0.7 : 1}
          >
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
        </>
      )}

      {hasFollowingFeature && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.statBox}
            onPress={onFollowingPress}
            activeOpacity={onFollowingPress ? 0.7 : 1}
          >
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: palette.pureWhite,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#002f34',
  },
  statLabel: {
    fontSize: 12,
    color: palette.slate500,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: palette.slate200,
  },
});
