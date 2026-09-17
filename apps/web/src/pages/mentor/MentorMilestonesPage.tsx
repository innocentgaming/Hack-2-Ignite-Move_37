import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { MilestoneDto } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  GitBranch,
  Plus,
  Calendar,
} from 'lucide-react';

export const MentorMilestonesPage: React.FC = () => {
  const [milestones, setMilestones] = useState<MilestoneDto[]>([]);
  const [internships, setInternships] = useState<Array<{ id: string; title: string; studentName?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formInternshipId, setFormInternshipId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState(1);
  const [formDueDate, setFormDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [msRes, intRes] = await Promise.all([
        apiClient.get<MilestoneDto[]>('/api/v1/mentor/milestones'),
        apiClient.get<any[]>('/api/v1/mentor/internships'),
      ]);

      if (msRes.success && msRes.data) {
        setMilestones(msRes.data);
      }
      if (intRes.success && intRes.data) {
        setInternships(intRes.data);
        if (intRes.data.length > 0 && !formInternshipId) {
          setFormInternshipId(intRes.data[0].id);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInternshipId) {
      alert('Please select an internship');
      return;
    }
    if (!formTitle.trim()) {
      alert('Milestone title is required');
      return;
    }
    if (!formDueDate) {
      alert('Due date is required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post<MilestoneDto>('/api/v1/mentor/milestones', {
        internshipId: formInternshipId,
        title: formTitle.trim(),
        description: formDescription.trim(),
        order: Number(formOrder),
        dueDate: formDueDate,
      });

      if (res.success && res.data) {
        setMilestones((prev) => [...prev, res.data!]);
        setIsModalOpen(false);
        setFormTitle('');
        setFormDescription('');
        setFormDueDate('');
      } else {
        alert(res.error?.message || 'Failed to create milestone');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to create milestone');
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

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Milestone Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Organize internship journeys into structured developmental phases with measurable deliverables.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="gap-1.5 shadow-sm"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Create Milestone
        </Button>
      </div>

      {error ? (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={fetchData}>
            Retry
          </Button>
        </Card>
      ) : milestones.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <GitBranch className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No Milestones Created Yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Break down the internship into phases (e.g. Onboarding, Core API, Production Deployment).
          </p>
          <Button variant="primary" className="mt-4 gap-1" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" /> Create First Milestone
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {milestones.map((m) => (
            <Card key={m.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                      Phase {m.order}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
                  </div>
                  <Badge variant={m.status === 'COMPLETED' ? 'success' : 'default'}>
                    {m.status || 'IN_PROGRESS'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 mt-2 line-clamp-2">{m.description}</p>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-bold text-slate-800">{m.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Due: {m.dueDate}</span>
                </div>
                <span>
                  {m.completedTasks ?? 0} / {m.totalTasks ?? 0} Tasks Done
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE MILESTONE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Define New Milestone</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
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

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Milestone Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Microservice Architecture & Event Streaming"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description & Goals</label>
                <textarea
                  placeholder="Outline the technical objectives and milestones requirements..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sequence / Order</label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Due Date *</label>
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
                  {submitting ? 'Creating...' : 'Save Milestone'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
