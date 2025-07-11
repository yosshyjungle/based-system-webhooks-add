'use client';

import MessageItem from './MessageItem';

interface Message {
  id: number;
  title: string;
  description: string;
  date: string;
}

interface MessageListProps {
  messages: Message[];
  onEdit: (id: number, title: string, description: string) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}

export default function MessageList({ messages, onEdit, onDelete, isLoading }: MessageListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">メッセージがありません</div>
        <p className="text-gray-400">最初のメッセージを投稿してみましょう！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          id={message.id}
          title={message.title}
          description={message.description}
          date={message.date}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
} 