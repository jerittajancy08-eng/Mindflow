import React, { useState } from 'react';
import { FileText, Trash2, ChevronDown, ChevronUp, Calendar, File } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MaterialCard({ material, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <FileText className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-lg">{material.title}</h3>
                {material.file_name && (
                  <div className="flex items-center gap-2 mt-1">
                    <File className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500">{material.file_name}</p>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(material.id)}
              className="flex-shrink-0"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{new Date(material.created_date).toLocaleDateString()}</span>
            <Badge variant="secondary" className="ml-2">
              {material.content?.length || 0} characters
            </Badge>
          </div>

          {!expanded && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {material.content?.substring(0, 200)}...
            </p>
          )}

          {expanded && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {material.content}
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                View Full Content
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
