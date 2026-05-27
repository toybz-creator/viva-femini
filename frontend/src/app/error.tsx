'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F6F6F6] px-4 py-10">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Something went wrong</p>
          <p className="mt-2 text-xs text-zinc-500">{error.message || 'Please try again.'}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 w-full rounded-full bg-[#FF2D75] px-5 py-3 text-sm font-semibold text-white hover:bg-[#D81B60]"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}

