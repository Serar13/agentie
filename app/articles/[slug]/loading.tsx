export default function ArticleDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-24 rounded bg-paper-dark/15 dark:bg-ink/10 mb-6" />

      {/* Metadata skeleton */}
      <div className="h-3 w-32 rounded bg-paper-dark/15 dark:bg-ink/10 mb-4" />

      {/* Title skeleton */}
      <div className="h-10 w-11/12 rounded bg-paper-dark/15 dark:bg-ink/10 mb-4" />
      <div className="h-10 w-3/4 rounded bg-paper-dark/15 dark:bg-ink/10 mb-6" />

      {/* Subtitle skeleton */}
      <div className="h-5 w-5/6 rounded bg-paper-dark/15 dark:bg-ink/10 mb-8" />

      {/* Image skeleton */}
      <div className="aspect-[16/9] w-full rounded-lg bg-paper-dark/15 dark:bg-ink/10 mb-8" />

      {/* Body text skeleton */}
      <div className="space-y-4">
        <div className="h-4 w-full rounded bg-paper-dark/15 dark:bg-ink/10" />
        <div className="h-4 w-full rounded bg-paper-dark/15 dark:bg-ink/10" />
        <div className="h-4 w-11/12 rounded bg-paper-dark/15 dark:bg-ink/10" />
        <div className="h-4 w-5/6 rounded bg-paper-dark/15 dark:bg-ink/10" />
        
        <div className="h-4 w-full rounded bg-paper-dark/15 dark:bg-ink/10 pt-4" />
        <div className="h-4 w-full rounded bg-paper-dark/15 dark:bg-ink/10" />
        <div className="h-4 w-4/5 rounded bg-paper-dark/15 dark:bg-ink/10" />
      </div>
    </main>
  );
}
