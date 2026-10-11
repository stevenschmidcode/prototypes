import type { FieldErrors } from "@/lib/validation";

/**
 * Ressource existiert nicht – oder gehört nicht zum aktuellen Gast (bewusst nicht unterscheidbar).
 * Meldungen sind Schlüssel (siehe i18n/dictionaries → messages).
 */
export class NotFoundError extends Error {
  constructor(message = "e.notFound") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Fachliche Validierung fehlgeschlagen. */
export class ValidationError extends Error {
  constructor(
    public readonly fieldErrors: FieldErrors,
    message = "v.checkInput",
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
