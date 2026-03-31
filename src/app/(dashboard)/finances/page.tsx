"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, DollarSign, ArrowRight } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  EmptyState,
  LoadingSkeleton,
} from "@/components/ui";
import { FinancialSummaryCards } from "@/components/finances/FinancialSummaryCards";
import {
  TransactionRow,
  type TransactionData,
} from "@/components/finances/TransactionRow";

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  pendingCount: number;
}

export default function FinancesPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(
          `/api/reports/financial-summary?startDate=${currentYear}-01-01&endDate=${currentYear}-12-31`
        );
        if (!res.ok) throw new Error("Failed to load financial summary");
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoadingSummary(false);
      }
    }

    async function fetchTransactions() {
      try {
        const res = await fetch("/api/transactions?limit=20");
        if (!res.ok) throw new Error("Failed to load transactions");
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : data.transactions ?? []);
      } catch {
        // summary error is enough to show
      } finally {
        setLoadingTransactions(false);
      }
    }

    fetchSummary();
    fetchTransactions();
  }, [currentYear]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Finances</h1>
          <p className="mt-1 text-sm text-gray-500">
            {currentYear} financial overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            href="/finances/new?type=INCOME"
            leftIcon={<Plus className="h-4 w-4" />}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Record Payment
          </Button>
          <Button
            href="/finances/new?type=EXPENSE"
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {loadingSummary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" count={1} />
          ))}
        </div>
      )}

      {!loadingSummary && error && (
        <Card padding="lg">
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        </Card>
      )}

      {!loadingSummary && !error && summary && (
        <FinancialSummaryCards
          totalIncome={summary.totalIncome}
          totalExpenses={summary.totalExpenses}
          netIncome={summary.netIncome}
          pendingCount={summary.pendingCount}
        />
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link
              href="/finances/transactions"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {loadingTransactions && (
            <div className="px-6 py-4">
              <LoadingSkeleton variant="text" count={5} />
            </div>
          )}

          {!loadingTransactions && transactions.length === 0 && (
            <div className="px-6 py-8">
              <EmptyState
                icon={DollarSign}
                title="No transactions yet"
                description="Record your first payment or expense to start tracking finances."
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

          {!loadingTransactions && transactions.length > 0 && (
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
