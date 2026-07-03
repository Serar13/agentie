export default function RootLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 animate-pulse">
      {/* Category Tabs Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-line">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-9 w-20 shrink-0 rounded-md bg-paper-dark/15 dark:bg-ink/10" />
        ))}
      </div>

      {/* Featured Article Skeleton */}
      <div className="mb-8 overflow-hidden rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="aspect-[16/8] w-full rounded-lg bg-paper-dark/15 dark:bg-ink/10 mb-6" />
        <div className="h-4 w-1/4 rounded bg-paper-dark/15 dark:bg-ink/10 mb-4" />
        <div className="h-8 w-3/4 rounded bg-paper-dark/15 dark:bg-ink/10 mb-4" />
        <div className="h-4 w-5/6 rounded bg-paper-dark/15 dark:bg-ink/10 mb-2" />
        <div className="h-4 w-4/6 rounded bg-paper-dark/15 dark:bg-ink/10" />
      </div>

      {/* Grid Articles Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm">
            <div className="aspect-[16/10] w-full rounded-lg bg-paper-dark/15 dark:bg-ink/10 mb-4" />
            <div className="h-3 w-1/3 rounded bg-paper-dark/15 dark:bg-ink/10 mb-3" />
            <div className="h-6 w-11/12 rounded bg-paper-dark/15 dark:bg-ink/10 mb-3" />
            <div className="h-4 w-full rounded bg-paper-dark/15 dark:bg-ink/10 mb-2" />
            <div className="h-4 w-4/5 rounded bg-paper-dark/15 dark:bg-ink/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
