import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  FolderArchive,
  FileText,
  Download,
  ExternalLink,
  Search,
} from 'lucide-react';

interface MentorDocItem {
  id: string;
  internshipId?: string;
  studentId?: string;
  studentName?: string;
  internshipTitle?: string;
  companyName?: string;
  name: string;
  title?: string;
  type: string;
  size?: number;
  url: string;
  uploadedAt: string;
}

export const MentorDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<MentorDocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<MentorDocItem[]>('/api/v1/mentor/documents');
      if (res.success && res.data) {
        setDocuments(res.data);
      } else {
        setError(res.error?.message || 'Failed to load documents repository');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to documents service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.0 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const filteredDocs = documents.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.studentName && d.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.internshipTitle && d.internshipTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Documents</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verified institutional letters, agreements, and deliverables submitted by your interns.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents or intern..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {error ? (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={fetchDocuments}>
            Retry
          </Button>
        </Card>
      ) : filteredDocs.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <FolderArchive className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No Documents Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Documents submitted by assigned interns will appear in this repository.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200/80">
              <div className="space-y-3">
                {/* Prominent Owner Context */}
                <div className="pb-2.5 border-b border-slate-100 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{doc.studentName || 'Sam Student'}</span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {doc.internshipTitle || 'Full Stack Engineering Internship'}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">
                    {doc.title || 'Offer Letter'}
                  </Badge>
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{doc.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      PDF • {formatFileSize(doc.size)} • Uploaded {doc.uploadedAt}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <a
                  href={`/api/v1/student/documents/${doc.id}/view`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> Preview
                  </Button>
                </a>
                <a
                  href={`/api/v1/student/documents/${doc.id}/download`}
                  download
                >
                  <Button variant="primary" size="sm" className="text-xs gap-1 font-semibold">
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
