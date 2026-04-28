import type { EnrichedAngebote } from '@/types/enriched';
import type { Angebote, Stammdaten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface AngeboteMaps {
  stammdatenMap: Map<string, Stammdaten>;
}

export function enrichAngebote(
  angebote: Angebote[],
  maps: AngeboteMaps
): EnrichedAngebote[] {
  return angebote.map(r => ({
    ...r,
    stammdaten_refName: resolveDisplay(r.fields.stammdaten_ref, maps.stammdatenMap, 'kunden_csv'),
  }));
}
