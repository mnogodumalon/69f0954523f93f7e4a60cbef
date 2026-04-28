import type { Stammdaten } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil } from '@tabler/icons-react';

interface StammdatenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Stammdaten | null;
  onEdit: (record: Stammdaten) => void;
}

export function StammdatenViewDialog({ open, onClose, record, onEdit }: StammdatenViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Stammdaten</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kunden (CSV)</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.kunden_csv ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ansprechpartner (CSV)</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.ansprechpartner_csv ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Artikel (CSV)</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.artikel_csv ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}