import { cn } from "../utils/cn";

export default function Card({ children, className }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800",
        className
      )}
    >
      {children}
    </div>
  );
}