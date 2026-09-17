import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { StudentOutcomeViewDto } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  Target,
  CheckCircle2,
  ExternalLink,
  Search,
  Check,
  Circle,
  Eye,
} from 'lucide-react';

interface ExtendedOutcomeDto extends StudentOutcomeViewDto {
  studentName?: string;
  internshipTitle?: string;
  companyName?: string;
}

export const MentorOutcomesPage: React.FC = () => {
  const [outcomes, setOutcomes] = useState<ExtendedOutcomeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [studentIdFilter, setStudentIdFilter] = useState('');
  const [internshipIdFilter, setInternshipIdFilter] = useState('');
  const [outcomeIdFilter, setOutcomeIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Intern and internship roster for filters
  const [internRoster, setInternRoster] = useState<Array<{ studentId: string; studentName: string }>>([]);
  const [internshipRoster, setInternshipRoster] = useState<Array<{ id: string; title: string }>>([]);

  // Detail Modal State
  const [selectedOutcome, setSelectedOutcome] = useState<ExtendedOutcomeDto | null>(null);

  const fetchOutcomes = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (studentIdFilter) params.set('studentId', studentIdFilter);
      if (internshipIdFilter) params.set('internshipId', internshipIdFilter);
      if (outcomeIdFilter) params.set('outcomeId', outcomeIdFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const url = `/api/v1/mentor/outcomes${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await apiClient.get<ExtendedOutcomeDto[]>(url);

      if (res.success && res.data) {
        setOutcomes(res.data);
      } else {
        setError(res.error?.message || 'Failed to load learning outcomes');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to outcomes service');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const internsRes = await apiClient.get<any[]>('/api/v1/mentor/interns');
      if (internsRes.success && internsRes.data) {
        setInternRoster(
          internsRes.data.map((i) => ({
            studentId: i.studentId,
            studentName: i.studentName,
          }))
        );
        setInternshipRoster(
          internsRes.data.map((i) => ({
            id: i.internshipId,
            title: i.internshipTitle,
          }))
        );
      }
    } catch {
      // Ignored non-critical roster load
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchOutcomes();
  }, [studentIdFilter, internshipIdFilter, outcomeIdFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOutcomes();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Learning Outcomes</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track how each intern demonstrates the learning outcomes defined for their internship.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border border-slate-200/80 bg-slate-50/50">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Student Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Student
              </label>
              <select
                value={studentIdFilter}
                onChange={(e) => setStudentIdFilter(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">All Students</option>
                {internRoster.map((st) => (
                  <option key={st.studentId} value={st.studentId}>
                    {st.studentName}
                  </option>
                ))}
              </select>
            </div>

            {/* Internship Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Internship
              </label>
              <select
                value={internshipIdFilter}
                onChange={(e) => setInternshipIdFilter(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">All Internships</option>
                {internshipRoster.map((ir) => (
                  <option key={ir.id} value={ir.id}>
                    {ir.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Outcome Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Outcome
              </label>
              <select
                value={outcomeIdFilter}
                onChange={(e) => setOutcomeIdFilter(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">All Outcomes</option>
                <option value="po-1">PO-1</option>
                <option value="po-2">PO-2</option>
                <option value="po-3">PO-3</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="EVIDENCE_SUBMITTED">Evidence Submitted</option>
                <option value="VERIFIED">Verified</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <LoadingSkeleton count={3} />
        </div>
      ) : error ? (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={fetchOutcomes}>
            Retry
          </Button>
        </Card>
      ) : outcomes.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <Target className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No Learning Outcomes Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            There are no learning outcomes matching the selected filters.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {outcomes.map((o, idx) => (
            <Card
              key={`${o.outcomeId}-${o.studentId || idx}`}
              className="p-6 hover:shadow-md transition-shadow border border-slate-200/80"
            >
              {/* STUDENT & INTERNSHIP PROMINENT BANNER */}
              <div className="pb-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      STUDENT
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{o.studentName || 'Sam Student'}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap pt-0.5">
                    <span className="font-semibold text-slate-700">{o.internshipTitle || 'Full Stack Engineering Internship'}</span>
                    <span>•</span>
                    <span className="text-slate-500">{o.companyName || 'Google Cloud Solutions'}</span>
                  </div>
                </div>

                <Badge
                  variant={
                    o.status === 'VERIFIED'
                      ? 'success'
                      : o.status === 'EVIDENCE_SUBMITTED'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {o.status === 'VERIFIED' ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED
                    </span>
                  ) : (
                    o.status.replace('_', ' ')
                  )}
                </Badge>
              </div>

              {/* OUTCOME CODE & DESCRIPTION */}
              <div className="pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600">{o.code}</span>
                  <h4 className="text-base font-bold text-slate-900">{o.name || o.title}</h4>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{o.description}</p>
              </div>

              {/* EXPECTED EVIDENCE VS STUDENT EVIDENCE DUAL COLUMN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-100">
                {/* EXPECTED EVIDENCE */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Expected Evidence (Required by Mentor)
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {o.expectedEvidence && o.expectedEvidence.length > 0 ? (
                      o.expectedEvidence.map((ev, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span>{ev}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span>GitHub Pull Request</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span>API Documentation</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* STUDENT ACTUAL EVIDENCE */}
                <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                    Student Evidence (Provided by Intern)
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-800">
                    {o.evidence && o.evidence.length > 0 ? (
                      o.evidence.map((evItem, idx) => (
                        <div key={idx} className="flex items-center justify-between py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="font-medium truncate">{evItem.title || 'Submitted Evidence Artifact'}</span>
                          </div>
                          {evItem.url && (
                            <a
                              href={evItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 font-semibold text-[11px] hover:underline flex items-center gap-1 flex-shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" /> View
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 text-xs py-1 flex items-center gap-1.5">
                        <Circle className="w-3.5 h-3.5 text-slate-300" />
                        No evidence artifacts submitted yet for this outcome.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD FOOTER */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {o.evidence?.length || 0} of {o.expectedEvidence?.length || 2} verification criteria submitted
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-semibold"
                  onClick={() => setSelectedOutcome(o)}
                >
                  <Eye className="w-3.5 h-3.5" /> View Evidence
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* OUTCOME DETAIL MODAL */}
      {selectedOutcome && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  {selectedOutcome.studentName || 'Sam Student'} • {selectedOutcome.internshipTitle || 'Internship'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedOutcome.code} — {selectedOutcome.name || selectedOutcome.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOutcome(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-800 block mb-1">Description</span>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedOutcome.description}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Expected Criteria</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  {selectedOutcome.expectedEvidence?.map((crit, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-700">
                      <Check className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Submitted Artifacts</span>
                <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2">
                  {selectedOutcome.evidence && selectedOutcome.evidence.length > 0 ? (
                    selectedOutcome.evidence.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{ev.title}</span>
                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Open Link
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">No artifact submissions yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedOutcome(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
