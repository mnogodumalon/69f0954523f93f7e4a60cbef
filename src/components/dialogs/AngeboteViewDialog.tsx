import type { Angebote, Stammdaten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil, IconFileText } from '@tabler/icons-react';

interface AngeboteViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Angebote | null;
  onEdit: (record: Angebote) => void;
  stammdatenList: Stammdaten[];
}

export function AngeboteViewDialog({ open, onClose, record, onEdit, stammdatenList }: AngeboteViewDialogProps) {
  function getStammdatenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return stammdatenList.find(r => r.record_id === id)?.fields.kunden_csv ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Angebote</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anfrage (PDF)</Label>
            {record.fields.anfrage_pdf ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.anfrage_pdf} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Stammdaten-Referenz</Label>
            <p className="text-sm">{getStammdatenDisplayName(record.fields.stammdaten_ref)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ergebnis-JSON</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.ergebnis_json ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}