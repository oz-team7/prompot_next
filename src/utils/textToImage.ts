// 텍스트를 이미지로 변환하는 유틸리티 함수

export const createTextImage = async (text: string, maxLines: number = 10): Promise<string> => {
  // Canvas 생성
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // 캔버스 설정
  const width = 800;
  const paddingHorizontal = 60;
  const paddingTop = 50;
  const paddingBottom = 50;
  const lineHeight = 28;
  const fontSize = 18;
  
  // 폰트 설정
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
  
  // 텍스트를 줄 단위로 분할하는 함수
  const splitTextIntoLines = (text: string, maxWidth: number): string[] => {
    const lines: string[] = [];
    
    // 모든 줄바꿈 문자를 \n으로 정규화
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 줄바꿈으로 분할
    const paragraphs = normalizedText.split('\n');
    
    for (const paragraph of paragraphs) {
      if (lines.length >= maxLines) break;
      
      // 빈 문단인 경우 빈 줄 추가
      if (paragraph.trim() === '') {
        lines.push('');
        continue;
      }
      
      // 문단을 단어 단위로 분할
      const words = paragraph.split(/\s+/).filter(word => word.length > 0);
      let currentLine = '';
      
      for (const word of words) {
        if (lines.length >= maxLines) break;
        
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // 단어가 너무 길면 강제로 자르기
            let truncatedWord = word;
            while (ctx.measureText(truncatedWord).width > maxWidth && truncatedWord.length > 1) {
              truncatedWord = truncatedWord.slice(0, -1);
            }
            lines.push(truncatedWord);
            currentLine = '';
          }
        } else {
          currentLine = testLine;
        }
      }
      
      // 현재 줄이 남아있으면 추가
      if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
      }
    }
    
    return lines;
  };
  
  // 텍스트를 줄 단위로 분할
  const maxTextWidth = width - (paddingHorizontal * 2);
  const lines = splitTextIntoLines(text, maxTextWidth);
  
  // 최대 줄 수 제한 적용
  if (lines.length > maxLines) {
    lines.splice(maxLines);
    if (lines.length > 0) {
      lines[lines.length - 1] = lines[lines.length - 1] + '...';
    }
  }
  
  // 캔버스 크기 설정
  const height = (lines.length * lineHeight) + paddingTop + paddingBottom + 20;
  canvas.width = width;
  canvas.height = height;
  
  // 배경 그리기 (부드러운 그라데이션)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#FFF7ED'); // orange-50
  gradient.addColorStop(1, '#FFEDD5'); // orange-100
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 테두리 추가
  ctx.strokeStyle = '#FED7AA'; // orange-200
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  
  // Prompot 로고 워터마크 (우측 상단)
  ctx.fillStyle = '#FB923C'; // orange-400
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Prompot', width - paddingHorizontal, paddingTop - 15);
  
  // 텍스트 그리기
  ctx.fillStyle = '#1F2937'; // gray-800
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'left';
  
  lines.forEach((line, index) => {
    const y = paddingTop + 30 + (index * lineHeight);
    ctx.fillText(line, paddingHorizontal, y);
  });
  
  // 하단에 페이드 효과 (텍스트가 잘렸음을 시각적으로 표시)
  if (lines[lines.length - 1]?.endsWith('...')) {
    const fadeGradient = ctx.createLinearGradient(0, height - 40, 0, height);
    fadeGradient.addColorStop(0, 'rgba(255, 237, 213, 0)');
    fadeGradient.addColorStop(1, 'rgba(255, 237, 213, 0.8)');
    ctx.fillStyle = fadeGradient;
    ctx.fillRect(0, height - 40, width, 40);
  }
  
  // Canvas를 이미지로 변환
  return canvas.toDataURL('image/png');
};

// 텍스트 미리보기 생성 (짧은 버전)
export const createTextPreview = (text: string, maxLength: number = 200): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};