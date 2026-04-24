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
        "group relative overflow-hidden rounded-2xl border p-5 transition sm:p-6 " +
        (ready
          ? "border-[var(--accent)]/30 bg-white shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[var(--accent)]"
          : "border-dashed border-[var(--line)] bg-white/70 opacity-80")
      }
    >
      {ready && (
        <div
          aria-hidden
          className="absolute right-0 top-0 h-1.5 w-full bg-[var(--accent)] transition group-hover:bg-[var(--accent-strong)]"
        />
      )}
      <div className="flex items-baseline justify-between">
        <h3 className="relative text-lg font-semibold tracking-tight text-[var(--ink)]">{title}</h3>
        <span className="relative rounded-full bg-white/65 px-2 py-0.5 text-xs text-[var(--muted)]">{owner}</span>
      </div>
      <p className="relative mt-3 text-sm leading-relaxed text-[var(--muted)]">{summary}</p>
      {!ready && (
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">coming soon</p>
      )}
      {ready && (
        <p className="relative mt-5 inline-flex rounded-xl bg-[var(--accent)] px-3 py-1 text-xs font-medium text-white">
          바로 사용 가능
        </p>
      )}
    </div>
  );
}
