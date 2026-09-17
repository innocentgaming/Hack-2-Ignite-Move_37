import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  Briefcase,
  Building2,
  Calendar,
  UserCheck,
  Target,
  GitBranch,
  FolderArchive,
  ExternalLink,
  MapPin,
  FileText,
  Download,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentInternshipPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'mentor' | 'timeline' | 'outcomes' | 'milestones' | 'documents'>('overview');

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<any>('/api/v1/student/internship');
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error?.message || 'No active internship found');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load internship details');
      } finally {
        setLoading(false);
      }
    };

    fetchInternship();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">No Active Internship</h3>
          <p className="text-xs text-slate-500 mt-1">You do not have an active internship registered with your college yet.</p>
        </div>
        <Link to="/app/internships/new">
          <Button variant="primary" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Register Internship
          </Button>
        </Link>
      </div>
    );
  }

  const { overview, company, mentor, timeline, outcomes, milestones, documents } = data;

  const tabs = [
    { id: 'overview', label: 'Internship Overview', icon: Briefcase },
    { id: 'mentor', label: 'Company Mentor', icon: UserCheck },
    { id: 'timeline', label: 'Progress Timeline', icon: Calendar },
    { id: 'outcomes', label: 'Learning Outcomes', icon: Target },
    { id: 'milestones', label: 'Milestones', icon: GitBranch },
    { id: 'documents', label: 'Documents Vault', icon: FolderArchive },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {overview.title}
          </h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
            <span>{company.name}</span>
            <span>•</span>
            <Badge variant="emerald" size="sm">
              {overview.status}
            </Badge>
          </p>
        </div>
        <Link to="/app/student/tasks">
          <Button variant="primary" size="sm">
            View Assigned Tasks
          </Button>
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB A: INTERNSHIP OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border border-slate-200 p-6 bg-white md:col-span-2 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Role & Training Description</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                {overview.description}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium text-[11px] block uppercase">Internship Type</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{overview.type}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[11px] block uppercase">Work Mode</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{overview.workMode}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[11px] block uppercase">Tenure</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {overview.startDate} → {overview.endDate}
                </span>
              </div>
            </div>
          </Card>

          {/* Company Card */}
          <Card className="rounded-2xl border border-slate-200 p-6 bg-white space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Host Organization
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium text-[11px] block">Company Name</span>
                <span className="font-bold text-slate-800 text-sm">{company.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[11px] block">Industry Sector</span>
                <span className="text-slate-700">{company.industry}</span>
              </div>
              {company.website && (
                <div>
                  <span className="text-slate-400 font-medium text-[11px] block">Official Website</span>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>{company.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {company.address && (
                <div>
                  <span className="text-slate-400 font-medium text-[11px] block">Headquarters / Location</span>
                  <span className="text-slate-700 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {company.address}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB B: MENTOR */}
      {activeTab === 'mentor' && (
        <Card className="rounded-2xl border border-slate-200 p-6 bg-white max-w-2xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-xl shadow-xs">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{mentor.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{mentor.designation}</p>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">{company.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-medium text-[11px] block uppercase">Direct Corporate Email</span>
              <span className="font-mono text-slate-800 font-semibold mt-0.5 block">{mentor.email}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium text-[11px] block uppercase">Direct Phone</span>
              <span className="text-slate-700 mt-0.5 block">{mentor.phone || 'Available in corporate directory'}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">Role of your Corporate Mentor:</span>
            <p className="leading-relaxed">
              Your industry mentor defines your technical milestones, reviews submitted deliverables, provides feedback, requests revisions if code or documentation doesn't meet standards, and completes your final performance evaluation.
            </p>
          </div>
        </Card>
      )}

      {/* TAB C: TIMELINE */}
      {activeTab === 'timeline' && (
        <Card className="rounded-2xl border border-slate-200 p-6 bg-white max-w-3xl space-y-6">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Engagement Lifecycle Stages
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timeline.map((item: any, idx: number) => (
              <div key={idx} className="relative flex items-start gap-4">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center -translate-x-[26px] bg-white border-2 ${
                    item.status === 'COMPLETED'
                      ? 'border-emerald-500 text-emerald-500'
                      : item.status === 'ACTIVE'
                      ? 'border-indigo-600 text-indigo-600 animate-pulse'
                      : 'border-slate-300 text-slate-300'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${item.status === 'COMPLETED' ? 'bg-emerald-500' : item.status === 'ACTIVE' ? 'bg-indigo-600' : 'bg-transparent'}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.label}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB D: LEARNING OUTCOMES */}
      {activeTab === 'outcomes' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Educational Learning Outcomes</h3>
            <Link to="/app/student/outcomes" className="text-xs font-semibold text-indigo-600 hover:underline">
              Detailed Outcomes View →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outcomes.map((o: any) => (
              <Card key={o.outcomeId} className="rounded-2xl border border-slate-200 p-5 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="indigo" size="sm">
                    {o.code}
                  </Badge>
                  <Badge variant={o.status === 'VERIFIED' ? 'emerald' : o.status === 'IN_PROGRESS' ? 'indigo' : 'slate'} size="sm">
                    {o.status}
                  </Badge>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{o.name}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{o.description}</p>
                <div className="pt-2 border-t border-slate-100 text-[11px]">
                  <span className="font-semibold text-slate-700 block">Expected Evidence:</span>
                  <ul className="list-disc pl-4 text-slate-500 mt-1 space-y-0.5">
                    {o.expectedEvidence.map((ev: string, idx: number) => (
                      <li key={idx}>{ev}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB E: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Milestone Structure</h3>
            <Link to="/app/student/milestones" className="text-xs font-semibold text-indigo-600 hover:underline">
              Milestone Dashboard →
            </Link>
          </div>

          <div className="space-y-3">
            {milestones.map((m: any) => (
              <Card key={m.id} className="rounded-2xl border border-slate-200 p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      STAGE {m.order}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{m.title}</h4>
                    <Badge variant={m.status === 'COMPLETED' ? 'emerald' : m.status === 'IN_PROGRESS' ? 'indigo' : 'slate'} size="sm">
                      {m.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{m.description}</p>
                  <p className="text-[11px] text-slate-400">Due: {m.dueDate} • {m.completedTasks}/{m.totalTasks} Tasks Finished</p>
                </div>
                <Link to={`/app/student/milestones/${m.id}`}>
                  <Button variant="secondary" size="sm" className="whitespace-nowrap">
                    View Tasks
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB F: DOCUMENTS */}
      {activeTab === 'documents' && (
        <Card className="rounded-2xl border border-slate-200 p-6 bg-white max-w-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Internship Documents Vault</h3>
              <p className="text-xs text-slate-500">Official offer letters, joining reports, and certificates</p>
            </div>
            <Link to="/app/student/documents" className="text-xs font-semibold text-indigo-600 hover:underline">
              Manage Documents →
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">{doc.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">Uploaded: {doc.uploadedAt}</span>
                    </div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm" className="gap-1 text-slate-600 hover:text-indigo-600">
                      <Download className="w-3.5 h-3.5" />
                      <span className="text-xs">Download</span>
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default StudentInternshipPage;
