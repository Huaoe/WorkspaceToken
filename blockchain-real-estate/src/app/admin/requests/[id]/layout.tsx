export default function ReviewRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container py-8">
      {children}
    </div>
  );
}
