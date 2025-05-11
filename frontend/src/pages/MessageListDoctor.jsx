import { useState } from "react";
import MessageList from "../components/Messages";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";

const initialConversations = [
  {
    id: 1,
    name: "John Smith",
    lastMessage: "Thank You, Doctor",
    lastTime: "10:20 AM",
    messages: [
      {
        id: 1,
        sender: "patient",
        text: "Hello, I need a refill on my prescription",
        time: "10:15 AM"
      },
      {
        id: 2,
        sender: "me",
        text: "I've sent the prescription to your pharmacy.",
        time: "10:17 AM"
      },
      {
        id: 3,
        sender: "patient",
        text: "Thank You, Doctor",
        time: "10:20 AM"
      }
    ]
  }
];

export default function MessageListDoctor() {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(conversations[0].id);
  const [input, setInput] = useState("");

  const selectedConversation = conversations.find(c => c.id === selectedId);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setConversations(convs => convs.map(c =>
      c.id === selectedId
        ? {
            ...c,
            messages: [...c.messages, newMessage],
            lastMessage: newMessage.text,
            lastTime: newMessage.time
          }
        : c
    ));
    setInput("");
  };

  return (
    <div className="flex h-[80vh] md:h-[70vh] bg-white rounded shadow overflow-hidden border border-gray-200">
      {/* Left: Conversation List */}
      <MessageList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      {/* Right: Chat Window */}
      <div className="flex flex-col flex-1">
        <ChatWindow messages={selectedConversation.messages} />
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
