import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ThumbnailEditorProps {
  imageUrl: string;
  onSave: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

const ThumbnailEditor: React.FC<ThumbnailEditorProps> = ({ imageUrl, onSave, onCancel }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 이미지 URL이 외부 URL인지 확인
  const getProxiedImageUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // 외부 URL인 경우 프록시를 통해 로드
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // 이미지 로드 시 초기 스케일 설정
  useEffect(() => {
    const img = new window.Image();
    const proxiedUrl = getProxiedImageUrl(imageUrl);
    
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      
      if (containerRef.current) {
        const containerWidth = 400; // 고정 크기
        const containerHeight = 300; // 4:3 비율
        const imgAspect = img.width / img.height;
        const containerAspect = containerWidth / containerHeight;
        
        // 이미지가 컨테이너를 채우도록 초기 스케일 설정
        let initialScale = 1;
        if (imgAspect > containerAspect) {
          // 이미지가 더 넓음 - 높이 기준으로 맞춤
          initialScale = containerHeight / img.height;
        } else {
          // 이미지가 더 높음 - 너비 기준으로 맞춤
          initialScale = containerWidth / img.width;
        }
        setScale(initialScale);
      }
    };
    img.src = proxiedUrl;
  }, [imageUrl]);

  // 전역 마우스 이벤트를 위한 useEffect
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      setPosition({ x: newX, y: newY });
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(0.1, scale * delta), 5);
    setScale(newScale);
  };

  const handleSave = async () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 캔버스 크기 설정 (4:3 비율)
    canvas.width = 400;
    canvas.height = 300;
    
    // 이미지 로드 및 그리기
    const img = new window.Image();
    const proxiedUrl = getProxiedImageUrl(imageUrl);
    
    img.onload = () => {
      // 배경을 흰색으로 채우기
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 이미지 그리기
      const imgWidth = img.width * scale;
      const imgHeight = img.height * scale;
      
      ctx.drawImage(
        img,
        position.x,
        position.y,
        imgWidth,
        imgHeight
      );
      
      // 캔버스를 blob으로 변환
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onSave(base64data);
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.9);
    };
    
    // 에러 처리
    img.onerror = () => {
      console.error('Image loading failed.');
      alert('이미지를 로드할 수 없습니다. 다시 시도해주세요.');
    };
    
    img.src = proxiedUrl;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">썸네일 편집</h3>
          
          {/* 편집 영역 */}
          <div className="mb-4">
            <div 
              ref={containerRef}
              className="relative w-full mx-auto bg-gray-100 rounded-lg overflow-hidden"
              style={{ height: '300px', maxWidth: '400px', cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
            >
              {/* 편집 가이드라인 */}
              <div className="absolute inset-0 border-2 border-dashed border-gray-400 pointer-events-none z-10" />
              
              {/* 이미지 */}
              <img
                ref={imageRef}
                src={getProxiedImageUrl(imageUrl)}
                alt="Thumbnail"
                className="absolute"
                draggable={false}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: '0 0',
                  maxWidth: 'none',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
              />
            </div>
          </div>
          
          {/* 컨트롤 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">확대/축소</label>
              <span className="text-sm text-gray-500">{Math.round(scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              value={scale * 100}
              onChange={(e) => setScale(parseInt(e.target.value) / 100)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              • 마우스 드래그로 이미지 위치 조정<br/>
              • 마우스 휠로 확대/축소 조정
            </p>
          </div>
          
          {/* 버튼 */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
        
        {/* 숨겨진 캔버스 (이미지 처리용) */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ThumbnailEditor;