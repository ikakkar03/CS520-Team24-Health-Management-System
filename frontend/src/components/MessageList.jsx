export default function MessageList({ conversations, selectedId, onSelect }) {
  return (
    <div className="w-56 min-w-[180px] border-r border-gray-200 bg-gray-50 flex flex-col">
      <div className="font-bold p-4 border-b border-gray-200">Messages</div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map(conv => (
          <div
            key={conv.id}
            className={`px-4 py-3 cursor-pointer border-b border-gray-100 text-sm transition-all
              ${conv.id === selectedId ? 'bg-white font-semibold' : 'hover:bg-gray-100'}`}
            onClick={() => onSelect(conv.id)}
          >
            <div className="flex justify-between items-center">
              <span>{conv.name}</span>
              <span className="text-xs text-gray-400">{conv.lastTime}</span>
            </div>
            <div className="text-gray-500 truncate">{conv.lastMessage}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 