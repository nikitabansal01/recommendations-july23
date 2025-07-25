import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import RecommendationsClient from './components/RecommendationsClient';
import { getResponseData } from '../lib/data';

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ responseId?: string }>;
}) {
  const { responseId } = await searchParams;
  
  if (!responseId) {
    notFound();
  }

  try {
    // 서버에서 초기 데이터 가져오기
    const responseData = await getResponseData(responseId);
    
    // 추천은 클라이언트에서만 fetch (initialRecommendations는 null)
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <RecommendationsClient 
          initialData={responseData}
          initialRecommendations={null}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Error fetching response data:', error);
    notFound();
  }
} 