"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, DollarSign, Filter } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Select,
  Input,
  EmptyState,
  LoadingSkeleton,
} from "@/components/ui";
import {
  TransactionRow,
  type TransactionData,
} from "@/components/finances/TransactionRow";
import {
  INCOME_CATEGORIES,
  SCHEDULE_E_CATEGORIES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PropertyOption {
  id: string;
  name: string;
}

type TypeFilter = "ALL" | "INCOME" | "EXPENSE";
type StatusFilter = "ALL" | "COMPLETED" | "PENDING";

const TYPE_PILLS: { value: TypeFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
];

export default function TransactionsPage() {
  const router = useRouter();

  // Data
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const categoryOptions =
    typeFilter === "INCOME"
      ? INCOME_CATEGORIES
      : typeFilter === "EXPENSE"
        ? SCHEDULE_E_CATEGORIES
        : [...INCOME_CATEGORIES, ...SCHEDULE_E_CATEGORIES];

  // Fetch properties for filter
  useEffect(() => {
    fetch("/api/properties")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProperties(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Build query string
  const buildQuery = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams();
      params.set("limit", "25");
      params.set("page", String(pageNum));
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (propertyFilter) params.set("propertyId", propertyFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      return params.toString();
    },
    [typeFilter, propertyFilter, categoryFilter, statusFilter, startDate, endDate]
  );

  // Fetch transactions
  const fetchTransactions = useCallback(
    async (pageNum: number, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await fetch(`/api/transactions?${buildQuery(pageNum)}`);
        if (!res.ok) throw new Error("Failed to load transactions");
        const data = await res.json();
        const items: TransactionData[] = Array.isArray(data)
          ? data
          : data.transactions ?? [];
        const more = Array.isArray(data) ? false : data.hasMore ?? false;

        if (append) {
          setTransactions((prev) => [...prev, ...items]);
        } else {
          setTransactions(items);
        }
        setHasMore(more);
      } catch {
        // silent
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQuery]
  );

  // Re-fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchTransactions(1);
  }, [fetchTransactions]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage, true);
  }

  // Reset category when type changes
  useEffect(() => {
    setCategoryFilter("");
  }, [typeFilter]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and filter all financial transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            href="/finances/new?type=INCOME"
            leftIcon={<Plus className="h-4 w-4" />}
            className="bg-[#5c7c65] hover:bg-[#4a6b53] text-white"
          >
            Record Payment
          </Button>
          <Button
            href="/finances/new?type=EXPENSE"
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            className="border-[#d4856a] text-[#d4856a] hover:bg-[#fef7f5]"
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent>
          <div className="space-y-4">
            {/* Type pills */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {TYPE_PILLS.map((pill) => (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => setTypeFilter(pill.value)}
                    className={cn(
                      "px-4 py-1.5 text-sm font-medium transition-colors",
                      typeFilter === pill.value
                        ? "bg-[#5c7c65] text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50",
                      "border-r border-gray-200 last:border-r-0"
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdowns and date range */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Select
                label="Property"
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                options={[
                  { value: "", label: "All Properties" },
                  ...properties.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
              <Select
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: "", label: "All Categories" },
                  ...categoryOptions.map((c) => ({
                    value: c.value,
                    label: c.label,
                  })),
                ]}
              />
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                options={STATUS_OPTIONS}
              />
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction list */}
      <Card>
        {loading && (
          <div className="px-6 py-4">
            <LoadingSkeleton variant="text" count={8} />
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="px-6 py-8">
            <EmptyState
              icon={DollarSign}
              title="No transactions found"
              description="Try adjusting your filters or add a new transaction."
              action={
                <Button
                  href="/finances/new?type=INCOME"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Record Payment
                </Button>
              }
            />
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/50">
                  <tr>
                    <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Date
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Type
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Category
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Description
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Property
                    </th>
                    <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="h-10 px-4 text-center font-medium text-gray-500 text-xs uppercase tracking-wider w-10">
                      {/* Receipt */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <TransactionRow
                      key={txn.id}
                      transaction={txn}
                      onClick={() =>
                        router.push(`/finances/new?edit=${txn.id}`)
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {transactions.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  transaction={txn}
                  compact
                  onClick={() =>
                    router.push(`/finances/new?edit=${txn.id}`)
                  }
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center py-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  loading={loadingMore}
                  loadingText="Loading..."
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
