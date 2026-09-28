export default function RootLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-10" aria-busy>
      <div className="h-3 w-40 animate-pulse rounded-full bg-muted/60" />
      <div className="mt-6 h-14 w-2/3 animate-pulse rounded-2xl bg-muted/50" />
      <div className="mt-4 h-5 w-1/2 animate-pulse rounded-full bg-muted/40" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-3xl bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
