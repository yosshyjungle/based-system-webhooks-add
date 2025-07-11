'use client';

import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import MessageInput from './MessageInput';
import MessageList from './MessageList';

interface Message {
  id: number;
  title: string;
  description: string;
  date: string;
}

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();

  // メッセージを取得
  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/blog');
      const data = await response.json();
      if (data.message === 'Success') {
        setMessages(data.posts);
      }
    } catch (error) {
      console.error('メッセージの取得に失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 新しいメッセージを投稿
  const handleSubmit = async (title: string, description: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });
      const data = await response.json();
      if (data.message === 'Success') {
        setMessages([...messages, data.post]);
      }
    } catch (error) {
      console.error('メッセージの投稿に失敗しました:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // メッセージを編集
  const handleEdit = async (id: number, title: string, description: string) => {
    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });
      const data = await response.json();
      if (data.message === 'Success') {
        setMessages(messages.map(msg => 
          msg.id === id ? { ...msg, title, description } : msg
        ));
      }
    } catch (error) {
      console.error('メッセージの編集に失敗しました:', error);
    }
  };

  // メッセージを削除
  const handleDelete = async (id: number) => {
    if (window.confirm('このメッセージを削除しますか？')) {
      try {
        const response = await fetch(`/api/blog/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.message === 'Success') {
          setMessages(messages.filter(msg => msg.id !== id));
        }
      } catch (error) {
        console.error('メッセージの削除に失敗しました:', error);
      }
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 chat-container">
      <SignedOut>
        <div className="text-center py-12 fade-in">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ログインが必要です
          </h2>
          <p className="text-gray-600 mb-6">
            チャットに参加するには、まずログインしてください。
          </p>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="mb-6 fade-in">
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm md:text-base">
              {user?.firstName || user?.username || 'ユーザー'}さん、メッセージを投稿して、みんなと交流しましょう！
            </p>
          </div>
        </div>

        <div className="fade-in">
          <MessageInput onSubmit={handleSubmit} isLoading={isSubmitting} />
        </div>
        
        <div className="fade-in">
          <MessageList
            messages={messages}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </div>
      </SignedIn>
    </div>
  );
} 