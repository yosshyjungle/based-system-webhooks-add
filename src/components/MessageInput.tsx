'use client';

import { useState } from 'react';

interface MessageInputProps {
  onSubmit: (title: string, description: string) => void;
  isLoading?: boolean;
}

export default function MessageInput({ onSubmit, isLoading }: MessageInputProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      onSubmit(title, description);
      setTitle('');
      setDescription('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入力してください"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-md focus-ring text-sm md:text-base"
            disabled={isLoading}
          />
        </div>
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="メッセージを入力してください"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-md focus-ring resize-none text-sm md:text-base"
            rows={3}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!title.trim() || !description.trim() || isLoading}
            className="px-4 md:px-6 py-2 md:py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm md:text-base"
          >
            {isLoading ? '送信中...' : '📝 送信'}
          </button>
        </div>
      </form>
    </div>
  );
} 