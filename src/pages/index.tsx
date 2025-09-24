import React from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import PromptGrid from '@/components/PromptGrid';
import ClientOnly from '@/components/ClientOnly';
import { mockPrompts } from '@/utils/mockData';

export default function Home() {
  return (
    <>
      <Head>
        <title>PROMPOT - 프롬프트 공유 플랫폼</title>
        <meta name="description" content="창의적인 프롬프트를 공유하고 발견하는 한국형 프롬프트 커뮤니티" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <ClientOnly>
          <Header />
        </ClientOnly>
        {/* Hero 섹션을 PromptGrid에 포함 */}
        <PromptGrid 
          showHero={true} 
          useAPI={true} 
          showCreateButton={true}
        />
      </main>
    </>
  );
}