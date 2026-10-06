import Link from "next/link";

type Slice = { id: string; label: string; count: number; color: string };

export function ReviewDonut({ slices }: { slices: readonly Slice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0) || 1;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const arcs = slices.reduce<
    { slice: Slice; length: number; offset: number }[]
  >((acc, slice) => {
    const length = (slice.count / total) * circumference;
    const offset = acc.reduce((sum, arc) => sum + arc.length, 0);
    acc.push({ slice, length, offset });
    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 96 96" className="size-40" role="img" aria-label="Credit review status mix">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--indigo-soft)" strokeWidth="12" />
          {arcs.map((arc) => (
            <circle
              key={arc.slice.id}
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke={arc.slice.color}
              strokeWidth="12"
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
              transform="rotate(-90 48 48)"
            />
          ))}
          <text x="48" y="46" textAnchor="middle" className="fill-foreground" fontSize="16" fontWeight="650">
            {slices.reduce((sum, slice) => sum + slice.count, 0)}
          </text>
          <text x="48" y="60" textAnchor="middle" className="fill-muted-foreground" fontSize="8">
            Total
          </text>
        </svg>
      </div>
      <ul className="space-y-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2.5 rounded-full" style={{ background: slice.color }} />
              {slice.label}
            </span>
            <span className="font-medium text-foreground">
              {slice.count}{" "}
              <span className="text-muted-foreground">
                ({Math.round((slice.count / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
      <Link href="/reviews" className="text-sm font-medium text-indigo hover:underline">
        View all credit reviews →
      </Link>
    </div>
  );
}
