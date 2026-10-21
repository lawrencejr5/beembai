// ── Master GIGL Station & Geolocation Lookup Table ─────────

export interface GIGLStationInfo {
  stationId: number;
  stationName: string;
  stateName: string;
  latitude: number;
  longitude: number;
}

export const GIGL_STATIONS: Record<string, GIGLStationInfo> = {
  lagos: {
    stationId: 4,
    stationName: "LAGOS",
    stateName: "LAGOS",
    latitude: 6.5244,
    longitude: 3.3792,
  },
  abuja: {
    stationId: 3,
    stationName: "ABUJA",
    stateName: "FCT",
    latitude: 9.0765,
    longitude: 7.3986,
  },
  fct: {
    stationId: 3,
    stationName: "ABUJA",
    stateName: "FCT",
    latitude: 9.0765,
    longitude: 7.3986,
  },
  rivers: {
    stationId: 30,
    stationName: "PORT HARCOURT",
    stateName: "RIVERS",
    latitude: 4.8156,
    longitude: 7.0498,
  },
  "port harcourt": {
    stationId: 30,
    stationName: "PORT HARCOURT",
    stateName: "RIVERS",
    latitude: 4.8156,
    longitude: 7.0498,
  },
  oyo: {
    stationId: 14,
    stationName: "IBADAN",
    stateName: "OYO",
    latitude: 7.3775,
    longitude: 3.947,
  },
  ibadan: {
    stationId: 14,
    stationName: "IBADAN",
    stateName: "OYO",
    latitude: 7.3775,
    longitude: 3.947,
  },
  ogun: {
    stationId: 2,
    stationName: "ABEOKUTA",
    stateName: "OGUN",
    latitude: 7.1557,
    longitude: 3.3451,
  },
  abeokuta: {
    stationId: 2,
    stationName: "ABEOKUTA",
    stateName: "OGUN",
    latitude: 7.1557,
    longitude: 3.3451,
  },
  "ijebu ode": {
    stationId: 42,
    stationName: "IJEBU-ODE",
    stateName: "OGUN",
    latitude: 6.8206,
    longitude: 3.9208,
  },
  edo: {
    stationId: 6,
    stationName: "BENIN",
    stateName: "EDO",
    latitude: 6.335,
    longitude: 5.6037,
  },
  benin: {
    stationId: 6,
    stationName: "BENIN",
    stateName: "EDO",
    latitude: 6.335,
    longitude: 5.6037,
  },
  delta: {
    stationId: 7,
    stationName: "ASABA",
    stateName: "DELTA",
    latitude: 6.1984,
    longitude: 6.7327,
  },
  asaba: {
    stationId: 7,
    stationName: "ASABA",
    stateName: "DELTA",
    latitude: 6.1984,
    longitude: 6.7327,
  },
  warri: {
    stationId: 34,
    stationName: "WARRI",
    stateName: "DELTA",
    latitude: 5.5174,
    longitude: 5.7501,
  },
  anambra: {
    stationId: 28,
    stationName: "ONITSHA",
    stateName: "ANAMBRA",
    latitude: 6.1498,
    longitude: 6.7858,
  },
  onitsha: {
    stationId: 28,
    stationName: "ONITSHA",
    stateName: "ANAMBRA",
    latitude: 6.1498,
    longitude: 6.7858,
  },
  awka: {
    stationId: 9,
    stationName: "AWKA",
    stateName: "ANAMBRA",
    latitude: 6.2209,
    longitude: 7.072,
  },
  nnewi: {
    stationId: 45,
    stationName: "NNEWI",
    stateName: "ANAMBRA",
    latitude: 6.0199,
    longitude: 6.917,
  },
  enugu: {
    stationId: 13,
    stationName: "ENUGU",
    stateName: "ENUGU",
    latitude: 6.4584,
    longitude: 7.5464,
  },
  imo: {
    stationId: 29,
    stationName: "OWERRI",
    stateName: "IMO",
    latitude: 5.4833,
    longitude: 7.0333,
  },
  owerri: {
    stationId: 29,
    stationName: "OWERRI",
    stateName: "IMO",
    latitude: 5.4833,
    longitude: 7.0333,
  },
  kano: {
    stationId: 20,
    stationName: "KANO",
    stateName: "KANO",
    latitude: 12.0022,
    longitude: 8.592,
  },
  kaduna: {
    stationId: 19,
    stationName: "KADUNA",
    stateName: "KADUNA",
    latitude: 10.5105,
    longitude: 7.4165,
  },
  zaria: {
    stationId: 36,
    stationName: "ZARIA",
    stateName: "KADUNA",
    latitude: 11.0855,
    longitude: 7.7199,
  },
  "akwa ibom": {
    stationId: 33,
    stationName: "UYO",
    stateName: "AKWA IBOM",
    latitude: 5.0377,
    longitude: 7.9128,
  },
  uyo: {
    stationId: 33,
    stationName: "UYO",
    stateName: "AKWA IBOM",
    latitude: 5.0377,
    longitude: 7.9128,
  },
  "cross river": {
    stationId: 11,
    stationName: "CALABAR",
    stateName: "CROSS RIVER",
    latitude: 4.9757,
    longitude: 8.3417,
  },
  calabar: {
    stationId: 11,
    stationName: "CALABAR",
    stateName: "CROSS RIVER",
    latitude: 4.9757,
    longitude: 8.3417,
  },
  kwara: {
    stationId: 17,
    stationName: "ILORIN",
    stateName: "KWARA",
    latitude: 8.4966,
    longitude: 4.5421,
  },
  ilorin: {
    stationId: 17,
    stationName: "ILORIN",
    stateName: "KWARA",
    latitude: 8.4966,
    longitude: 4.5421,
  },
  ondo: {
    stationId: 5,
    stationName: "AKURE",
    stateName: "ONDO",
    latitude: 7.2571,
    longitude: 5.2058,
  },
  akure: {
    stationId: 5,
    stationName: "AKURE",
    stateName: "ONDO",
    latitude: 7.2571,
    longitude: 5.2058,
  },
  osun: {
    stationId: 47,
    stationName: "OSOGBO",
    stateName: "OSUN",
    latitude: 7.7827,
    longitude: 4.5418,
  },
  osogbo: {
    stationId: 47,
    stationName: "OSOGBO",
    stateName: "OSUN",
    latitude: 7.7827,
    longitude: 4.5418,
  },
  plateau: {
    stationId: 18,
    stationName: "JOS",
    stateName: "PLATEAU",
    latitude: 9.8965,
    longitude: 8.8583,
  },
  jos: {
    stationId: 18,
    stationName: "JOS",
    stateName: "PLATEAU",
    latitude: 9.8965,
    longitude: 8.8583,
  },
  benue: {
    stationId: 25,
    stationName: "MAKURDI",
    stateName: "BENUE",
    latitude: 7.7322,
    longitude: 8.5391,
  },
  makurdi: {
    stationId: 25,
    stationName: "MAKURDI",
    stateName: "BENUE",
    latitude: 7.7322,
    longitude: 8.5391,
  },
  abia: {
    stationId: 1,
    stationName: "ABA",
    stateName: "ABIA",
    latitude: 5.1066,
    longitude: 7.3667,
  },
  aba: {
    stationId: 1,
    stationName: "ABA",
    stateName: "ABIA",
    latitude: 5.1066,
    longitude: 7.3667,
  },
  umuahia: {
    stationId: 50,
    stationName: "UMUAHIA",
    stateName: "ABIA",
    latitude: 5.5263,
    longitude: 7.4896,
  },
  bayelsa: {
    stationId: 51,
    stationName: "YENAGOA",
    stateName: "BAYELSA",
    latitude: 4.9267,
    longitude: 6.2676,
  },
  yenagoa: {
    stationId: 51,
    stationName: "YENAGOA",
    stateName: "BAYELSA",
    latitude: 4.9267,
    longitude: 6.2676,
  },
  ebonyi: {
    stationId: 37,
    stationName: "ABAKALIKI",
    stateName: "EBONYI",
    latitude: 6.3249,
    longitude: 8.1137,
  },
  abakaliki: {
    stationId: 37,
    stationName: "ABAKALIKI",
    stateName: "EBONYI",
    latitude: 6.3249,
    longitude: 8.1137,
  },
  ekiti: {
    stationId: 38,
    stationName: "ADO EKITI",
    stateName: "EKITI",
    latitude: 7.6211,
    longitude: 5.2212,
  },
  "ado ekiti": {
    stationId: 38,
    stationName: "ADO EKITI",
    stateName: "EKITI",
    latitude: 7.6211,
    longitude: 5.2212,
  },
  kogi: {
    stationId: 23,
    stationName: "LOKOJA",
    stateName: "KOGI",
    latitude: 7.8023,
    longitude: 6.743,
  },
  lokoja: {
    stationId: 23,
    stationName: "LOKOJA",
    stateName: "KOGI",
    latitude: 7.8023,
    longitude: 6.743,
  },
  niger: {
    stationId: 26,
    stationName: "MINNA",
    stateName: "NIGER",
    latitude: 9.6139,
    longitude: 6.5569,
  },
  minna: {
    stationId: 26,
    stationName: "MINNA",
    stateName: "NIGER",
    latitude: 9.6139,
    longitude: 6.5569,
  },
  nasarawa: {
    stationId: 44,
    stationName: "LAFIA",
    stateName: "NASARAWA",
    latitude: 8.4932,
    longitude: 8.5153,
  },
  lafia: {
    stationId: 44,
    stationName: "LAFIA",
    stateName: "NASARAWA",
    latitude: 8.4932,
    longitude: 8.5153,
  },
  bauchi: {
    stationId: 10,
    stationName: "BAUCHI",
    stateName: "BAUCHI",
    latitude: 10.3158,
    longitude: 9.8442,
  },
  borno: {
    stationId: 24,
    stationName: "MAIDUGURI",
    stateName: "BORNO",
    latitude: 11.8333,
    longitude: 13.15,
  },
  maiduguri: {
    stationId: 24,
    stationName: "MAIDUGURI",
    stateName: "BORNO",
    latitude: 11.8333,
    longitude: 13.15,
  },
  gombe: {
    stationId: 368,
    stationName: "GOMBE",
    stateName: "GOMBE",
    latitude: 10.2897,
    longitude: 11.1673,
  },
  taraba: {
    stationId: 57,
    stationName: "JALINGO",
    stateName: "TARABA",
    latitude: 8.8937,
    longitude: 11.3596,
  },
  jalingo: {
    stationId: 57,
    stationName: "JALINGO",
    stateName: "TARABA",
    latitude: 8.8937,
    longitude: 11.3596,
  },
  adamawa: {
    stationId: 52,
    stationName: "YOLA",
    stateName: "ADAMAWA",
    latitude: 9.2004,
    longitude: 12.4836,
  },
  yola: {
    stationId: 52,
    stationName: "YOLA",
    stateName: "ADAMAWA",
    latitude: 9.2004,
    longitude: 12.4836,
  },
  sokoto: {
    stationId: 49,
    stationName: "SOKOTO",
    stateName: "SOKOTO",
    latitude: 13.0059,
    longitude: 5.2476,
  },
  katsina: {
    stationId: 43,
    stationName: "KATSINA",
    stateName: "KATSINA",
    latitude: 12.9908,
    longitude: 7.6018,
  },
  jigawa: {
    stationId: 55,
    stationName: "DUTSE",
    stateName: "JIGAWA",
    latitude: 11.7562,
    longitude: 9.339,
  },
  dutse: {
    stationId: 55,
    stationName: "DUTSE",
    stateName: "JIGAWA",
    latitude: 11.7562,
    longitude: 9.339,
  },
  zamfara: {
    stationId: 62,
    stationName: "GUSAU",
    stateName: "ZAMFARA",
    latitude: 12.1628,
    longitude: 6.6614,
  },
  gusau: {
    stationId: 62,
    stationName: "GUSAU",
    stateName: "ZAMFARA",
    latitude: 12.1628,
    longitude: 6.6614,
  },
};

/**
 * Resolves an address input string or state/city to a known GIGL Station and GPS coordinates.
 */
export function resolveGIGLStation(stateOrCity?: string): GIGLStationInfo {
  if (!stateOrCity) {
    return GIGL_STATIONS["lagos"];
  }

  const clean = stateOrCity.toLowerCase().trim();

  // Exact match
  if (GIGL_STATIONS[clean]) {
    return GIGL_STATIONS[clean];
  }

  // Partial match
  for (const [key, station] of Object.entries(GIGL_STATIONS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return station;
    }
  }

  // Default fallback to Lagos headquarters
  return GIGL_STATIONS["lagos"];
}
