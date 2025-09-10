import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface CommentSectionProps {
  promptId: string;
  className?: string;
}

export default function CommentSection({ promptId, className = '' }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/prompts/${promptId}/comments?page=${page}`, {
        credentials: 'include',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      
      if (data.ok) {
        if (page === 1) {
          setComments(data.comments);
        } else {
          setComments(prev => [...prev, ...data.comments]);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Comments fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [promptId, page]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    try {
      const res = await fetch(`/api/prompts/${promptId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await res.json();
      if (data.ok) {
        setContent('');
        setComments(prev => [data.comment, ...prev]);
      }
    } catch (error) {
      console.error('Comment post error:', error);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!user || !editContent.trim()) return;

    try {
      const res = await fetch(`/api/prompts/${promptId}/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          commentId,
          content: editContent.trim()
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setComments(prev => 
          prev.map(c => c.id === commentId ? data.comment : c)
        );
        setEditingId(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('Comment edit error:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user || !confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/prompts/${promptId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error('Comment delete error:', error);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  return (
    <div className={className}>
      {/* 댓글 작성 폼 */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 작성해주세요"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="mt-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium"
          >
            댓글 작성
          </button>
        </form>
      )}

      {/* 댓글 목록 */}
      {loading && page === 1 ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">댓글을 불러오는 중...</p>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm">
              {editingId === comment.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                  />
                  <div className="mt-2 flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleEdit(comment.id)}
                      disabled={!editContent.trim()}
                      className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-orange-600 disabled:opacity-50"
                    >
                      수정 완료
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        {comment.profiles.avatar_url ? (
                          <Image
                            src={comment.profiles.avatar_url}
                            alt={comment.profiles.name}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Image
                              src="/logo.png"
                              alt="프롬팟 로고"
                              width={24}
                              height={24}
                              className="w-full h-full object-contain"
                              unoptimized={true}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">{comment.profiles.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                        {comment.updated_at !== comment.created_at && (
                          <span className="text-xs text-gray-400 ml-2">(수정됨)</span>
                        )}
                      </div>
                    </div>
                    {user?.id === comment.profiles.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(comment)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </>
              )}
            </div>
          ))}
          
          {hasMore && (
            <div className="text-center mt-4">
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-primary hover:text-orange-600 transition-colors"
              >
                더 보기
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {!user && (
            <p className="text-sm">
              댓글을 작성하려면 로그인이 필요합니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
