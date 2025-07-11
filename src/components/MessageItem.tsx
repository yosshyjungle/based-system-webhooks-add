'use client';

import { useState } from 'react';

interface MessageItemProps {
  id: number;
  title: string;
  description: string;
  date: string;
  onEdit: (id: number, title: string, description: string) => void;
  onDelete: (id: number) => void;
}

export default function MessageItem({ id, title, description, date, onEdit, onDelete }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);

  const handleSave = () => {
    onEdit(id, editTitle, editDescription);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(title);
    setEditDescription(description);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-3 hover-lift transition-all duration-200 fade-in">
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm md:text-base"
            placeholder="タイトル"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring resize-none text-sm md:text-base"
            rows={3}
            placeholder="メッセージ"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSave}
              className="px-3 md:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              保存
            </button>
            <button
              onClick={handleCancel}
              className="px-3 md:px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="font-semibold text-gray-900 text-base md:text-lg flex-1 min-w-0 break-words">{title}</h3>
            <div className="flex gap-1 md:gap-2 flex-shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 hover:text-blue-700 text-xs md:text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                編集
              </button>
              <button
                onClick={() => onDelete(id)}
                className="text-red-500 hover:text-red-700 text-xs md:text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                削除
              </button>
            </div>
          </div>
          <p className="text-gray-700 mb-3 whitespace-pre-wrap text-sm md:text-base break-words">{description}</p>
          <p className="text-gray-500 text-xs md:text-sm">{formatDate(date)}</p>
        </div>
      )}
    </div>
  );
} 