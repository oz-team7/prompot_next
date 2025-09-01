import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RatingSystemProps {
  promptId: string;
  className?: string;
}

export default function RatingSystem({ promptId, className = '' }: RatingSystemProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRating();
  }, [promptId]);

  const fetchRating = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/prompts/${promptId}/ratings`, {
        credentials: 'include',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      
      if (data.ok) {
        setRating(data.userRating);
        setAverage(data.average);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Rating fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (value: number) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/prompts/${promptId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify({ rating: value }),
      });

      if (res.ok) {
        fetchRating();
      }
    } catch (error) {
      console.error('Rating update error:', error);
    }
  };

  if (loading) {
    return <div className={className}>로딩중...</div>;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              disabled={!user}
              className="p-1"
            >
              <svg
                className={`w-6 h-6 ${
                  (hoveredRating !== null ? star <= hoveredRating : star <= (rating || 0))
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                } ${user ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-600">
          평균 {average.toFixed(1)} ({total}개의 평가)
        </div>
      </div>
      {!user && (
        <p className="text-sm text-gray-500 mt-1">
          별점을 남기려면 로그인이 필요합니다.
        </p>
      )}
    </div>
  );
}
