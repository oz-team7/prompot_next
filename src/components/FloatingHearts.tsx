import React, { useState, useEffect } from 'react';

interface FloatingHeart {
  id: number;
  x: number;
  delay: number;
}

interface FloatingHeartsProps {
  trigger: boolean;
}

const FloatingHearts: React.FC<FloatingHeartsProps> = ({ trigger }) => {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [heartIdCounter, setHeartIdCounter] = useState(0);

  useEffect(() => {
    if (trigger) {
      // 3-5개의 하트를 생성
      const heartCount = Math.floor(Math.random() * 3) + 3;
      const newHearts: FloatingHeart[] = [];
      
      for (let i = 0; i < heartCount; i++) {
        newHearts.push({
          id: heartIdCounter + i,
          x: Math.random() * 40 - 20, // -20px ~ 20px 사이의 랜덤 위치
          delay: Math.random() * 0.3, // 0 ~ 0.3초 사이의 딜레이
        });
      }
      
      setHeartIdCounter(heartIdCounter + heartCount);
      setHearts([...hearts, ...newHearts]);
      
      // 2초 후 하트 제거
      setTimeout(() => {
        setHearts(prevHearts => 
          prevHearts.filter(heart => !newHearts.some(newHeart => newHeart.id === heart.id))
        );
      }, 2000);
    }
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute left-1/2 bottom-0 animate-float-up"
          style={{
            transform: `translateX(${heart.x}px)`,
            animationDelay: `${heart.delay}s`,
          }}
        >
          <svg
            className="w-4 h-4 text-red-400 opacity-80"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          15% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-150px) scale(0.8) rotate(15deg);
          }
        }
        
        .animate-float-up {
          animation: floatUp 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FloatingHearts;