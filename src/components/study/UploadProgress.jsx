import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function UploadProgress({ stage, error }) {
  const stages = [
    { id: 'uploading', label: 'Uploading file...' },
    { id: 'extracting', label: 'Extracting text content...' },
    { id: 'saving', label: 'Saving to database...' },
    { id: 'complete', label: 'Upload complete!' }
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.id === stage);
  };

  const currentIndex = getCurrentStageIndex();

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">Upload Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardContent className="p-4">
        <div className="space-y-3">
          {stages.map((s, index) => (
            <div key={s.id} className="flex items-center gap-3">
              {index < currentIndex ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : index === currentIndex ? (
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
              )}
              <p className={`text-sm ${index <= currentIndex ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
