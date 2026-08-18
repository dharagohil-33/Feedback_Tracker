'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { CreateFeedbackModal } from '../../../components/CreateFeedbackModal';

export default function NewFeedbackPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-[60vh]">
        <CreateFeedbackModal
          isOpen={true}
          onClose={() => router.push('/feedback')}
          onSuccess={() => router.push('/feedback')}
        />
      </div>
    </ProtectedRoute>
  );
}
