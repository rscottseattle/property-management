import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TableWrapperProps extends HTMLAttributes<HTMLDivElement> {
  striped?: boolean;
  hoverable?: boolean;
}

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-2xl border border-border/50">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("border-b border-border/50 bg-muted/50", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement> & { striped?: boolean }
>(({ className, striped, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "[&_tr:last-child]:border-0",
      striped && "[&_tr:nth-child(even)]:bg-muted/30",
      className
    )}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement> & { hoverable?: boolean }
>(({ className, hoverable, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border/30 transition-colors duration-200",
      hoverable && "hover:bg-muted/40",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 py-3 align-middle text-foreground", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
