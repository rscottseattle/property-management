"use client";

import { Suspense } from "react";
import { NewTransactionForm } from "./NewTransactionForm";
import { LoadingSkeleton } from "@/components/ui";

export default function NewTransactionPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-2xl">
          <LoadingSkeleton variant="text" count={2} />
          <LoadingSkeleton variant="card" count={3} />
        </div>
      }
    >
      <NewTransactionForm />
    </Suspense>
  );
}
