import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithLogging } from '@/lib/api-logger';
import { calculateLevel, getLevelColorClass } from '@/utils/levelSystem';
import { getAvatarUrl } from '@/utils/avatarUtils';

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
  userStats?: {
    prompts: number;
    likes: number;
    bookmarks: number;
    comments: number;
    activityScore: number;
  };
}

interface CommentSectionProps {
  promptId: string;
  className?: string;
  onCommentCountUpdate?: (count: number) => void;
}

export default function CommentSection({ promptId, className = '', onCommentCountUpdate }: CommentSectionProps) {
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
      const res = await fetchWithLogging(`/api/prompts/${promptId}/comments?page=${page}`, {
        credentials: 'include',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      
      if (data.ok) {
        if (page === 1) {
          setComments(data.comments);
          // 댓글 수 업데이트 (첫 페이지 로드 시)
          if (onCommentCountUpdate) {
            onCommentCountUpdate(data.totalCount || data.comments.length);
          }
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
      const res = await fetchWithLogging(`/api/prompts/${promptId}/comments`, {
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
        // 댓글 수 업데이트 (+1)
        if (onCommentCountUpdate) {
          onCommentCountUpdate(comments.length + 1);
        }
      }
    } catch (error) {
      console.error('Comment post error:', error);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!user || !editContent.trim()) return;

    try {
      const res = await fetchWithLogging(`/api/prompts/${promptId}/comments`, {
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
      const res = await fetchWithLogging(`/api/prompts/${promptId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        // 댓글 수 업데이트 (-1)
        if (onCommentCountUpdate) {
          onCommentCountUpdate(comments.length - 1);
        }
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
          <div className="flex gap-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="댓글을 작성해주세요"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={1}
            />
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium self-start"
            >
              댓글 작성
            </button>
          </div>
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
            <div key={comment.id} className="bg-white p-3 rounded-lg shadow-sm">
              {editingId === comment.id ? (
                <div>
                  <div className="flex gap-3 mb-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      rows={1}
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEdit(comment.id)}
                        disabled={!editContent.trim()}
                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
                      >
                        수정 완료
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  {/* 프로필 이미지 */}
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={getAvatarUrl(comment.profiles.avatar_url, comment.profiles.id)}
                      alt={comment.profiles.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized={true}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = getAvatarUrl(null, comment.profiles.id);
                      }}
                    />
                  </div>
                  
                  {/* 댓글 내용 영역 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      {/* 레벨 */}
                      {comment.userStats && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${getLevelColorClass(calculateLevel(comment.userStats.activityScore).level)}`}>
                          Lv.{calculateLevel(comment.userStats.activityScore).level}
                        </span>
                      )}
                      {/* 이름 */}
                      <span className="font-medium text-sm">{comment.profiles.name}</span>
                      {/* 날짜 */}
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                      {comment.updated_at !== comment.created_at && (
                        <span className="text-xs text-gray-400">(수정됨)</span>
                      )}
                      
                      {/* 수정/삭제 버튼 */}
                      {user?.id === comment.profiles.id && (
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={() => startEdit(comment)}
                            className="text-xs text-gray-600 hover:text-gray-900"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                    {/* 댓글 내용 */}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
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
