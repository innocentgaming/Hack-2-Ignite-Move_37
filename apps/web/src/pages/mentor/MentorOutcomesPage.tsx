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
  BookOpen,
  Info,
  ShieldCheck,
} from 'lucide-react';

export const MentorOutcomesPage: React.FC = () => {
  const [outcomes, setOutcomes] = useState<StudentOutcomeViewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOutcomes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<StudentOutcomeViewDto[]>('/api/v1/mentor/outcomes');
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
          Learning Outcomes & OBE Oversight
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Verify that student tasks fulfill educational accreditation requirements through verifiable artifacts.
        </p>
      </div>

      {/* Conceptual Helper Alert */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs text-indigo-900">
        <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold block">OBE Evidence Verification Protocol:</span>
          <p>
            • <strong>Expected Evidence:</strong> Defines what artifact proof is mandatory to satisfy college accreditation.
          </p>
          <p>
            • <strong>Student Actual Evidence:</strong> Concrete code repositories, pull requests, and systems submitted by interns.
          </p>
        </div>
      </div>

      {error ? (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={fetchOutcomes}>
            Retry
          </Button>
        </Card>
      ) : outcomes.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <Target className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No Learning Outcomes Configured</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Institutional learning outcomes will appear here when defined by your educational partners.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {outcomes.map((o) => (
            <Card key={o.outcomeId} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                      {o.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{o.name}</h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{o.description}</p>
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
                    o.status
                  )}
                </Badge>
              </div>

              {/* Expected vs Actual Evidence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Expected Evidence */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Mandatory Expected Evidence Criteria
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    {o.expectedEvidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>

                {/* Actual Student Evidence */}
                <div className="p-4 bg-indigo-50/40 border border-indigo-200/70 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Student Submitted Evidence ({o.studentEvidence.length})
                    </span>
                  </div>

                  {o.studentEvidence.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No artifacts submitted under this outcome yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {o.studentEvidence.map((se, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-indigo-100 text-xs shadow-2xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 block">{se.taskTitle}</span>
                            <span className="text-[10px] text-slate-400">
                              {se.evidenceType} • {se.submittedAt}
                            </span>
                          </div>
                          {se.evidenceUrl && (
                            <a
                              href={se.evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 font-semibold flex items-center gap-1 hover:underline ml-2"
                            >
                              <ExternalLink className="w-3 h-3" /> View Artifact
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
