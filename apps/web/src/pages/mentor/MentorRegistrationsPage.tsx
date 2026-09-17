import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  Briefcase,
  Search,
  CheckCircle2,
  FileText,
  Calendar,
  Building,
  ExternalLink,
  X,
} from 'lucide-react';

interface RegistrationItem {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  internshipTitle: string;
  companyName: string;
  companyWebsite?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  workMode?: string;
  internshipType?: string;
  industryMentor?: string;
  offerLetterUrl?: string;
  status: string;
  submittedAt: string;
}

export const MentorRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal State
  const [activeReg, setActiveReg] = useState<RegistrationItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<RegistrationItem[]>('/api/v1/mentor/registrations');
      if (res.success && res.data) {
        setRegistrations(res.data);
      } else {
        setError(res.error?.message || 'Failed to load internship registrations');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to registration service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleReview = async (decision: 'APPROVE' | 'REQUEST_CHANGES') => {
    if (!activeReg) return;
    try {
      setSubmittingAction(true);
      const res = await apiClient.post(`/api/v1/mentor/registrations/${activeReg.id}/review`, {
        decision,
        notes: reviewNotes,
      });

      if (res.success) {
        setActiveReg(null);
        setReviewNotes('');
        await fetchRegistrations();
      } else {
        alert(res.error?.message || 'Failed to submit registration review');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review');
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.internshipTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'PENDING') return reg.status === 'PENDING_APPROVAL' || reg.status === 'PENDING_REVIEW' || reg.status === 'PENDING';
    if (selectedFilter === 'APPROVED') return reg.status === 'APPROVED';
    if (selectedFilter === 'ACTIVE') return reg.status === 'ACTIVE';
    if (selectedFilter === 'COMPLETED') return reg.status === 'COMPLETED';

    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Internship Registrations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review and authorize newly submitted student internship positions before they transition into active supervision.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, role, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'ALL', label: 'All' },
          { id: 'PENDING', label: 'Pending Review' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'ACTIVE', label: 'Active' },
          { id: 'COMPLETED', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={fetchRegistrations}>
            Retry
          </Button>
        </Card>
      ) : filteredRegistrations.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No Internship Registrations Found</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            There are no student registrations matching the selected criteria. Once approved, internships move to My Interns for supervision.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRegistrations.map((reg) => (
            <Card key={reg.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200/80">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{reg.studentName}</h3>
                    <p className="text-xs text-slate-500">{reg.department}</p>
                  </div>
                  <Badge
                    variant={
                      reg.status === 'APPROVED' || reg.status === 'ACTIVE'
                        ? 'success'
                        : reg.status.includes('PENDING')
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {reg.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Internship Position
                  </span>
                  <p className="text-xs font-bold text-slate-900">{reg.internshipTitle}</p>
                  <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {reg.companyName}
                  </p>

                  {(reg.startDate || reg.endDate) && (
                    <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {reg.startDate || '01 Jun 2026'} &rarr; {reg.endDate || '12 Jan 2027'}
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  Submitted: <span className="font-semibold text-slate-600">{reg.submittedAt.split('T')[0]}</span>
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs font-semibold justify-center"
                  onClick={() => {
                    setActiveReg(reg);
                    setReviewNotes('');
                  }}
                >
                  Review Registration
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {activeReg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                  Registration Review
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{activeReg.internshipTitle}</h3>
                <p className="text-xs text-slate-500">
                  Candidate: <span className="font-semibold text-slate-800">{activeReg.studentName}</span> ({activeReg.department})
                </p>
              </div>
              <button
                onClick={() => setActiveReg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium block">Host Enterprise</span>
                  <span className="font-bold text-slate-900 text-sm">{activeReg.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Company Website</span>
                  {activeReg.companyWebsite ? (
                    <a
                      href={activeReg.companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      {activeReg.companyWebsite} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-600 font-medium">https://cloud.google.com</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Internship Period</span>
                  <span className="font-semibold text-slate-800">
                    {activeReg.startDate || '01 Jun 2026'} &rarr; {activeReg.endDate || '12 Jan 2027'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Work Mode</span>
                  <Badge variant="outline">{activeReg.workMode || 'HYBRID'}</Badge>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Internship Type</span>
                  <span className="font-semibold text-slate-800">{activeReg.internshipType || 'Full-time Industrial'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Industry Mentor</span>
                  <span className="font-semibold text-slate-800">{activeReg.industryMentor || 'Assigned by Host'}</span>
                </div>
              </div>

              {activeReg.description && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Position Scope & Responsibilities</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {activeReg.description}
                  </p>
                </div>
              )}

              {/* Supporting Documents & Offer Letter */}
              <div>
                <span className="font-bold text-slate-800 block mb-1.5">Submitted Documentation</span>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">Official Offer Letter.pdf</p>
                    <p className="text-[11px] text-slate-400">PDF • Verified Academic Submission</p>
                  </div>
                  <Badge variant="success">Verified</Badge>
                </div>
              </div>

              {/* Mentor Notes / Comments */}
              <div className="space-y-1 pt-2">
                <label className="font-bold text-slate-800 block">Review Notes / Feedback</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional review remarks or change instructions..."
                  className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <Button
                variant="outline"
                size="sm"
                disabled={submittingAction}
                onClick={() => handleReview('REQUEST_CHANGES')}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                Request Changes
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={submittingAction}
                onClick={() => handleReview('APPROVE')}
                className="gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Internship
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
