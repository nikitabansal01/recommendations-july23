import { Suspense } from 'react';
import AdminDashboardClient from './components/AdminDashboardClient';
import { getAllResponses, getResponseCounts } from '../lib/data';

export default async function AdminDashboardPage() {
  try {
    // 서버에서 모든 응답 데이터와 카운트 가져오기
    const [initialResponses, responseCounts] = await Promise.all([
      getAllResponses(),
      getResponseCounts()
    ]);
    
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <AdminDashboardClient 
          initialResponses={initialResponses}
          responseCounts={responseCounts}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return (
      <div className="container">
        <h1>Admin Dashboard</h1>
        <p>Error loading data. Please check your database connection.</p>
      </div>
    );
  }
} 