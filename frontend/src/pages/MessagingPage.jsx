import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import ChatList from '../components/ChatList';
import Chat from '../components/Chat';
import Card from '../components/Card';
import { ArrowLeft } from 'lucide-react';

export default function MessagingPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);

  // Compute display name from selected
  const getDisplayName = () => {
    if (!selected) return '';
    const name = `${selected.first_name} ${selected.last_name}`;
    return user.role === 'patient' ? `Dr. ${name}` : name;
  };

  return (
    <SocketProvider>
      <div className="flex flex-col h-screen p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <div className="flex flex-1 bg-white dark:bg-dark-card rounded-lg overflow-hidden shadow">
          
          {/* Conversations List */}
          <div
            className={`flex flex-col border-r border-gray-200 dark:border-gray-700
              ${selected ? 'hidden' : 'flex'} w-full md:w-1/3`}
          >
            <ChatList onSelectChat={setSelected} />
          </div>
          
          {/* Chat Panel */}
          <div
            className={`flex flex-col
              ${selected ? 'flex' : 'hidden'} w-full`}
          >
            <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                className="mr-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setSelected(null)}
                aria-label="Back to conversations"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
              <h2 className="text-lg font-semibold">
                {selected ? getDisplayName() : 'Select a conversation'}
              </h2>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {selected ? (
                <Chat
                  receiverId={selected.id}
                  receiverName={getDisplayName()}
                />
              ) : (
                <Card className="flex items-center justify-center h-full">
                  <p className="text-gray-500">
                    Select a conversation or contact to start chatting
                  </p>
                </Card>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </SocketProvider>
  );
}
