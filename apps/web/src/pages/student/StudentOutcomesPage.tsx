import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { StudentOutcomeViewDto } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Target, CheckCircle2, MessageSquare, Info } from 'lucide-react';

export const StudentOutcomesPage: React.FC = () => {
  const [outcomes, setOutcomes] = useState<StudentOutcomeViewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOutcomes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<StudentOutcomeViewDto[]>('/api/v1/student/outcomes');
      if (res.success && res.data) {
        setOutcomes(res.data);
      } else {
        setError(res.error?.message || 'Failed to load outcomes');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to outcomes service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutcomes();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Educational Learning Outcomes (OBE)
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Outcomes define what competencies you develop during industrial training. Your mentor sets the Expected Evidence criteria; you provide verifiable proof.
        </p>
      </div>

      {/* Conceptual Helper Alert */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs text-indigo-900">
        <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold block">How Learning Outcomes Work in InternOS:</span>
          <p>
            • <strong>Expected Evidence:</strong> The requirements established by your college accreditation committee and corporate mentor.
          </p>
          <p>
            • <strong>Actual Evidence:</strong> The verifiable artifacts (code repos, pull requests, staging links, reports) you submit through tasks.
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
          {error}
        </div>
      ) : outcomes.length === 0 ? (
        <Card className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-400">No program outcomes mapped to your internship yet.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {outcomes.map((outcome) => {
            const isVerified = outcome.status === 'VERIFIED';
            const isSubmitted = outcome.status === 'EVIDENCE_SUBMITTED';
            const isRevision = outcome.status === 'REVISION_NEEDED';

            return (
              <Card
                key={outcome.outcomeId}
                className="rounded-2xl border border-slate-200 p-6 bg-white space-y-5 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="indigo" size="sm">
                        {outcome.code}
                      </Badge>
                      <Badge
                        variant={
                          isVerified
                            ? 'emerald'
                            : isSubmitted
                            ? 'indigo'
                            : isRevision
                            ? 'rose'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {outcome.status}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{outcome.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {outcome.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                  {/* Expected Evidence (Requirement) */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-indigo-600" />
                      Expected Evidence Requirement (Mentor Defined)
                    </span>
                    <ul className="space-y-1.5 text-slate-600 pl-4 list-disc">
                      {outcome.expectedEvidence.map((ev: any, idx: number) => (
                        <li key={idx} className="leading-relaxed">
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Student Submitted Actual Evidence */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Your Submitted Actual Evidence ({outcome.studentEvidence.length})
                    </span>

                    {outcome.studentEvidence.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px] pt-1">
                        No submissions linked to this outcome yet. Open an assigned task to submit evidence.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {outcome.studentEvidence.map((ev: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[11px]"
                          >
                            <div className="truncate pr-2">
                              <span className="font-semibold text-slate-800 block truncate">
                                {ev.taskTitle}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {ev.evidenceType} • {ev.submittedAt}
                              </span>
                            </div>
                            <Badge
                              variant={ev.status === 'ACCEPTED' ? 'emerald' : 'indigo'}
                              size="sm"
                            >
                              {ev.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mentor Feedback if exists */}
                {outcome.mentorAssessment && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                    <span className="font-bold text-[11px] flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                      Mentor Assessment Notes:
                    </span>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {outcome.mentorAssessment}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentOutcomesPage;
