"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTripAction } from "@/app/actions";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/messages";

export function DeleteTripButton({ tripId, tripName }: { tripId: string; tripName: string }) {
  const router = useRouter();
  const { t, href, message } = useI18n();
  return (
    <ConfirmDialog
      trigger={
        <Button variant="destructive">
          <Trash2 data-icon="inline-start" /> {t.editTrip.deleteButton}
        </Button>
      }
      title={fmt(t.editTrip.deleteConfirmTitle, { name: tripName })}
      description={t.editTrip.deleteConfirmText}
      confirmLabel={t.editTrip.deleteConfirm}
      onConfirm={async () => {
        const result = await deleteTripAction(tripId);
        if (!result.ok) {
          toast.error(message(result.error));
          return false;
        }
        toast.success(t.editTrip.deleted);
        router.push(href("/aufenthalt"));
        return true;
      }}
    />
  );
}
