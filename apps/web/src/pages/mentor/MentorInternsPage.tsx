import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  Users,
  Search,
  ArrowRight,
  GitBranch,
  CheckCircle2,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface InternListItem {
  studentId: string;
  internshipId: string;
  studentName: string;
  department: string;
  internshipTitle: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
  progress: number;
  currentMilestoneTitle?: string;
  pendingSubmissionsCount: number;
  status: string;
}

export const MentorInternsPage: React.FC = () => {
  const [interns, setInterns] = useState<InternListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInterns = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<InternListItem[]>('/api/v1/mentor/interns');
      if (res.success && res.data) {
        setInterns(res.data);
      } else {
        setError(res.error?.message || 'Failed to load interns list');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to interns service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const filteredInterns = interns.filter((i) =>
    i.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.internshipTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.companyName && i.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Interns</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Supervise, mentor, and evaluate students enrolled in your industrial training program.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, dept, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {error ? (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={fetchInterns}>
            Retry
          </Button>
        </Card>
      ) : filteredInterns.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">
            {searchQuery ? 'No matching interns found' : 'No Interns Assigned Yet'}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'Try changing your search keywords.'
              : 'Assigned engineering students will appear here once approved by administration.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInterns.map((intern) => (
            <Card key={intern.studentId} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200/80">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                      {intern.studentName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{intern.studentName}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        {intern.department}
                      </p>
                    </div>
                  </div>
                  <Badge variant={intern.status === 'ACTIVE' ? 'success' : 'default'}>
                    {intern.status}
                  </Badge>
                </div>

                <div className="mt-4 p-3.5 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Internship & Company
                    </span>
                    <span className="text-xs font-semibold text-slate-900 block mt-0.5 line-clamp-1">
                      {intern.internshipTitle}
                    </span>
                    <span className="text-xs text-slate-600 font-medium block">
                      {intern.companyName || 'Host Organization'}
                    </span>
                  </div>

                  {(intern.startDate || intern.endDate) && (
                    <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                      {intern.startDate || '01 Jun 2026'} &rarr; {intern.endDate || '12 Jan 2027'}
                    </p>
                  )}

                  {intern.currentMilestoneTitle && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-700 pt-1 font-medium border-t border-slate-200/60">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span className="line-clamp-1">Milestone: {intern.currentMilestoneTitle}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Internship Progress</span>
                    <span className="font-bold text-slate-800">{intern.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${intern.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                {intern.pendingSubmissionsCount > 0 ? (
                  <span className="text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {intern.pendingSubmissionsCount} Pending Review
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Up to date
                  </span>
                )}

                <Link to={`/app/mentor/interns/${intern.studentId}`}>
                  <Button variant="primary" size="sm" className="gap-1.5 text-xs font-semibold">
                    View Student <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
