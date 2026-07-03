import type {
  ArticleReference,
  Category,
  CostLog,
  NewsArticle
} from "@/lib/app-types";
import type { ReactNode } from "react";
import {
  regenerateSocialCopy,
  runPipelineAction,
  saveArticle,
  updateArticleStatus
} from "@/lib/actions";
import { STATUS_VALUES } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ScoreBadge } from "./ScoreBadge";
import { StatusBadge } from "./StatusBadge";

type EditableArticle = NewsArticle & {
  category: Category;
  references: ArticleReference[];
  costs: CostLog[];
};

export function ArticleEditor({
  article,
  categories
}: {
  article: EditableArticle;
  categories: Category[];
}) {
  const totalCost = article.costs.reduce((sum, cost) => sum + cost.estimatedCostEur, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <StatusBadge status={article.status} />
          <ScoreBadge label="pozitiv" score={article.positiveScore} />
          <ScoreBadge label="incredere" score={article.confidenceScore} />
        </div>

        <form action={saveArticle} className="grid gap-5">
          <input type="hidden" name="id" value={article.id} />
          <Field label="Titlu">
            <input name="title" defaultValue={article.title} className="input" required />
          </Field>
          <Field label="Subtitlu">
            <input name="subtitle" defaultValue={article.subtitle ?? ""} className="input" />
          </Field>
          <Field label="Lead">
            <textarea name="lead" defaultValue={article.lead} className="textarea min-h-28" required />
          </Field>
          <Field label="Continut">
            <textarea
              name="content"
              defaultValue={article.content}
              className="textarea min-h-80"
              required
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Categorie">
              <select name="categoryId" defaultValue={article.categoryId} className="input">
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Scor pozitiv">
              <input
                name="positiveScore"
                type="number"
                min="0"
                max="100"
                defaultValue={article.positiveScore}
                className="input"
              />
            </Field>
            <Field label="Scor incredere">
              <input
                name="confidenceScore"
                type="number"
                min="0"
                max="100"
                defaultValue={article.confidenceScore}
                className="input"
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Sursa principala">
              <input name="sourceName" defaultValue={article.sourceName ?? ""} className="input" />
            </Field>
            <Field label="URL original">
              <input name="originalUrl" defaultValue={article.originalUrl ?? ""} className="input" />
            </Field>
          </div>
          <Field label="Note Quality Gate">
            <textarea
              name="qualityNotes"
              defaultValue={article.qualityNotes ?? ""}
              className="textarea min-h-24"
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Meta description">
              <textarea
                name="metaDescription"
                defaultValue={article.metaDescription ?? ""}
                className="textarea min-h-24"
              />
            </Field>
            <Field label="Newsletter short">
              <textarea
                name="newsletterBlurb"
                defaultValue={article.newsletterBlurb ?? ""}
                className="textarea min-h-24"
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Facebook">
              <textarea
                name="socialFacebook"
                defaultValue={article.socialFacebook ?? ""}
                className="textarea min-h-28"
              />
            </Field>
            <Field label="Instagram">
              <textarea
                name="socialInstagram"
                defaultValue={article.socialInstagram ?? ""}
                className="textarea min-h-28"
              />
            </Field>
            <Field label="LinkedIn">
              <textarea
                name="socialLinkedin"
                defaultValue={article.socialLinkedin ?? ""}
                className="textarea min-h-28"
              />
            </Field>
          </div>

          <div className="rounded-lg border border-line bg-paper p-4">
            <h2 className="font-semibold text-ink">Adauga sursa</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Titlu sursa">
                <input name="referenceTitle" className="input" />
              </Field>
              <Field label="Publicatie">
                <input name="referenceOutlet" className="input" />
              </Field>
              <Field label="URL">
                <input name="referenceUrl" type="url" className="input" />
              </Field>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-ink/70">
              <input name="referenceVerified" type="checkbox" className="size-4 accent-leaf" />
              Sursa verificata manual
            </label>
          </div>

          <button
            type="submit"
            className="w-fit rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-leaf"
          >
            Salveaza articol
          </button>
        </form>
      </section>

      <aside className="grid content-start gap-4">
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-ink">Actiuni</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={runPipelineAction}>
              <input type="hidden" name="id" value={article.id} />
              <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink">
                Ruleaza pipeline
              </button>
            </form>
            <form action={regenerateSocialCopy}>
              <input type="hidden" name="id" value={article.id} />
              <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink">
                Regenerate social
              </button>
            </form>
          </div>
          <div className="mt-4 grid gap-2">
            {STATUS_VALUES.map((status) => (
              <form action={updateArticleStatus} key={status}>
                <input type="hidden" name="id" value={article.id} />
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  className="w-full rounded-md border border-line px-3 py-2 text-left text-sm font-semibold text-ink hover:border-moss"
                >
                  Marcheaza {status}
                </button>
              </form>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-ink">Surse</h2>
          <div className="mt-4 grid gap-3">
            {article.references.map((reference) => (
              <a
                href={reference.url}
                key={reference.id}
                className="rounded-md border border-line p-3 text-sm hover:border-moss"
                target="_blank"
                rel="noreferrer"
              >
                <span className="block font-semibold text-ink">{reference.title}</span>
                <span className="mt-1 block text-xs text-moss">{reference.outlet}</span>
                <span className="mt-1 block text-xs text-ink/55">
                  {reference.verified ? "verificata" : "neverificata"}
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-ink">Costuri recente</h2>
          <p className="mt-1 text-sm text-ink/60">Total incarcat: {formatCurrency(totalCost)}</p>
          <div className="mt-4 grid gap-2">
            {article.costs.map((cost) => (
              <div className="rounded-md bg-paper p-3 text-xs" key={cost.id}>
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-ink">{cost.agentName}</span>
                  <span>{formatCurrency(cost.estimatedCostEur)}</span>
                </div>
                <p className="mt-1 text-ink/55">
                  {cost.model} / {cost.inputTokens + cost.outputTokens} tokens
                </p>
                <p className="mt-1 text-ink/45">{formatDateTime(cost.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      <span>{label}</span>
      {children}
    </label>
  );
}
