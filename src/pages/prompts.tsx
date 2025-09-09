import React from 'react';
import Header from '@/components/Header';
import PromptGrid from '@/components/PromptGrid';

const PromptsPage = () => {
  return (
    <>
      <Header />
      <PromptGrid 
        showHero={false}
        showCreateButton={true}
        useAPI={true}
      />
    </>
  );
};

export default PromptsPage;