import { Skeleton } from "@/components/ui/skeleton";

export default function RejectsLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Skeleton className="h-20 w-2/3" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
