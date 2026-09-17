import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface DocumentDetail {
  id: string;
  name: string;
  type: string;
  size?: number;
  url: string;
  downloadUrl: string;
  uploadedAt: string;
}

export const StudentDocumentViewerPage: React.FC = () => {
  const { documentId, id } = useParams<{ documentId?: string; id?: string }>();
  const effectiveDocId = documentId || id;

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const token = localStorage.getItem('internos_token') || '';

  useEffect(() => {
    const fetchDoc = async () => {
      if (!effectiveDocId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<DocumentDetail>(`/api/v1/student/documents/${effectiveDocId}`);
        if (res.success && res.data) {
          setDocument(res.data);
        } else {
          setError(res.error?.message || 'Document not found');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load document metadata');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [effectiveDocId]);

  // Fetch blob with auth headers to ensure seamless iframe rendering
  useEffect(() => {
    if (!effectiveDocId || !token) return;

    let active = true;
    const fetchPdfBuffer = async () => {
      try {
        const response = await fetch(`/api/v1/student/documents/${effectiveDocId}/view`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const blob = await response.blob();
          if (active) {
            const url = URL.createObjectURL(blob);
            setPdfBlobUrl(url);
          }
        }
      } catch {
        // Fallback to direct token url in iframe
      }
    };

    fetchPdfBuffer();

    return () => {
      active = false;
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [effectiveDocId, token]);

  const handleDownload = async () => {
    if (!effectiveDocId || !document) return;
    try {
      const response = await fetch(`/api/v1/student/documents/${effectiveDocId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.name || 'document.pdf';
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch {
      window.open(`/api/v1/student/documents/${effectiveDocId}/download?token=${token}`, '_blank');
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
      <div className="space-y-6 max-w-5xl pb-12">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3 max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-900 text-lg">Document Not Found</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || 'Unable to locate the specified document in the vault.'}
        </p>
        <div className="pt-2">
          <Link to="/app/student/documents">
            <Button variant="primary" size="sm">
              Back to Documents
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const iframeSrc = pdfBlobUrl || `/api/v1/student/documents/${effectiveDocId}/view?token=${encodeURIComponent(token)}`;
  const directNewTabUrl = `/api/v1/student/documents/${effectiveDocId}/view?token=${encodeURIComponent(token)}`;

  return (
    <div className="space-y-6 pb-16 max-w-5xl">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/app/student/documents"
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Documents Vault</span>
        </Link>
      </div>

      {/* Document Header Card */}
      <Card className="rounded-2xl border border-slate-200 p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 line-clamp-1">{document.name}</h1>
              <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 p-1 rounded-md" title="Institutional Digital Verification">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1">
              <Badge variant="outline" className="text-[10px] py-0 bg-slate-50 font-mono">
                {document.type?.toUpperCase() || 'APPLICATION/PDF'}
              </Badge>
              <span>•</span>
              <span className="font-medium text-slate-600">{formatFileSize(document.size)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Uploaded {document.uploadedAt}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <a
            href={directNewTabUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </Button>
          </a>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </Button>
        </div>
      </Card>

      {/* Embedded PDF Viewer */}
      <Card className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shadow-sm">
        <div className="bg-slate-800 text-slate-300 px-4 py-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            <span className="font-mono text-[11px] text-slate-200 truncate max-w-sm">{document.name}</span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Native Browser PDF Preview
          </span>
        </div>

        <div className="w-full h-[750px] bg-slate-200 relative">
          <iframe
            src={iframeSrc}
            title={document.name}
            className="w-full h-full border-none"
          />
        </div>
      </Card>
    </div>
  );
};

export default StudentDocumentViewerPage;
