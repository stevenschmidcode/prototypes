"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReloadButton({ label = "Erneut versuchen" }: { label?: string }) {
  return (
    <Button className="mt-8" onClick={() => window.location.reload()}>
      <RotateCw data-icon="inline-start" /> {label}
    </Button>
  );
}
