import Link from "next/link";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8 sm:px-8">
      <header className="flex items-center justify-between pb-10">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          secondwind
        </Link>
        <nav className="text-sm text-neutral-500">
          <Link href="/travel" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            travel
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="pt-16 text-xs text-neutral-400">
        secondwind · 3인 바이브 코딩 스튜디오
      </footer>
    </div>
  );
}
