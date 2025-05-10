export default function Input({ label, error, ...props }) {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>}
        <input
          className="rounded-lg border border-gray-300 bg-white p-2 shadow-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-500 dark:focus:ring-blue-500"
          {...props}
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }