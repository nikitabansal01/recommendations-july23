import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ResultsClient from './components/ResultsClient';
import { getResponseData } from '../lib/data';

export default async function ResultsPage({
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
    const initialData = await getResponseData(responseId);
    
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <ResultsClient initialData={initialData} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error fetching response data:', error);
    notFound();
  }
} 