import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { TaskItemDto, MilestoneDto, StudentOutcomeViewDto, TaskStatus } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  CheckSquare,
  Plus,
  Calendar,
  GitBranch,
  Target,
  Search,
} from 'lucide-react';

export const MentorTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItemDto[]>([]);
  const [milestones, setMilestones] = useState<MilestoneDto[]>([]);
  const [outcomes, setOutcomes] = useState<StudentOutcomeViewDto[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formInternshipId, setFormInternshipId] = useState('');
  const [formMilestoneId, setFormMilestoneId] = useState('');
  const [formOutcomeId, setFormOutcomeId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formPriority, setFormPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [formDueDate, setFormDueDate] = useState('');
  const [formExpectedEvidence, setFormExpectedEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tasksRes, msRes, outRes, intRes] = await Promise.all([
        apiClient.get<TaskItemDto[]>('/api/v1/mentor/tasks'),
        apiClient.get<MilestoneDto[]>('/api/v1/mentor/milestones'),
        apiClient.get<StudentOutcomeViewDto[]>('/api/v1/mentor/outcomes'),
        apiClient.get<any[]>('/api/v1/mentor/internships'),
      ]);

      if (tasksRes.success && tasksRes.data) setTasks(tasksRes.data);
      if (msRes.success && msRes.data) setMilestones(msRes.data);
      if (outRes.success && outRes.data) setOutcomes(outRes.data);
      if (intRes.success && intRes.data) {
        setInternships(intRes.data);
        if (intRes.data.length > 0 && !formInternshipId) {
          setFormInternshipId(intRes.data[0].id);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInternshipId) {
      alert('Please select an internship');
      return;
    }
    if (!formTitle.trim()) {
      alert('Task title is required');
      return;
    }
    if (!formDueDate) {
      alert('Due date is required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post<TaskItemDto>('/api/v1/mentor/tasks', {
        internshipId: formInternshipId,
        milestoneId: formMilestoneId || undefined,
        learningOutcomeId: formOutcomeId || undefined,
        title: formTitle.trim(),
        description: formDescription.trim(),
        instructions: formInstructions.trim(),
        priority: formPriority,
        dueDate: formDueDate,
        expectedEvidence: formExpectedEvidence.trim() || 'GitHub Pull Request link and summary report',
      });

      if (res.success && res.data) {
        setTasks((prev) => [res.data!, ...prev]);
        setIsModalOpen(false);
        setFormTitle('');
        setFormDescription('');
        setFormInstructions('');
        setFormDueDate('');
        setFormExpectedEvidence('');
      } else {
        alert(res.error?.message || 'Failed to create task');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && t.status === TaskStatus.PENDING) ||
      (statusFilter === 'SUBMITTED' && t.status === TaskStatus.SUBMITTED) ||
      (statusFilter === 'APPROVED' && t.status === TaskStatus.APPROVED) ||
      (statusFilter === 'CHANGES_REQUESTED' && t.status === TaskStatus.CHANGES_REQUESTED);

    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.milestoneTitle && t.milestoneTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.expectedEvidence && t.expectedEvidence.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task & Deliverable Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Assign technical tasks, define expected evidence, and connect deliverables to accredited outcomes.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="gap-1.5 shadow-sm"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Create Task
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'PENDING', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {error ? (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={fetchData}>
            Retry
          </Button>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <CheckSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No Tasks Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Create structured deliverable tasks with due dates and required evidence criteria for your interns.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <Card key={t.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                    <Badge
                      variant={
                        t.status === 'APPROVED'
                          ? 'success'
                          : t.status === 'SUBMITTED'
                          ? 'warning'
                          : t.status === 'CHANGES_REQUESTED'
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {t.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {t.priority}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{t.description}</p>

                  <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl mt-2 text-xs">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Required Evidence:
                    </span>
                    <span className="text-indigo-950 font-medium">{t.expectedEvidence}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due {t.dueDate}</span>
                    </div>
                    {t.milestoneTitle && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{t.milestoneTitle}</span>
                      </div>
                    )}
                    {t.learningOutcomeCode && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <Target className="w-3.5 h-3.5 text-purple-600" />
                        <span>{t.learningOutcomeCode}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-slate-800">{t.submissionCount ?? 0}</span> Submissions
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Internship Deliverable Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Internship *</label>
                <select
                  value={formInternshipId}
                  onChange={(e) => setFormInternshipId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                >
                  <option value="">Select internship...</option>
                  {internships.map((int) => (
                    <option key={int.id} value={int.id}>
                      {int.title} {int.studentName ? `(${int.studentName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Milestone Phase</label>
                  <select
                    value={formMilestoneId}
                    onChange={(e) => setFormMilestoneId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">None / General</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Learning Outcome (OBE)</label>
                  <select
                    value={formOutcomeId}
                    onChange={(e) => setFormOutcomeId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">None</option>
                    {outcomes.map((o) => (
                      <option key={o.outcomeId} value={o.outcomeId}>
                        {o.code} - {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Implement REST API Endpoints with Rate Limiting"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Technical Description</label>
                <textarea
                  placeholder="Describe the architectural requirements and expectations..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Expected Evidence Required from Intern *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pull Request link, Unit Test coverage report, Swagger URL"
                  value={formExpectedEvidence}
                  onChange={(e) => setFormExpectedEvidence(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Assign Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
