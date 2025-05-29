interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className = "", children }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-700/50 rounded ${className}`}>
      {children}
    </div>
  );
}

export function WeatherSkeleton() {
  return (
    <div className="card-glass rounded-2xl p-6 h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Aktuellt väder */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Skeleton className="w-16 h-16 rounded-full mr-4" />
            <div>
              <Skeleton className="h-10 w-20 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Väderdetaljer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-lg p-3 text-center">
              <Skeleton className="h-3 w-12 mb-2 mx-auto" />
              <Skeleton className="h-5 w-16 mb-1 mx-auto" />
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* 7-dagars prognos */}
      <div className="mb-6">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-lg p-2 text-center">
              <Skeleton className="h-3 w-8 mb-1 mx-auto" />
              <Skeleton className="h-6 w-6 mb-1 mx-auto rounded-full" />
              <Skeleton className="h-3 w-6 mb-1 mx-auto" />
              <Skeleton className="h-3 w-6 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TransportSkeleton() {
  return (
    <div className="card-glass rounded-2xl p-6 h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-6 h-6 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      {/* Avgångar */}
      <div className="space-y-6">
        {[...Array(2)].map((_, sectionIndex) => (
          <div key={sectionIndex}>
            <Skeleton className="h-5 w-24 mb-3" />
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-8 h-6 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-16 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-4 w-18" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div className="card-glass rounded-2xl p-6 h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <span className="mr-2">👩‍💼</span>
          <Skeleton className="h-6 w-28" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Veckor */}
      {[...Array(2)].map((_, weekIndex) => (
        <div key={weekIndex} className="mb-6">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {[...Array(7)].map((_, dayIndex) => (
              <div key={dayIndex} className="bg-slate-800/50 rounded-lg p-2 md:p-3 text-center">
                <Skeleton className="h-3 w-6 mb-1 mx-auto" />
                <Skeleton className="h-4 w-8 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
