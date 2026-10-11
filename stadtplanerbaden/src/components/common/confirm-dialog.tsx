"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n/client";

type Props = {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  /** Gibt true zurück, wenn der Dialog geschlossen werden soll */
  onConfirm: () => Promise<boolean>;
};

/** Bestätigung für destruktive Aktionen. */
export function ConfirmDialog({ trigger, title, description, confirmLabel, onConfirm }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (pending) return;
    setPending(true);
    const close = await onConfirm();
    setPending(false);
    if (close) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent showCloseButton={false} role="alertdialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            {t.common.cancel}
          </Button>
          <Button type="button" className="bg-destructive text-white hover:bg-destructive/90" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
