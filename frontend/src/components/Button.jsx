import { cn } from "../utils/cn";
export default function Button({ className, children, ...props }) {
  return (
    <button
      className={cn(
        "rounded-2xl px-6 py-2 text-sm font-semibold shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}