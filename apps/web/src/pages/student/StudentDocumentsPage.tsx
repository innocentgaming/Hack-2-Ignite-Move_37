import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  FolderArchive,
  FileText,
  Download,
  ShieldCheck,
  Calendar,
  Eye,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface StudentDocItem {
  id: string;
  name: string;
  type: string;
  size?: number;
  url: string;
  downloadUrl?: string;
  uploadedAt: string;
}

export const StudentDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<StudentDocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const token = localStorage.getItem('internos_token') || '';

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<StudentDocItem[]>('/api/v1/student/documents');
      if (res.success && res.data) {
        setDocuments(res.data);
      } else {
        setError(res.error?.message || 'Failed to load documents');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to documents repository');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDownload = async (doc: StudentDocItem) => {
    try {
      const downloadUrl = `/api/v1/student/documents/${doc.id}/download`;
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        a.remove();
      } else {
        window.open(`${downloadUrl}?token=${encodeURIComponent(token)}`, '_blank');
      }
    } catch {
      window.open(`/api/v1/student/documents/${doc.id}/download?token=${encodeURIComponent(token)}`, '_blank');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF documents (.pdf) are permitted.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose a PDF document to upload.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          const base64 = result.split(',')[1] || result;

          const res = await apiClient.post<StudentDocItem>('/api/v1/student/documents', {
            filename: selectedFile.name,
            mimeType: 'application/pdf',
            contentBase64: base64,
            documentType: 'STUDENT_UPLOAD',
          });

          if (res.success) {
            setUploadSuccess('Document uploaded successfully!');
            setTimeout(() => {
              setUploadModalOpen(false);
              setSelectedFile(null);
              setUploadSuccess(null);
              fetchDocuments();
            }, 1000);
          } else {
            setUploadError(res.error?.message || 'Failed to upload document');
          }
        } catch (err: any) {
          setUploadError(err?.message || 'Upload processing failed');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setUploadError('Failed to read file from disk.');
        setUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      setUploadError(err?.message || 'Network error during upload');
      setUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.0 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Internship Documents Vault</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Official institutional records, signed offer letters, reports, and credential verifications.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setUploadModalOpen(true)}
          className="gap-1.5 shadow-xs whitespace-nowrap self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </Button>
      </div>

      {error ? (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={fetchDocuments}>
            Retry
          </Button>
        </Card>
      ) : documents.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl space-y-3">
          <FolderArchive className="w-12 h-12 mx-auto text-slate-300" />
          <p className="text-base font-semibold text-slate-800">No Documents Uploaded Yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Documents submitted during registration (such as your Offer Letter) or issued by your institution will appear here.
          </p>
          <Button variant="primary" size="sm" onClick={() => setUploadModalOpen(true)} className="gap-1.5 mt-2">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Offer Letter or Report</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="p-5 flex flex-col justify-between hover:border-indigo-300 transition-all rounded-2xl border border-slate-200 bg-white shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{doc.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] py-0 bg-slate-50 font-mono">
                          PDF DOCUMENT
                        </Badge>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500 font-medium">{formatFileSize(doc.size)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-emerald-600 bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg" title="Digitally Verified">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-4">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Uploaded {doc.uploadedAt}</span>
                </div>
              </div>

              {/* Action Buttons: Preview and Download */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Link to={`/app/student/documents/${doc.id}/view`}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </Button>
                </Link>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  className="gap-1.5 text-xs shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload Institutional Document</h3>
                  <p className="text-[11px] text-slate-500">Provide official PDF file to store in your vault</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Document (.pdf format only)
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-6 text-center bg-slate-50/50">
                  <input
                    type="file"
                    id="modal-pdf-input"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="modal-pdf-input"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                  >
                    <FileText className="w-8 h-8 text-indigo-600 mb-1" />
                    <span className="text-xs font-bold text-indigo-600 hover:underline">
                      Click to choose PDF file
                    </span>
                    <span className="text-[11px] text-slate-400">Strictly verified PDF document (Max 10 MB)</span>
                  </label>
                </div>

                {selectedFile && (
                  <div className="mt-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span className="font-semibold text-indigo-950 truncate">{selectedFile.name}</span>
                      <span className="text-slate-400 text-[11px]">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={uploading || !selectedFile}
                  className="gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Validating & Uploading...' : 'Upload PDF'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentDocumentsPage;
