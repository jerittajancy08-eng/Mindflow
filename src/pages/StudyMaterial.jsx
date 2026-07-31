import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import LoadingSkeleton from '../components/LoadingSkeleton';
import FileUploadZone from '../components/study/FileUploadZone';
import MaterialCard from '../components/study/MaterialCard';
import UploadProgress from '../components/study/UploadProgress';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function StudyMaterial() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [uploadStage, setUploadStage] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const queryClient = useQueryClient();

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['studyMaterials'],
    queryFn: () => base44.entities.StudyMaterial.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StudyMaterial.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyMaterials'] });
      toast.success('Material deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete material');
    }
  });

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
    setUploadError(null);
  };

  const handleFileRemove = () => {
    setFile(null);
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setTextContent('');
    setUploadStage(null);
    setUploadError(null);
    
    const fileInput = document.getElementById('file-upload-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const extractTextFromPDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const extractTextFromFile = async (file, fileUrl) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'pdf') {
      return await extractTextFromPDF(file);
    }
    
    if (fileExtension === 'txt') {
      return await file.text();
    }
    
    if (fileExtension === 'docx') {
      const extractionResult = await base44.integrations.Core.InvokeLLM({
        prompt: 'Extract all text content from this document. Return only the plain text without any formatting, markdown, or metadata. Just the raw text content.',
        file_urls: [fileUrl]
      });
      
      if (!extractionResult || typeof extractionResult !== 'string') {
        throw new Error('Failed to extract text from DOCX');
      }
      
      return extractionResult.trim();
    }
    
    throw new Error('Unsupported file type');
  };

  const processUpload = async (uploadFile, uploadTitle, directText) => {
    const uploadId = Date.now();
    console.log(`Starting upload process ${uploadId}`);
    
    try {
      let content = directText ? directText.trim() : '';
      let fileUrl = null;
      let fileName = null;

      if (uploadFile) {
        fileName = uploadFile.name;
        
        setUploadStage('uploading');
        console.log(`[${uploadId}] Stage: uploading`);
        
        const uploadResult = await base44.integrations.Core.UploadFile({ file: uploadFile });
        fileUrl = uploadResult.file_url;

        if (!fileUrl) {
          throw new Error('File upload failed');
        }

        console.log(`[${uploadId}] File uploaded: ${fileUrl}`);

        setUploadStage('extracting');
        console.log(`[${uploadId}] Stage: extracting`);
        
        content = await extractTextFromFile(uploadFile, fileUrl);
        
        if (!content || content.length < 10) {
          throw new Error('No readable content found in the file');
        }
        
        console.log(`[${uploadId}] Extraction complete, content length: ${content.length}`);
      }

      setUploadStage('saving');
      console.log(`[${uploadId}] Stage: saving`);
      
      let contentToStore = content;
      
      if (content.length > 10000) {
        const contentBlob = new Blob([content], { type: 'text/plain' });
        const contentFile = new File([contentBlob], `${uploadTitle.trim()}_content.txt`, { type: 'text/plain' });
        const contentUploadResult = await base44.integrations.Core.UploadFile({ file: contentFile });
        
        const response = await fetch(contentUploadResult.file_url);
        contentToStore = await response.text();
        
        console.log(`[${uploadId}] Content uploaded as file, length: ${contentToStore.length}`);
      }
      
      await base44.entities.StudyMaterial.create({
        title: uploadTitle.trim(),
        content: contentToStore,
        file_url: fileUrl,
        file_name: fileName,
        topics: []
      });

      console.log(`[${uploadId}] Material saved`);

      setUploadStage('complete');
      
      await queryClient.invalidateQueries({ queryKey: ['studyMaterials'] });
      
      toast.success('Material uploaded successfully');
      
      setTimeout(() => {
        console.log(`[${uploadId}] Resetting form`);
        resetForm();
      }, 1500);

      return { success: true };

    } catch (error) {
      console.error(`[${uploadId}] Upload error:`, error);
      const errorMessage = error.message || 'File processing failed. Please try again.';
      setUploadError(errorMessage);
      setUploadStage(null);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please provide a title');
      return;
    }

    if (!file && !textContent.trim()) {
      toast.error('Please upload a file or paste text content');
      return;
    }

    setUploadError(null);
    setUploadStage(null);

    await processUpload(file, title, textContent);
  };

  const isUploading = uploadStage !== null && uploadStage !== 'complete';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Material</h1>
          <p className="text-gray-600">Upload and manage your study content for quiz generation</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Upload New Material</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title *</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter material title"
                      disabled={isUploading}
                      required
                    />
                  </div>

                  <FileUploadZone
                    file={file}
                    onFileSelect={handleFileSelect}
                    onFileRemove={handleFileRemove}
                    disabled={isUploading}
                  />

                  <div>
                    <label className="text-sm font-medium mb-2 block">Or paste text directly</label>
                    <Textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste your study notes here..."
                      rows={6}
                      disabled={isUploading || !!file}
                    />
                    {file && (
                      <p className="text-xs text-gray-500 mt-1">
                        Remove the file to paste text instead
                      </p>
                    )}
                  </div>

                  {uploadStage && (
                    <UploadProgress stage={uploadStage} error={uploadError} />
                  )}

                  <div className="flex gap-3">
                    {(file || textContent || uploadStage) && !isUploading && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        className="flex-1"
                      >
                        Clear Form
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={isUploading || uploadStage === 'complete'}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {uploadStage === 'complete' ? 'Uploaded!' : 'Upload Material'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Materials ({materials.length})</h2>
              {materials.length > 0 && (
                <p className="text-sm text-gray-500">Most recent first</p>
              )}
            </div>
            {isLoading ? (
              <LoadingSkeleton count={3} />
            ) : materials.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 mb-3">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No materials uploaded yet</p>
                  <p className="text-sm text-gray-500 mt-1">Upload your first study material to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
