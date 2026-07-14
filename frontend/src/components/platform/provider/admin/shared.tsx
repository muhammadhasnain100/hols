"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

type PaginationControlsProps = {
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
  total: number;
  loading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({
  page,
  hasNext,
  hasPrevious,
  total,
  loading,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">{total} total records · Page {page}</p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" disabled={!hasPrevious || loading} onClick={onPrevious}>
          Previous
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!hasNext || loading} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function UserLink({ userId, label }: { userId: string; label: string }) {
  return (
    <Link
      href={`/admin/users/${userId}`}
      className="font-medium text-primary underline-offset-2 hover:underline"
    >
      {label}
    </Link>
  );
}
