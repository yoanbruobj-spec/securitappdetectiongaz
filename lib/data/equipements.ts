// Base de données complète des équipements

export const TECHNICIENS = [
  'Christophe Agnus',
  'Yoan Brû',
  'Amine El Yasse',
  'Jérémy Berruee',
  'Gérald Leloir',
]

export const CENTRALES_DATA = {
  Oldham: [
    'MX 15', 'MX 16', 'MX 32', 'MX 32 V1', 'MX 32 V2', 'MX 32 V2 pont',
    'MX 43', 'MX 48', 'MX 52', 'MX 62', 'MX 256', 'CPS', 'SV4B', 'WatchGas SSU', 'Autre'
  ],
  MSA: [
    'GasGard XL', 'SUPREMA', 'SUPREMATouch', 'HazardWatch', 'HazardWatch FX-12',
    'System 9010', 'System 9020', 'Chillgard', 'Autre'
  ],
  Honeywell: [
    'TouchPoint Plus', 'TouchPoint Plus Wireless', 'TouchPoint Pro',
    'TouchPoint 4', 'OELD', 'Autre'
  ],
  Dräger: [
    'REGARD 3900', 'REGARD 3910', 'REGARD 3920', 'REGARD 7000',
    'VarioGard', 'Unigard LT', 'QuadGard', 'Comytron 30RS', 'Autre'
  ],
  Hesion: [
    'Distalarm 215', 'Distalarm 225', 'Distalarm 200', 'Distalarm 250',
    'Distalarm 302', 'Distalarm 323', 'Sensoparc 400', 'Sensoparc 401',
    'Sensoparc 402', 'Sensoparc 500', 'Sensoparc 600', 'EasySense', 'Eolparc', 'Autre'
  ],
  Tecnocontrol: [
    'SE126K', 'SE127K', 'SE128K', 'SE139K', 'SE184K', 'SE194K', 'SE293K',
    'CE100', 'CE100R', 'CE101', 'CE400', 'CE408P', 'CE424P', 'CE516P',
    'ID250', 'AL100', 'AL101', 'BA100', 'PS175', 'PS180/24', 'PS185/24',
    'KB408', 'ES404', 'Autre'
  ],
}

export const DETECTEURS_GAZ_DATA = {
  Oldham: [
    'OLCT 10', 'OLCT 10N', 'OLCT 20', 'OLCT 50', 'OLCT 60', 'OLCT 80',
    'OLCT 100', 'OLCT 300', 'EC2', 'MX 2100', 'MX 2200', 'TOCSIN 625', 'Autre'
  ],
  MSA: [
    'Ultima X', 'Ultima X5000', 'Ultima XIR', 'DF-8500', 'DF-8700',
    'Ultima XE', 'Evolution 5600', 'Chillgard RT', 'Autre'
  ],
  Honeywell: [
    'Sensepoint', 'Sensepoint XCD', 'Optima Plus', 'Searchpoint Optima Plus',
    'Midas', 'Impulse', 'XNX', 'Autre'
  ],
  Dräger: [
    'Polytron 8000', 'Polytron 8100', 'Polytron 8200', 'Polytron 8700',
    'Polytron SE Ex', 'PIR 7000', 'PIR 7200', 'Polytron 3000', 'Autre'
  ],
  Oldham_SIMTRONICS: [
    'Xgard', 'Xgard Bright', 'Xgard Type 1', 'Xgard Type 2', 'Xgard Type 3',
    'Xgard Type 4', 'Xgard Type 5', 'Autre'
  ],
  Hesion: [
    'Sensotox', 'Sensoflam', 'Sensofroid', 'Sensotherm', 'Autre'
  ],
  Tecnocontrol: [
    'TC230', 'TC240', 'TC250', 'TC260', 'TC300', 'TC400', 'TC500', 'Autre'
  ],
  GazDetect: [
    'GD-10', 'GD-20', 'GD-30', 'GD-40', 'Autre'
  ],
}

export const DETECTEURS_FLAMME_DATA = {
  MSA: [
    'FL500 UV/IR', 'FL500-H2 UV/IR', 'FL3100', 'FL3110',
    'FL4000H MSIR', 'FL5000 MSIR', 'FlameGard 5 MSIR', 'Autre'
  ],
  Honeywell: [
    'FS10-R', 'FS20X UV/IR', 'FS24X IR3', 'FS24X Plus',
    'FSL100', 'SS2', 'SS4', 'Autre'
  ],
  Dräger: [
    'Ignis', 'Flame 2000', 'Flame 2100', 'Flame 2500',
    'Flame 2570', 'Flame 2700', 'Flame 3000', 'Flame 5000', 'Autre'
  ],
  Oldham: [
    'MultiFlame DF-TV7 IR3', 'MultiFlame DF-TV7 UV/2IR', 'Détecteur UV',
    'Détecteur UV/IR', 'Détecteur IR3', 'Détecteur IR4', 'Autre'
  ],
  Tecnocontrol: [
    'FL500 UV/IR', 'FL500-H2 UV/IR', 'FL3100', 'FL3110',
    'FL4000H MSIR', 'FL5000 MSIR', 'FlameGard 5 MSIR', 'Autre'
  ],
}

