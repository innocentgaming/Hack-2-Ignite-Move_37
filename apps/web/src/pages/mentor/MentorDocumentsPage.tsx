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
  ShieldCheck,
  Calendar,
  User,
  Search,
} from 'lucide-react';

interface MentorDocItem {
  id: string;
  internshipId?: string;
  studentName?: string;
  name: string;
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
    if (!bytes) return '1.5 MB';
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
    (d.studentName && d.studentName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intern Documents Repository</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verified institutional letters, signed agreements, and deliverable reports uploaded by mentored students.
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
            Documents and compliance files submitted by assigned interns will appear in this central repository.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{doc.name}</h3>
                      {doc.studentName && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          Intern: {doc.studentName}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] py-0 bg-slate-50">
                          {doc.type.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
                        </Badge>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500">{formatFileSize(doc.size)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-emerald-600 bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-4">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Uploaded {doc.uploadedAt}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" /> View
                  </Button>
                </a>
                <a href={doc.url} download target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" size="sm" className="gap-1.5 text-xs">
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
