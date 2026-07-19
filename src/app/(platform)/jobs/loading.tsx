export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="animate-shimmer h-7 w-40 rounded-lg" />
        <div className="animate-shimmer h-4 w-64 rounded-lg" />
      </div>
      <div className="bg-card space-y-3 rounded-xl border p-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-shimmer h-10 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
