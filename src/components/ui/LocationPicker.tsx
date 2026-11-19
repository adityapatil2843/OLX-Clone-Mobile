import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ViewStyle,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MapPin, LocateFixed, ChevronDown, Search, X, Check } from 'lucide-react-native';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import {
  getIndianStates,
  getDistrictsForState,
  detectCurrentLocation,
  findIndianState,
  IndianState,
} from '../../services/location.service';

export interface LocationPickerProps {
  selectedState: string;
  selectedDistrict: string;
  onStateChange: (state: string) => void;
  onDistrictChange: (district: string) => void;
  stateLabel?: string;
  districtLabel?: string;
  showDetectButton?: boolean;
  containerStyle?: ViewStyle;
  error?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  selectedState,
  selectedDistrict,
  onStateChange,
  onDistrictChange,
  stateLabel = 'State',
  districtLabel = 'District / City',
  showDetectButton = true,
  containerStyle,
  error,
}) => {
  const [modalMode, setModalMode] = useState<'state' | 'district' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  // All Indian States
  const allStates = useMemo(() => getIndianStates(), []);

  // Districts for current selected state
  const availableDistricts = useMemo(() => {
    if (!selectedState) return [];
    return getDistrictsForState(selectedState);
  }, [selectedState]);

  // Filtered items based on search query in modal
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (modalMode === 'state') {
      if (!q) return allStates.map((s) => s.name);
      return allStates
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.isoCode.toLowerCase().includes(q)
        )
        .map((s) => s.name);
    }

    if (modalMode === 'district') {
      if (!q) return availableDistricts;
      return availableDistricts.filter((d) => d.toLowerCase().includes(q));
    }

    return [];
  }, [modalMode, searchQuery, allStates, availableDistricts]);

  // Open State Selection
  const handleOpenStateModal = () => {
    setSearchQuery('');
    setModalMode('state');
  };

  // Open District Selection
  const handleOpenDistrictModal = () => {
    if (!selectedState) {
      Alert.alert('Select State First', 'Please choose a state before choosing a district/city.');
      return;
    }
    setSearchQuery('');
    setModalMode('district');
  };

  // Select a State: resets district and closes modal
  const handleSelectState = (stateName: string) => {
    if (stateName !== selectedState) {
      onStateChange(stateName);
      onDistrictChange(''); // Reset district when state changes
    }
    setModalMode(null);
  };

  // Select a District: closes modal
  const handleSelectDistrict = (districtName: string) => {
    onDistrictChange(districtName);
    setModalMode(null);
  };

  // Auto-detect GPS location
  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      const res = await detectCurrentLocation();
      if (!res.success || !res.state) {
        Alert.alert('Location Detection', res.error || 'Failed to detect location.');
        return;
      }

      onStateChange(res.state);
      if (res.district) {
        onDistrictChange(res.district);
      } else {
        onDistrictChange('');
      }

      Alert.alert(
        'Location Detected',
        `Set to ${res.district ? `${res.district}, ` : ''}${res.state}`
      );
    } catch (err: any) {
      Alert.alert('Location Error', err.message || 'An error occurred while detecting location.');
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Top Action / Header Row */}
      {showDetectButton && (
        <View style={styles.detectHeaderRow}>
          <TouchableOpacity
            style={styles.detectBtn}
            onPress={handleDetectLocation}
            disabled={isDetecting}
            activeOpacity={0.7}
          >
            {isDetecting ? (
              <ActivityIndicator size="small" color="#002f34" style={{ marginRight: 6 }} />
            ) : (
              <LocateFixed size={16} color="#002f34" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.detectBtnText}>
              {isDetecting ? 'Detecting GPS...' : 'Detect Current Location'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Inputs Row */}
      <View style={styles.fieldsRow}>
        {/* State Field */}
        <View style={styles.fieldCol}>
          <Text style={styles.label}>{stateLabel} *</Text>
          <TouchableOpacity
            style={[styles.selectBox, !selectedState && styles.selectBoxEmpty]}
            onPress={handleOpenStateModal}
            activeOpacity={0.8}
          >
            <View style={styles.selectLeft}>
              <MapPin size={16} color={selectedState ? '#002f34' : palette.slate400} />
              <Text
                style={[
                  styles.selectText,
                  !selectedState && styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {selectedState || 'Select State'}
              </Text>
            </View>
            <ChevronDown size={18} color={palette.slate500} />
          </TouchableOpacity>
        </View>

        {/* District Field */}
        <View style={styles.fieldCol}>
          <Text style={styles.label}>{districtLabel}</Text>
          <TouchableOpacity
            style={[
              styles.selectBox,
              !selectedState && styles.selectBoxDisabled,
              !selectedDistrict && styles.selectBoxEmpty,
            ]}
            onPress={handleOpenDistrictModal}
            activeOpacity={0.8}
            disabled={!selectedState}
          >
            <View style={styles.selectLeft}>
              <MapPin
                size={16}
                color={
                  !selectedState
                    ? palette.slate300
                    : selectedDistrict
                    ? '#002f34'
                    : palette.slate400
                }
              />
              <Text
                style={[
                  styles.selectText,
                  (!selectedDistrict || !selectedState) && styles.placeholderText,
                  !selectedState && styles.disabledText,
                ]}
                numberOfLines={1}
              >
                {!selectedState
                  ? 'Select state 1st'
                  : selectedDistrict || 'Select District'}
              </Text>
            </View>
            <ChevronDown
              size={18}
              color={!selectedState ? palette.slate300 : palette.slate500}
            />
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Selection Modal */}
      <Modal
        visible={modalMode !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalMode(null)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {modalMode === 'state'
                    ? 'Select State / Union Territory'
                    : `Select District in ${selectedState}`}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {modalMode === 'state'
                    ? 'India (ISO: IN)'
                    : `${availableDistricts.length} districts / cities available`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalMode(null)}
              >
                <X size={20} color={palette.slate700} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Search size={18} color={palette.slate400} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={
                  modalMode === 'state'
                    ? 'Search state (e.g. Maharashtra, Karnataka)...'
                    : 'Search district/city (e.g. Pune, Nagpur)...'
                }
                placeholderTextColor={palette.slate400}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="words"
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={palette.slate400} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              maxToRenderPerBatch={25}
              renderItem={({ item }) => {
                const isSelected =
                  modalMode === 'state'
                    ? item === selectedState
                    : item === selectedDistrict;

                return (
                  <TouchableOpacity
                    style={[
                      styles.listItem,
                      isSelected && styles.listItemSelected,
                    ]}
                    onPress={() =>
                      modalMode === 'state'
                        ? handleSelectState(item)
                        : handleSelectDistrict(item)
                    }
                  >
                    <Text
                      style={[
                        styles.listItemText,
                        isSelected && styles.listItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={14} color={palette.pureWhite} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>
                    No matching {modalMode === 'state' ? 'states' : 'districts'} found.
                  </Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: spacing.xxl }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  detectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f3f2',
    borderWidth: 1,
    borderColor: '#002f34',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.md,
  },
  detectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002f34',
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fieldCol: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: palette.slate700,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.pureWhite,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    minHeight: 46,
  },
  selectBoxEmpty: {
    borderColor: palette.slate200,
  },
  selectBoxDisabled: {
    backgroundColor: palette.slate100,
    borderColor: palette.slate200,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  },
  selectText: {
    fontSize: 14,
    color: palette.slate900,
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  placeholderText: {
    color: palette.slate400,
  },
  disabledText: {
    color: palette.slate400,
  },
  errorText: {
    ...typography.caption,
    color: palette.danger500,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: palette.pureWhite,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    height: '80%',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
  },
  modalSubtitle: {
    fontSize: 12,
    color: palette.slate500,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: palette.slate100,
    borderRadius: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.slate100,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 42,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: palette.slate900,
    paddingVertical: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  listItemSelected: {
    backgroundColor: '#f0f9f8',
    borderRadius: radii.sm,
  },
  listItemText: {
    fontSize: 15,
    color: palette.slate800,
  },
  listItemTextSelected: {
    fontWeight: '700',
    color: '#002f34',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#002f34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 14,
    color: palette.slate400,
  },
});

