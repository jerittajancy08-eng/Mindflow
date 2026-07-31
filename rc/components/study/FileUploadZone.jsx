import React, { useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FileUploadZone({ file, onFileSelect, onFileRemove, disabled }) {
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSelectFile(droppedFile);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSelectFile(selectedFile);
    }
  };

  const MAX_FILE_SIZE_MB = 25;

  const validateAndSelectFile = (selectedFile) => {
    const validTypes = ['.pdf', '.txt', '.docx'];
    const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      alert('Please upload PDF, TXT, or DOCX files only');
      return;
    }
    
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    
    onFileSelect(selectedFile);
  };

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Upload File</label>
      
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
        >
          <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop your file here, or click to browse
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Supports PDF, DOCX, TXT (Max 25MB)
          </p>
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload-input"
            disabled={disabled}
          />
          <label htmlFor="file-upload-input">
            <Button type="button" variant="outline" className="cursor-pointer" asChild disabled={disabled}>
              <span>Choose File</span>
            </Button>
          </label>
        </div>
      ) : (
        <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onFileRemove}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
