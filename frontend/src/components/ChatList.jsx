import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants';
import Card from './Card';


export default function ChatList({ onSelectChat }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);

  // Fetch existing conversations
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/messages/conversations/${user.id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (!res.ok) throw new Error('Failed to fetch conversations');
        setConversations(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConvos(false);
      }
    })();
  }, [user.id]);

  // Fetch contacts for dropdown
  useEffect(() => {
    (async () => {
      try {
        const endpoint =
          user.role === 'doctor'
            ? `${API_URL}/api/patients`
            : `${API_URL}/api/doctors`;
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error('Failed to fetch contacts');
        setContacts(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingContacts(false);
      }
    })();
  }, [user.role]);

  if (loadingConvos || loadingContacts) {
    return (
      <Card className="p-4 flex-1 flex items-center justify-center">
        <p>Loading…</p>
      </Card>
    );
  }

  const selectChat = (id, first_name, last_name) =>
    onSelectChat({ id, first_name, last_name });

  return (
    <Card className="flex flex-col flex-1 w-full h-full">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white dark:bg-dark-card p-4 border-b z-10">
        <h2 className="text-lg font-semibold mb-2">Start New Conversation</h2>
        <select
          defaultValue=""
          onChange={e => {
            const id = parseInt(e.target.value, 10);
            if (!id) return;
            const c = contacts.find(x => x.id === id);
            if (c) selectChat(c.id, c.first_name, c.last_name);
            e.target.value = '';
          }}
          className="w-full p-2 border rounded"
        >
          <option value="" disabled>
            {`Select a ${user.role === 'doctor' ? 'patient' : 'doctor'}…`}
          </option>
          {contacts.map(c => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-gray-500">No conversations yet.</div>
        ) : (
          conversations.map(conv => {
            const name = `${conv.first_name} ${conv.last_name}`;
            return (
              <button
                key={conv.other_user_id}
                onClick={() =>
                  selectChat(conv.other_user_id, conv.first_name, conv.last_name)
                }
                className="w-full p-4 border-b hover:bg-gray-50 text-left flex justify-between items-center"
              >
                <span className="font-medium">{name}</span>
                <span className="text-xs text-gray-400">
                  {new Date(conv.last_message_time).toLocaleDateString()}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}
