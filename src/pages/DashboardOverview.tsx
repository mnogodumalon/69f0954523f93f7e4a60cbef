import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichAngebote } from '@/lib/enrich';
import type { EnrichedAngebote } from '@/types/enriched';
import type { Stammdaten } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StammdatenDialog } from '@/components/dialogs/StammdatenDialog';
import { AngeboteDialog } from '@/components/dialogs/AngeboteDialog';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconSearch,
  IconUsers, IconFileText, IconInbox, IconBuilding,
  IconChevronRight, IconFileAnalytics,
} from '@tabler/icons-react';

const APPGROUP_ID = '69f0954523f93f7e4a60cbef';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    stammdaten, angebote,
    stammdatenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedAngebote = enrichAngebote(angebote, { stammdatenMap });

  // ALL hooks before early returns
  const [selectedStammdaten, setSelectedStammdaten] = useState<Stammdaten | null>(null);
  const [search, setSearch] = useState('');
  const [createStammdatenOpen, setCreateStammdatenOpen] = useState(false);
  const [editStammdaten, setEditStammdaten] = useState<Stammdaten | null>(null);
  const [deleteStammdaten, setDeleteStammdaten] = useState<Stammdaten | null>(null);
  const [createAngebotOpen, setCreateAngebotOpen] = useState(false);
  const [editAngebot, setEditAngebot] = useState<EnrichedAngebote | null>(null);
  const [deleteAngebot, setDeleteAngebot] = useState<EnrichedAngebote | null>(null);

  const filteredStammdaten = useMemo(() => {
    if (!search.trim()) return stammdaten;
    const q = search.toLowerCase();
    return stammdaten.filter(s =>
      (s.fields.kunden_csv ?? '').toLowerCase().includes(q) ||
      (s.fields.ansprechpartner_csv ?? '').toLowerCase().includes(q) ||
      (s.fields.artikel_csv ?? '').toLowerCase().includes(q)
    );
  }, [stammdaten, search]);

  const angeboteForSelected = useMemo(() => {
    if (!selectedStammdaten) return enrichedAngebote;
    return enrichedAngebote.filter(a => a.stammdaten_refName === (
      selectedStammdaten.fields.kunden_csv?.split('\n')[0] ?? ''
    ) || (a.fields.stammdaten_ref ?? '').includes(selectedStammdaten.record_id));
  }, [enrichedAngebote, selectedStammdaten]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const angeboteOhneErgebnis = enrichedAngebote.filter(a => !a.fields.ergebnis_json);
  const angeboteMitErgebnis = enrichedAngebote.filter(a => !!a.fields.ergebnis_json);

  return (
    <div className="space-y-6">
      {/* KPI-Leiste */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Kunden"
          value={String(stammdaten.length)}
          description="Stammdaten gesamt"
          icon={<IconBuilding size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Angebote"
          value={String(enrichedAngebote.length)}
          description="Angebote gesamt"
          icon={<IconFileText size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offen"
          value={String(angeboteOhneErgebnis.length)}
          description="Ohne Ergebnis"
          icon={<IconInbox size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Abgeschlossen"
          value={String(angeboteMitErgebnis.length)}
          description="Mit Ergebnis"
          icon={<IconFileAnalytics size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* Linke Spalte: Stammdaten-Liste */}
        <div className="lg:col-span-2 rounded-[27px] bg-card shadow-lg overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-3 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <IconUsers size={16} className="text-primary shrink-0" />
                Kunden
              </h2>
              <Button size="sm" onClick={() => setCreateStammdatenOpen(true)}>
                <IconPlus size={14} className="mr-1 shrink-0" />
                <span className="hidden sm:inline">Neu</span>
              </Button>
            </div>
            <div className="relative">
              <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
              <Input
                placeholder="Suchen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[520px] divide-y divide-border">
            {filteredStammdaten.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <IconBuilding size={36} stroke={1.5} />
                <p className="text-sm">Keine Kunden gefunden</p>
                <Button size="sm" variant="outline" onClick={() => setCreateStammdatenOpen(true)}>
                  <IconPlus size={14} className="mr-1" /> Ersten Kunden anlegen
                </Button>
              </div>
            )}
            {filteredStammdaten.map(sd => {
              const isSelected = selectedStammdaten?.record_id === sd.record_id;
              const kundenName = sd.fields.kunden_csv?.split('\n')[0] ?? '(Kein Name)';
              const angeboteCount = enrichedAngebote.filter(a =>
                (a.fields.stammdaten_ref ?? '').includes(sd.record_id)
              ).length;
              return (
                <div
                  key={sd.record_id}
                  onClick={() => setSelectedStammdaten(isSelected ? null : sd)}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/8 border-l-2 border-primary' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {kundenName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{kundenName}</p>
                    {sd.fields.ansprechpartner_csv && (
                      <p className="text-xs text-muted-foreground truncate">
                        {sd.fields.ansprechpartner_csv.split('\n')[0]}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {angeboteCount > 0 && (
                      <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                        {angeboteCount}
                      </span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); setEditStammdaten(sd); }}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <IconPencil size={13} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteStammdaten(sd); }}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <IconTrash size={13} className="text-destructive" />
                    </button>
                    {isSelected && <IconChevronRight size={14} className="text-primary" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rechte Spalte: Angebote */}
        <div className="lg:col-span-3 rounded-[27px] bg-card shadow-lg overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="font-semibold text-base flex items-center gap-2 truncate">
                  <IconFileText size={16} className="text-primary shrink-0" />
                  {selectedStammdaten
                    ? `Angebote – ${selectedStammdaten.fields.kunden_csv?.split('\n')[0] ?? ''}`
                    : 'Alle Angebote'}
                </h2>
                {selectedStammdaten && (
                  <button
                    onClick={() => setSelectedStammdaten(null)}
                    className="text-xs text-muted-foreground hover:text-foreground mt-0.5 transition-colors"
                  >
                    Alle anzeigen
                  </button>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => setCreateAngebotOpen(true)}
                className="shrink-0 ml-3"
              >
                <IconPlus size={14} className="mr-1 shrink-0" />
                <span className="hidden sm:inline">Neues Angebot</span>
              </Button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[520px] divide-y divide-border">
            {angeboteForSelected.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <IconFileText size={36} stroke={1.5} />
                <p className="text-sm">Keine Angebote vorhanden</p>
                <Button size="sm" variant="outline" onClick={() => setCreateAngebotOpen(true)}>
                  <IconPlus size={14} className="mr-1" /> Erstes Angebot erstellen
                </Button>
              </div>
            )}
            {angeboteForSelected.map(ang => {
              const hatErgebnis = !!ang.fields.ergebnis_json;
              const hatPdf = !!ang.fields.anfrage_pdf;
              let ergebnisVorschau = '';
              if (ang.fields.ergebnis_json) {
                try {
                  const parsed = JSON.parse(ang.fields.ergebnis_json);
                  ergebnisVorschau = typeof parsed === 'object'
                    ? Object.entries(parsed).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ')
                    : String(parsed);
                } catch {
                  ergebnisVorschau = ang.fields.ergebnis_json.slice(0, 80);
                }
              }
              return (
                <div key={ang.record_id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      hatErgebnis ? 'bg-green-500/10' : 'bg-orange-500/10'
                    }`}>
                      <IconFileAnalytics
                        size={16}
                        className={hatErgebnis ? 'text-green-600' : 'text-orange-500'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold truncate">
                          {ang.stammdaten_refName || 'Kein Kunde zugeordnet'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          hatErgebnis
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {hatErgebnis ? 'Abgeschlossen' : 'Offen'}
                        </span>
                        {hatPdf && (
                          <a
                            href={ang.fields.anfrage_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-primary flex items-center gap-1 hover:underline"
                          >
                            <IconFileText size={12} /> PDF
                          </a>
                        )}
                      </div>
                      {ergebnisVorschau && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {ergebnisVorschau}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditAngebot(ang)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <IconPencil size={14} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setDeleteAngebot(ang)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <IconTrash size={14} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stammdaten Dialoge */}
      <StammdatenDialog
        open={createStammdatenOpen}
        onClose={() => setCreateStammdatenOpen(false)}
        onSubmit={async (fields) => {
          await LivingAppsService.createStammdatenEntry(fields);
          fetchAll();
        }}
        enablePhotoScan={AI_PHOTO_SCAN['Stammdaten']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Stammdaten']}
      />
      <StammdatenDialog
        open={!!editStammdaten}
        onClose={() => setEditStammdaten(null)}
        onSubmit={async (fields) => {
          if (!editStammdaten) return;
          await LivingAppsService.updateStammdatenEntry(editStammdaten.record_id, fields);
          fetchAll();
        }}
        defaultValues={editStammdaten?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Stammdaten']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Stammdaten']}
      />
      <ConfirmDialog
        open={!!deleteStammdaten}
        title="Kunden löschen"
        description={`"${deleteStammdaten?.fields.kunden_csv?.split('\n')[0] ?? ''}" wirklich löschen?`}
        onConfirm={async () => {
          if (!deleteStammdaten) return;
          await LivingAppsService.deleteStammdatenEntry(deleteStammdaten.record_id);
          if (selectedStammdaten?.record_id === deleteStammdaten.record_id) {
            setSelectedStammdaten(null);
          }
          setDeleteStammdaten(null);
          fetchAll();
        }}
        onClose={() => setDeleteStammdaten(null)}
      />

      {/* Angebote Dialoge */}
      <AngeboteDialog
        open={createAngebotOpen}
        onClose={() => setCreateAngebotOpen(false)}
        onSubmit={async (fields) => {
          await LivingAppsService.createAngeboteEntry(fields);
          fetchAll();
        }}
        defaultValues={selectedStammdaten
          ? { stammdaten_ref: createRecordUrl(APP_IDS.STAMMDATEN, selectedStammdaten.record_id) }
          : undefined
        }
        stammdatenList={stammdaten}
        enablePhotoScan={AI_PHOTO_SCAN['Angebote']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Angebote']}
      />
      <AngeboteDialog
        open={!!editAngebot}
        onClose={() => setEditAngebot(null)}
        onSubmit={async (fields) => {
          if (!editAngebot) return;
          await LivingAppsService.updateAngeboteEntry(editAngebot.record_id, fields);
          fetchAll();
        }}
        defaultValues={editAngebot?.fields}
        stammdatenList={stammdaten}
        enablePhotoScan={AI_PHOTO_SCAN['Angebote']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Angebote']}
      />
      <ConfirmDialog
        open={!!deleteAngebot}
        title="Angebot löschen"
        description="Dieses Angebot wirklich löschen?"
        onConfirm={async () => {
          if (!deleteAngebot) return;
          await LivingAppsService.deleteAngeboteEntry(deleteAngebot.record_id);
          setDeleteAngebot(null);
          fetchAll();
        }}
        onClose={() => setDeleteAngebot(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Skeleton className="lg:col-span-2 h-96 rounded-[27px]" />
        <Skeleton className="lg:col-span-3 h-96 rounded-[27px]" />
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Starte Reparatur...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte lade die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Repariere...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte Support kontaktieren.</p>}
    </div>
  );
}
