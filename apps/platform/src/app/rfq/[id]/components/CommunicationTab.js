/**
 * Component: Communication Tab
 * Purpose: Enable messaging between client and bidders
 * Features: Broadcast messages, individual messaging, real-time updates
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@sanctuari/database/lib/client';
import { Card, Button } from '@sanctuari/ui';
import './communication.css';

export default function CommunicationTab({ rfqId, rfqData, invitations }) {
  const router = useRouter();
  const supabase = createClient();

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState('all'); // 'all' or specific invitation ID
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `rfq_id=eq.${rfqId}`
        },
        (payload) => {
          console.log('Message update:', payload);
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rfqId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert('Please enter a message');
      return;
    }

    setSending(true);

    try {
      const response = await fetch(`/api/rfq/${rfqId}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: messageText.trim(),
          recipientType: recipient,
          invitationId: recipient !== 'all' ? recipient : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessageText('');
      await loadMessages();

      alert(`Message sent successfully to ${recipient === 'all' ? 'all bidders' : 'bidder'}!`);

    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const grouped = {};

    messages.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(msg);
    });

    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (loading) {
    return (
      <div className="communication-tab">
        <Card>
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="communication-tab">
      {/* Message Composer */}
      <Card className="message-composer">
        <h3>Send Message</h3>

        <div className="composer-form">
          <div className="recipient-selector">
            <label>To:</label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="recipient-select"
            >
              <option value="all">All Bidders (Broadcast)</option>
              {invitations && invitations.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.external_email}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            rows={4}
            className="message-textarea"
          />

          <div className="composer-actions">
            <div className="composer-hint">
              {recipient === 'all'
                ? `This message will be sent to all ${invitations?.length || 0} bidders`
                : 'This message will be sent to the selected bidder'}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={sending || !messageText.trim()}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Message History */}
      <Card className="message-history">
        <div className="history-header">
          <h3>Message History</h3>
          <span className="message-count">{messages.length} {messages.length === 1 ? 'message' : 'messages'}</span>
        </div>

        {messages.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h4>No messages yet</h4>
            <p>Send your first message to start communicating with bidders</p>
          </div>
        ) : (
          <div className="messages-container">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date} className="message-date-group">
                <div className="date-separator">
                  <span>{date}</span>
                </div>

                {dateMessages.map(msg => (
                  <div key={msg.id} className={`message-item ${msg.sender_type}`}>
                    <div className="message-header">
                      <div className="sender-info">
                        <strong>{msg.sender_name || msg.sender_email}</strong>
                        {msg.sender_type === 'client' && (
                          <span className="sender-badge">You</span>
                        )}
                        {msg.sender_type === 'bidder' && (
                          <span className="sender-badge bidder">Bidder</span>
                        )}
                      </div>
                      <span className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="message-body">{msg.message_text}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
