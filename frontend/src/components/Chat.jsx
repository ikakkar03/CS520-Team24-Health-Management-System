import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_URL } from '../constants';
import Card from './Card';
import Button from './Button';
import Input from './Input';


export default function Chat({ receiverId, receiverName }) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const typingTimeout = useRef(null);
  const endRef = useRef(null);

  // Fetch message history
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/messages/conversation/${user.id}/${receiverId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setMessages(await res.json());
      } catch (err) {
        console.error(err);
      }
    })();
  }, [receiverId, user.id]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const onNew = m => {
      if (
        (m.sender_id === user.id && m.receiver_id === receiverId) ||
        (m.sender_id === receiverId && m.receiver_id === user.id)
      ) {
        setMessages(prev => [...prev, m]);
      }
    };
    socket.on('new_message', onNew);
    return () => void socket.off('new_message', onNew);
  }, [socket, receiverId, user.id]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const emitTyping = () => {
    if (!socket) return;
    socket.emit('typing', { receiverId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { receiverId, isTyping: false });
    }, 1000);
  };

  // Send message
  const send = e => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    socket.emit('send_message', {
      receiverId,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  return (
    <Card className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center p-4 bg-white dark:bg-dark-card border-b">
        <h2 className="text-lg font-semibold">{receiverName}</h2>
        {!isConnected && (
          <span className="ml-auto text-sm text-red-500">Reconnecting…</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_id === user.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.sender_id === user.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 dark:text-gray-100'
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-xs mt-1 opacity-70 text-right">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 z-10 p-4 bg-white dark:bg-dark-card border-t">
        <form onSubmit={send} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={e => {
              setNewMessage(e.target.value);
              emitTyping();
            }}
            placeholder="Type a message…"
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim() || !socket}>
            Send
          </Button>
        </form>
      </div>
    </Card>
  );
}
