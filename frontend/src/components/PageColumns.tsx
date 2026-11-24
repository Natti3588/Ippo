// 広い画面では左に中身、右に aside を並べる。狭い画面では aside を中身の上に出す
export function PageColumns({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start">
      <main className="min-w-0 flex-1">{children}</main>
      <aside className="order-first lg:order-none lg:w-80 lg:shrink-0">{aside}</aside>
    </div>
  );
}
