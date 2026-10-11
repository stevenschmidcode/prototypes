import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { LanguageSwitch } from "@/components/layout/app-nav";
import { localizePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export async function SiteFooter() {
  const { locale, t } = await getI18n();
  const link = "text-muted-foreground underline-offset-4 hover:text-foreground hover:underline";
  return (
    <footer className="mx-auto mt-16 w-full max-w-6xl px-5 pb-28 md:px-6 md:pb-12">
      <div className="flex flex-col gap-6 border-t border-border pt-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Wordmark className="text-xl" />
          <p className="max-w-md text-sm text-muted-foreground">
            {t.footer.claim} {t.common.disclaimer}
          </p>
        </div>
        <nav aria-label={t.footer.legal} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link className={link} href={localizePath(locale, "/datenschutz")}>
            {t.footer.privacy}
          </Link>
          <Link className={link} href={localizePath(locale, "/bildnachweise")}>
            {t.footer.credits}
          </Link>
          <Link className={link} href={localizePath(locale, "/profil")}>
            {t.footer.profile}
          </Link>
          <LanguageSwitch className="-ml-2 border border-input md:hidden" />
        </nav>
      </div>
    </footer>
  );
}
