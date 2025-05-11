export default function ChatWindow({ messages }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 bg-white flex flex-col">
      <div className="flex-1" />
      {messages.map((msg, idx) => (
        <div key={msg.id} className={`flex flex-col items-${msg.sender === 'me' ? 'end' : 'start'} mb-2`}>
          <div
            className={`px-3 py-2 rounded-lg max-w-xs md:max-w-md text-sm
              ${msg.sender === 'me' ? 'bg-blue-100 text-blue-900 self-end' : 'bg-gray-100 text-gray-900 self-start'}`}
          >
            {msg.text}
          </div>
          <span className="text-xs text-gray-400 mt-1 pr-1">{msg.time}</span>
        </div>
      ))}
    </div>
  );
} 