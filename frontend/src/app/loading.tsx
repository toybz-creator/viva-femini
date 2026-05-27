export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 md:px-6 md:pt-10">
      <div className="h-14 w-1/2 animate-pulse rounded-2xl bg-zinc-200" />
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="h-[280px] animate-pulse rounded-3xl bg-zinc-200" />
        <div className="h-[280px] animate-pulse rounded-3xl bg-zinc-200" />
      </div>
      <div className="mt-6 h-[420px] animate-pulse rounded-3xl bg-zinc-200" />
    </div>
  );
}

