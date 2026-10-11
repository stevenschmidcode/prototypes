import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageIntro } from "@/components/common/section";
import { localizePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.privacy.meta };
}

export default async function PrivacyPage() {
  const { locale, t } = await getI18n();
  return (
    <Container className="max-w-3xl">
      <PageIntro eyebrow={t.privacy.eyebrow} title={t.privacy.title} description={t.privacy.description} />
      <div className="space-y-4">
        {t.privacy.sections.map((section) => (
          <section key={section.title} className="rounded-3xl bg-card p-5 ring-1 ring-border md:p-7">
            <h2 className="mb-2 text-lg font-semibold tracking-tight">{section.title}</h2>
            <div className="space-y-2 text-ink/80">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        <p className="px-1 text-sm text-muted-foreground">
          {t.privacy.manage}{" "}
          <Link href={localizePath(locale, "/profil")} className="font-medium text-forest underline underline-offset-2">
            {t.privacy.toProfile}
          </Link>
        </p>
      </div>
    </Container>
  );
}