export const TYPES_GAZ = {
  toxiques: [
    { value: 'CO', label: 'CO - Monoxyde de carbone' },
    { value: 'H2S', label: 'H2S - Sulfure d\'hydrogène' },
    { value: 'NH3', label: 'NH3 - Ammoniac' },
    { value: 'SO2', label: 'SO2 - Dioxyde de soufre' },
    { value: 'NO2', label: 'NO2 - Dioxyde d\'azote' },
    { value: 'NO', label: 'NO - Monoxyde d\'azote' },
    { value: 'Cl2', label: 'Cl2 - Chlore' },
    { value: 'HCl', label: 'HCl - Acide chlorhydrique' },
    { value: 'HCN', label: 'HCN - Acide cyanhydrique' },
    { value: 'PH3', label: 'PH3 - Phosphine' },
    { value: 'HF', label: 'HF - Acide fluorhydrique' },
    { value: 'COCl2', label: 'COCl2 - Phosgène' },
    { value: 'SiH4', label: 'SiH4 - Silane' },
    { value: 'AsH3', label: 'AsH3 - Arsine' },
    { value: 'B2H6', label: 'B2H6 - Diborane' },
  ],
  explosifs: [
    { value: 'CH4', label: 'CH4 - Méthane' },
    { value: 'C3H8', label: 'C3H8 - Propane' },
    { value: 'C4H10', label: 'C4H10 - Butane' },
    { value: 'H2', label: 'H2 - Hydrogène' },
    { value: 'C2H4', label: 'C2H4 - Éthylène' },
    { value: 'C2H6', label: 'C2H6 - Éthane' },
    { value: 'C2H2', label: 'C2H2 - Acétylène' },
    { value: 'Essence', label: 'Essence' },
    { value: 'GPL', label: 'GPL' },
    { value: 'Gaz_Naturel', label: 'Gaz Naturel' },
    { value: 'Pentane', label: 'Pentane' },
    { value: 'Hexane', label: 'Hexane' },
    { value: 'Heptane', label: 'Heptane' },
    { value: 'Octane', label: 'Octane' },
    { value: 'LIE', label: 'LIE - Limite inférieure d\'explosivité' },
  ],
  asphyxiants: [
    { value: 'O2', label: 'O2 - Oxygène' },
    { value: 'CO2', label: 'CO2 - Dioxyde de carbone' },
    { value: 'N2', label: 'N2 - Azote' },
    { value: 'Ar', label: 'Ar - Argon' },
    { value: 'He', label: 'He - Hélium' },
  ],
  organiques: [
    { value: 'COV', label: 'COV - Composés Organiques Volatils' },
    { value: 'Benzene', label: 'Benzène' },
    { value: 'Toluene', label: 'Toluène' },
    { value: 'Xylene', label: 'Xylène' },
    { value: 'Acetone', label: 'Acétone' },
    { value: 'Methanol', label: 'Méthanol' },
    { value: 'Ethanol', label: 'Éthanol' },
    { value: 'Styrene', label: 'Styrène' },
  ],
  refrigerants: [
    { value: 'R32', label: 'R32' },
    { value: 'R410A', label: 'R410A' },
    { value: 'R134a', label: 'R134a' },
    { value: 'R404A', label: 'R404A' },
    { value: 'R407C', label: 'R407C' },
    { value: 'R717', label: 'R717 (Ammoniac)' },
    { value: 'R744', label: 'R744 (CO2)' },
    { value: 'R290', label: 'R290 (Propane)' },
    { value: 'R600a', label: 'R600a (Isobutane)' },
  ],
}

export const ALL_GAZ = [
  ...TYPES_GAZ.toxiques,
  ...TYPES_GAZ.explosifs,
  ...TYPES_GAZ.asphyxiants,
  ...TYPES_GAZ.organiques,
  ...TYPES_GAZ.refrigerants,
]

export const MODELES_BATTERIES = [
  '2x 12V 7Ah',
  '2x 12V 12Ah',
  '2x 12V 18Ah',
  '2x 12V 24Ah',
  '2x 24V 7Ah',
  '2x 24V 12Ah',
]

export const TYPES_CONNEXION = [
  '4-20mA',
  'Numérique',
  'Modbus',
  'Autre',
]

export const GAZ_ETALON_ZERO = [
  'Air synthétique 20,9%vol O2',
  '100%N2 (Azote pur)',
  'Air ambiant',
  'Air sec',
  'N2 technique',
]

export const UNITES_MESURE = [
  'ppm',
  '%vol',
  '%LIE',
  'mg/m³',
]