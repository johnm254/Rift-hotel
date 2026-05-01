export function SkeletonRoomCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-cream-dark animate-pulse">
      <div className="h-64 bg-cream-dark" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-cream-dark rounded-lg w-3/4" />
        <div className="h-4 bg-cream-dark rounded-lg w-full" />
        <div className="h-4 bg-cream-dark rounded-lg w-2/3" />
        <div className="flex gap-2 mt-4">
          <div className="h-6 bg-cream-dark rounded-full w-16" />
          <div className="h-6 bg-cream-dark rounded-full w-20" />
          <div className="h-6 bg-cream-dark rounded-full w-14" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonMealCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-cream-dark animate-pulse">
      <div className="h-52 bg-cream-dark" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 bg-cream-dark rounded-lg w-1/2" />
          <div className="h-5 bg-cream-dark rounded-lg w-16" />
        </div>
        <div className="h-4 bg-cream-dark rounded-lg w-full" />
        <div className="h-4 bg-cream-dark rounded-lg w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonBookingCard() {
  return (
    <div className="bg-white rounded-2xl border border-cream-dark p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-cream-dark flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-cream-dark rounded-lg w-1/2" />
          <div className="h-4 bg-cream-dark rounded-lg w-3/4" />
          <div className="flex gap-2">
            <div className="h-6 bg-cream-dark rounded-full w-20" />
            <div className="h-6 bg-cream-dark rounded-full w-24" />
          </div>
        </div>
        <div className="h-6 bg-cream-dark rounded-lg w-24" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, type = 'room' }) {
  const Card = type === 'meal' ? SkeletonMealCard : SkeletonRoomCard;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array(count).fill(null).map((_, i) => <Card key={i} />)}
    </div>
  );
}
