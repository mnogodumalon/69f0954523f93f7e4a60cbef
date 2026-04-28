import type { Angebote } from './app';

export type EnrichedAngebote = Angebote & {
  stammdaten_refName: string;
};
