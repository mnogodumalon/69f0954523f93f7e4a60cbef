// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Stammdaten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kunden_csv?: string;
    ansprechpartner_csv?: string;
    artikel_csv?: string;
  };
}

export interface Angebote {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    anfrage_pdf?: string;
    stammdaten_ref?: string; // applookup -> URL zu 'Stammdaten' Record
    ergebnis_json?: string;
  };
}

export const APP_IDS = {
  STAMMDATEN: '69f09533f5e14e96e1b508da',
  ANGEBOTE: '69f09536915bd5d46dd0c8c5',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'stammdaten': {
    'kunden_csv': 'string/textarea',
    'ansprechpartner_csv': 'string/textarea',
    'artikel_csv': 'string/textarea',
  },
  'angebote': {
    'anfrage_pdf': 'file',
    'stammdaten_ref': 'applookup/select',
    'ergebnis_json': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateStammdaten = StripLookup<Stammdaten['fields']>;
export type CreateAngebote = StripLookup<Angebote['fields']>;