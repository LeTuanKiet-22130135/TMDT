import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

//Button 

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md";
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const base = "inline-flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "text-white",
    ghost: "hover:bg-white/5",
    danger: "hover:bg-red-500/10",
    outline: "border hover:bg-white/5",
  };

  const inlineStyles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--accent)", color: "white" },
    ghost: { color: "var(--text-secondary)" },
    danger: { color: "var(--danger)" },
    outline: { borderColor: "var(--border)", color: "var(--text-primary)" },
  };

  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      style={inlineStyles[variant]}
      {...props}
    >
      {children}
    </button>
  );
}

//Badge 

interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "default";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const styles: Record<string, React.CSSProperties> = {
    success: { background: "#34d39920", color: "var(--success)" },
    warning: { background: "#fbbf2420", color: "var(--warning)" },
    danger: { background: "#f8717120", color: "var(--danger)" },
    info: { background: "#60a5fa20", color: "var(--info)" },
    default: { background: "var(--surface-raised)", color: "var(--text-secondary)" },
  };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={styles[variant]}
    >
      {children}
    </span>
  );
}

//Input 

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export function Input({ label, error, leftIcon, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
            {leftIcon}
          </span>
        )}
        <input
          className={cn(
            "w-full rounded-lg text-sm outline-none transition-colors",
            "border focus:border-[var(--accent)]",
            leftIcon ? "pl-9 pr-3 py-2" : "px-3 py-2",
            className
          )}
          style={{
            background: "var(--surface-raised)",
            borderColor: error ? "var(--danger)" : "var(--border)",
            color: "var(--text-primary)",
          }}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

//Table

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead style={{ background: "var(--surface-raised)", borderBottom: "1px solid var(--border)" }}>
      {children}
    </thead>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn("px-4 py-3 text-left text-xs font-medium tracking-wide", className)}
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody style={{ background: "var(--surface)" }}>{children}</tbody>;
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn("border-b transition-colors hover:bg-white/[0.02]", className)}
      style={{ borderColor: "var(--border-subtle)" }}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("px-4 py-3", className)} style={{ color: "var(--text-primary)" }}>
      {children}
    </td>
  );
}

//Pagination 

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Trang {page} / {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Trước
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Sau
        </Button>
      </div>
    </div>
  );
}

//Card

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-xl border p-5", className)}
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {children}
    </div>
  );
}

//PageHeader

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

//LoadingSpinner

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
      />
    </div>
  );
}

//EmptyState

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
    </div>
  );
}
