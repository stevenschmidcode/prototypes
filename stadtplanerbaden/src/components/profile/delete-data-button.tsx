"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMyDataAction } from "@/app/actions";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export function DeleteDataButton() {
  const router = useRouter();
  const favorites = useFavorites();
  const { t, href, message } = useI18n();
  return (
    <ConfirmDialog
      trigger={
        <Button variant="destructive">
          <Trash2 data-icon="inline-start" /> {t.profile.deleteAll}
        </Button>
      }
      title={t.profile.deleteTitle}
      description={t.profile.deleteText}
      confirmLabel={t.profile.deleteConfirm}
      onConfirm={async () => {
        const result = await deleteMyDataAction();
        if (!result.ok) {
          toast.error(message(result.error));
          return false;
        }
        toast.success(t.profile.deleted);
        favorites.reset();
        router.push(href("/"));
        return true;
      }}
    />
  );
}
