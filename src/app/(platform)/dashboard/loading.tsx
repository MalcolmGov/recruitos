export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="animate-shimmer h-7 w-64 rounded-lg" />
        <div className="animate-shimmer h-4 w-80 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-shimmer h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="animate-shimmer h-72 rounded-xl lg:col-span-3" />
        <div className="animate-shimmer h-72 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}
