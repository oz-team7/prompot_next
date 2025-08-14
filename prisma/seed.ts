import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 테스트 사용자 생성
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@prompot.com' },
    update: {},
    create: {
      email: 'test@prompot.com',
      name: 'Prompot Admin',
      password: hashedPassword,
    },
  });

  console.log(`Created test user: ${testUser.email}`);

  // 예시 프롬프트 데이터
  const samplePrompts = [
    {
      title: '효과적인 이메일 작성하기',
      description: '비즈니스 이메일을 전문적이고 명확하게 작성하는 프롬프트',
      content: `다음 정보를 바탕으로 전문적인 비즈니스 이메일을 작성해주세요:

목적: [이메일의 목적]
수신자: [수신자의 직책/관계]
주요 내용: [전달하고자 하는 핵심 내용]
어조: [공식적/반공식적/친근한]

이메일 구조:
1. 적절한 인사말
2. 목적을 명확히 하는 도입부
3. 핵심 내용 전달
4. 다음 단계나 행동 요청
5. 전문적인 마무리`,
      category: 'work',
      tags: ['이메일', '비즈니스', '커뮤니케이션'],
      aiModel: 'chatgpt',
      isPublic: true,
    },
    {
      title: '코드 리뷰 도우미',
      description: '깔끔하고 효율적인 코드 작성을 위한 리뷰 프롬프트',
      content: `다음 코드를 검토하고 개선 사항을 제안해주세요:

\`\`\`[언어]
[코드 붙여넣기]
\`\`\`

다음 관점에서 분석해주세요:
1. 코드 가독성과 명명 규칙
2. 성능 최적화 가능성
3. 잠재적 버그나 에러 처리
4. 보안 취약점
5. 테스트 가능성
6. 리팩토링 제안

각 항목에 대해 구체적인 개선 방안과 예시 코드를 제공해주세요.`,
      category: 'dev',
      tags: ['코드리뷰', '개발', '최적화', '리팩토링'],
      aiModel: 'claude',
      isPublic: true,
    },
    {
      title: '브랜드 네이밍 생성기',
      description: '창의적이고 기억에 남는 브랜드명을 만드는 프롬프트',
      content: `새로운 브랜드명을 만들어주세요.

업종: [업종/산업]
타겟 고객: [연령대, 성별, 특성]
브랜드 가치: [핵심 가치 3가지]
선호 스타일: [모던/클래식/미니멀/럭셔리 등]

다음 조건을 고려해주세요:
- 발음하기 쉽고 기억하기 쉬울 것
- 도메인 등록이 가능할 것 같은 이름
- 글로벌 시장에서도 사용 가능
- 부정적인 의미가 없을 것

각 제안에 대해:
1. 브랜드명 (한글/영문)
2. 의미와 유래
3. 왜 이 이름이 적합한지 설명`,
      category: 'design',
      tags: ['브랜딩', '네이밍', '마케팅', '창의성'],
      aiModel: 'gemini',
      isPublic: true,
    },
    {
      title: '학습 계획 수립 도우미',
      description: '효과적인 학습 로드맵과 계획을 만드는 프롬프트',
      content: `[주제]를 배우기 위한 체계적인 학습 계획을 만들어주세요.

현재 수준: [초급/중급/고급]
학습 목표: [구체적인 목표]
가능한 학습 시간: [일일/주간 학습 가능 시간]
학습 기간: [목표 기간]

다음을 포함해주세요:
1. 단계별 학습 로드맵
2. 각 단계별 핵심 학습 내용
3. 추천 학습 자료 (책, 온라인 강의, 유튜브 등)
4. 실습 프로젝트 아이디어
5. 진도 체크 방법
6. 어려움을 겪을 때 대처 방법`,
      category: 'edu',
      tags: ['학습', '교육', '계획', '자기계발'],
      aiModel: 'claude',
      isPublic: true,
    },
    {
      title: '상품 설명 이미지 생성',
      description: '매력적인 상품 이미지를 만들기 위한 프롬프트',
      content: `다음 상품을 위한 매력적인 이미지를 생성해주세요:

상품명: [상품명]
카테고리: [패션/전자제품/식품/화장품 등]
주요 특징: [상품의 핵심 특징 3가지]
타겟 고객: [연령대, 성별, 라이프스타일]

이미지 스타일:
- 배경: [단색/그라데이션/라이프스타일/스튜디오]
- 조명: [자연광/스튜디오 조명/무드 조명]
- 구도: [정면/측면/45도/디테일 샷]
- 분위기: [미니멀/럭셔리/친근한/전문적인]

추가 요소:
- 텍스트 오버레이 필요 여부
- 브랜드 로고 위치
- 보조 소품 사용 여부`,
      category: 'image',
      tags: ['이미지생성', '상품촬영', '마케팅', '비주얼'],
      aiModel: 'midjourney',
      isPublic: true,
    },
    {
      title: 'SNS 콘텐츠 기획',
      description: '인스타그램, 페이스북 등 SNS 콘텐츠를 기획하는 프롬프트',
      content: `[브랜드/개인]의 SNS 콘텐츠를 기획해주세요.

플랫폼: [인스타그램/페이스북/링크드인/트위터]
목적: [브랜드 인지도/팔로워 증가/판매 촉진]
타겟 오디언스: [연령대, 관심사, 특성]
톤앤매너: [전문적/친근한/유머러스/영감을 주는]

한 달간의 콘텐츠 캘린더를 만들어주세요:
1. 주차별 테마
2. 포스팅 빈도와 최적 시간대
3. 콘텐츠 유형 (이미지/비디오/릴스/스토리)
4. 각 포스트별 캡션 예시
5. 해시태그 전략
6. 인게이지먼트 향상 팁`,
      category: 'work',
      tags: ['SNS', '마케팅', '콘텐츠', '소셜미디어'],
      aiModel: 'chatgpt',
      isPublic: true,
    },
    {
      title: 'React 컴포넌트 생성기',
      description: '재사용 가능한 React 컴포넌트를 빠르게 만드는 프롬프트',
      content: `다음 요구사항에 맞는 React 컴포넌트를 만들어주세요:

컴포넌트명: [컴포넌트명]
용도: [컴포넌트의 목적과 기능]
Props: [필요한 props와 타입]
상태 관리: [필요한 state]
스타일링: [CSS Modules/Styled-components/Tailwind]

요구사항:
- TypeScript 사용
- 함수형 컴포넌트와 Hooks 활용
- 접근성(a11y) 고려
- 반응형 디자인
- 에러 처리
- 주석과 JSDoc 포함

추가로 다음도 제공해주세요:
1. 사용 예시 코드
2. Props 타입 정의
3. 단위 테스트 코드 (Jest/RTL)`,
      category: 'dev',
      tags: ['React', '프론트엔드', '컴포넌트', 'TypeScript'],
      aiModel: 'cursor',
      isPublic: true,
    },
    {
      title: '프레젠테이션 구조 설계',
      description: '효과적인 프레젠테이션 구성을 도와주는 프롬프트',
      content: `다음 주제로 프레젠테이션을 준비하고 있습니다:

주제: [프레젠테이션 주제]
대상: [청중의 특성과 배경]
시간: [발표 시간]
목적: [정보 전달/설득/교육/영감]

프레젠테이션 구조를 만들어주세요:
1. 임팩트 있는 오프닝 (Hook)
2. 핵심 메시지 3가지
3. 각 섹션별 내용과 시간 배분
4. 시각 자료 아이디어
5. 스토리텔링 요소
6. 청중 참여 방법
7. 강력한 클로징과 CTA

각 슬라이드별 핵심 내용과 스피커 노트도 제공해주세요.`,
      category: 'work',
      tags: ['프레젠테이션', '발표', '기획', '스토리텔링'],
      aiModel: 'claude',
      isPublic: true,
    },
  ];

  // 프롬프트 생성
  for (const promptData of samplePrompts) {
    const prompt = await prisma.prompt.create({
      data: {
        title: promptData.title,
        description: promptData.description,
        content: promptData.content,
        category: promptData.category,
        tags: JSON.stringify(promptData.tags),
        aiModel: promptData.aiModel,
        isPublic: promptData.isPublic,
        authorId: testUser.id,
      },
    });
    console.log(`Created prompt: ${prompt.title}`);
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });