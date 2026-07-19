export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="animate-shimmer h-7 w-40 rounded-lg" />
        <div className="animate-shimmer h-4 w-72 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-shimmer h-9 w-40 rounded-full" />
        ))}
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-shimmer h-64 w-64 shrink-0 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
