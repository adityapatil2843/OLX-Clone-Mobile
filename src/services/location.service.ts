import * as Location from 'expo-location';
import { State, City, IState } from 'country-state-city';

const COUNTRY_CODE = 'IN';

export interface IndianState {
  name: string;
  isoCode: string;
}

export interface DetectedLocationResult {
  success: boolean;
  state?: string;
  stateCode?: string;
  district?: string;
  error?: string;
  coords?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Normalizes strings by trimming, lowercasing, and stripping standard administrative suffixes/prefixes
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\b(state of|nct of|state|district|city|division|pradesh)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Returns all Indian States & Union Territories
 */
export const getIndianStates = (): IndianState[] => {
  const states = State.getStatesOfCountry(COUNTRY_CODE);
  return states.map((s) => ({
    name: s.name,
    isoCode: s.isoCode,
  }));
};

/**
 * Finds a matching Indian State by name or code
 */
export const findIndianState = (query: string): IndianState | null => {
  if (!query) return null;
  const states = getIndianStates();
  const rawClean = query.trim().toLowerCase();

  // 1. Exact match on code or name
  const exact = states.find(
    (s) => s.isoCode.toLowerCase() === rawClean || s.name.toLowerCase() === rawClean
  );
  if (exact) return exact;

  // 2. Normalized similarity match
  const normQuery = normalizeText(query);
  if (!normQuery) return null;

  const matched = states.find((s) => {
    const normName = normalizeText(s.name);
    return (
      normName === normQuery ||
      normName.includes(normQuery) ||
      normQuery.includes(normName)
    );
  });

  return matched || null;
};

/**
 * Returns unique, alphabetically sorted districts/cities for an Indian State
 */
export const getDistrictsForState = (stateNameOrCode: string): string[] => {
  if (!stateNameOrCode) return [];
  const state = findIndianState(stateNameOrCode);
  if (!state) return [];

  const cities = City.getCitiesOfState(COUNTRY_CODE, state.isoCode);
  const uniqueNames = Array.from(new Set(cities.map((c) => c.name.trim()))).filter(Boolean);
  return uniqueNames.sort((a, b) => a.localeCompare(b));
};

/**
 * Requests device location permission and performs reverse geocoding
 * to detect State and District/City within India.
 */
export const detectCurrentLocation = async (): Promise<DetectedLocationResult> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Location permission was denied. Please allow location access in your device settings.',
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const addresses = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (!addresses || addresses.length === 0) {
      return {
        success: false,
        error: 'Unable to resolve address from your current GPS position.',
      };
    }

    const addr = addresses[0];

    // Candidate state names from reverse geocode (region, subregion, etc.)
    const stateCandidates = [
      addr.region,
      addr.subregion,
      addr.district,
      addr.city,
    ].filter(Boolean) as string[];

    let matchedState: IndianState | null = null;
    for (const cand of stateCandidates) {
      matchedState = findIndianState(cand);
      if (matchedState) break;
    }

    // Default fallback to Delhi if detected country is India but state name is ambiguous
    if (!matchedState && (addr.country === 'India' || addr.isoCountryCode === 'IN')) {
      for (const cand of stateCandidates) {
        if (/delhi/i.test(cand)) {
          matchedState = findIndianState('Delhi');
          break;
        }
      }
    }

    if (!matchedState) {
      return {
        success: false,
        error: `Could not identify an Indian state from detected location (${addr.region || addr.city || 'Unknown'}). Please select manually.`,
      };
    }

    // Now resolve district/city within that state
    const availableDistricts = getDistrictsForState(matchedState.isoCode);

    const districtCandidates = [
      addr.district,
      addr.city,
      addr.subregion,
      addr.street,
    ].filter(Boolean) as string[];

    let matchedDistrict: string | undefined = undefined;

    // 1. Look for exact or normalized match in available districts
    for (const cand of districtCandidates) {
      const normCand = normalizeText(cand);
      if (!normCand) continue;

      const found = availableDistricts.find((d) => {
        const normD = normalizeText(d);
        return normD === normCand || normD.includes(normCand) || normCand.includes(normD);
      });

      if (found) {
        matchedDistrict = found;
        break;
      }
    }

    // 2. If no matched district from the list, fallback to addr.district or addr.city
    if (!matchedDistrict) {
      matchedDistrict = addr.district || addr.city || addr.subregion || undefined;
    }

    return {
      success: true,
      state: matchedState.name,
      stateCode: matchedState.isoCode,
      district: matchedDistrict,
      coords: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to detect current location. Please try again.',
    };
  }
};

