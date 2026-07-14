/** US location dictionary for profile / address forms. */
import usCitiesByState from "@/content/locations/us-cities.json";

export type CountryOption = {
  code: string;
  name: string;
  hasRegionSelectors: boolean;
};

export type StateOption = {
  code: string;
  name: string;
};

export const DEFAULT_COUNTRY_CODE = "US";
export const MANUAL_VALUE = "__manual__";

export const COUNTRIES: CountryOption[] = [
  { code: "US", name: "United States", hasRegionSelectors: true },
  { code: "CA", name: "Canada", hasRegionSelectors: false },
  { code: "GB", name: "United Kingdom", hasRegionSelectors: false },
  { code: "AU", name: "Australia", hasRegionSelectors: false },
  { code: "OTHER", name: "Other", hasRegionSelectors: false },
];

export const US_STATES: StateOption[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
  { code: "DC", name: "District of Columbia" },
];

export const US_CITIES_BY_STATE: Record<string, string[]> = usCitiesByState as Record<string, string[]>;

export const US_STATE_CAPITALS: Record<string, string> = {
  "AL": "Montgomery",
  "AK": "Juneau",
  "AZ": "Phoenix",
  "AR": "Little Rock",
  "CA": "Sacramento",
  "CO": "Denver",
  "CT": "Hartford",
  "DE": "Dover",
  "FL": "Tallahassee",
  "GA": "Atlanta",
  "HI": "Honolulu",
  "ID": "Boise",
  "IL": "Springfield",
  "IN": "Indianapolis",
  "IA": "Des Moines",
  "KS": "Topeka",
  "KY": "Frankfort",
  "LA": "Baton Rouge",
  "ME": "Augusta",
  "MD": "Annapolis",
  "MA": "Boston",
  "MI": "Lansing",
  "MN": "Saint Paul",
  "MS": "Jackson",
  "MO": "Jefferson City",
  "MT": "Helena",
  "NE": "Lincoln",
  "NV": "Carson City",
  "NH": "Concord",
  "NJ": "Trenton",
  "NM": "Santa Fe",
  "NY": "Albany",
  "NC": "Raleigh",
  "ND": "Bismarck",
  "OH": "Columbus",
  "OK": "Oklahoma City",
  "OR": "Salem",
  "PA": "Harrisburg",
  "RI": "Providence",
  "SC": "Columbia",
  "SD": "Pierre",
  "TN": "Nashville",
  "TX": "Austin",
  "UT": "Salt Lake City",
  "VT": "Montpelier",
  "VA": "Richmond",
  "WA": "Olympia",
  "WV": "Charleston",
  "WI": "Madison",
  "WY": "Cheyenne",
  "DC": "Washington"
};

export function getCountryName(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export function getStateName(code: string) {
  return US_STATES.find((s) => s.code === code)?.name ?? code;
}

export function getCitiesForState(stateCode: string) {
  return US_CITIES_BY_STATE[stateCode] ?? [];
}

export function countryUsesSelectors(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.hasRegionSelectors ?? false;
}

export function resolveStateSelection(savedState?: string) {
  if (!savedState) return { mode: "select" as const, code: "", manual: "" };
  const match = US_STATES.find(
    (s) => s.code === savedState || s.name.toLowerCase() === savedState.toLowerCase(),
  );
  if (match) return { mode: "select" as const, code: match.code, manual: "" };
  return { mode: "manual" as const, code: MANUAL_VALUE, manual: savedState };
}

export function resolveCitySelection(stateCode: string, savedCity?: string) {
  if (!savedCity) return { mode: "select" as const, value: "", manual: "" };
  const cities = getCitiesForState(stateCode);
  if (cities.includes(savedCity)) {
    return { mode: "select" as const, value: savedCity, manual: "" };
  }
  return { mode: "manual" as const, value: MANUAL_VALUE, manual: savedCity };
}
