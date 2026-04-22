type Status = "ready" | "coming-soon";

export function ServiceCard({
  title,
  owner,
  summary,
  status,
}: {
  title: string;
  owner: string;
  summary: string;
  status: Status;
}) {
  const ready = status === "ready";
  return (
    <div
      className={
        "rounded-xl border p-5 transition " +
        (ready
          ? "border-neutral-300 hover:border-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500"
          : "border-dashed border-neutral-200 opacity-80 dark:border-neutral-800")
      }
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <span className="text-xs text-neutral-400">{owner}</span>
      </div>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{summary}</p>
      {!ready && (
        <p className="mt-3 text-xs uppercase tracking-wide text-neutral-400">coming soon</p>
      )}
    </div>
  );
}
