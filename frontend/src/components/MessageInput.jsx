import { useRef } from "react";

export default function MessageInput({ value, onChange, onSend }) {
  const textareaRef = useRef();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
  };

  return (
    <div className="flex items-end border-t border-gray-200 p-3 bg-white">
      <textarea
        ref={textareaRef}
        className="flex-1 resize-none border rounded p-2 mr-2 min-h-[40px] max-h-32 text-sm focus:outline-none focus:ring"
        rows={1}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={onSend}
        disabled={!value.trim()}
      >
        Send Message
      </button>
    </div>
  );
} 