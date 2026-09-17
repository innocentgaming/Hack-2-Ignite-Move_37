import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { MilestoneDto, TaskItemDto, TaskStatus } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  ArrowLeft,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  Edit2,
  Check,
  Circle,
} from 'lucide-react';

interface MilestoneDetailResponse extends MilestoneDto {
  tasks?: TaskItemDto[];
}

export const MentorMilestoneDetailPage: React.FC = () => {
  const { milestoneId } = useParams<{ milestoneId: string }>();
  const [milestone, setMilestone] = useState<MilestoneDetailResponse | null>(null);
  const [tasks, setTasks] = useState<TaskItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Milestone Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [savingMilestone, setSavingMilestone] = useState(false);

  // Add Task Modal
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [expectedEvidence, setExpectedEvidence] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  const fetchMilestone = async () => {
    if (!milestoneId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<MilestoneDetailResponse>(`/api/v1/mentor/milestones/${milestoneId}`);
      if (res.success && res.data) {
        setMilestone(res.data);
        setEditTitle(res.data.title);
        setEditDescription(res.data.description || '');
        setEditDueDate(res.data.dueDate || '');
        if (res.data.tasks) {
          setTasks(res.data.tasks);
        } else {
          // Fallback fetch all mentor tasks for this milestone
          const tasksRes = await apiClient.get<TaskItemDto[]>('/api/v1/mentor/tasks');
          if (tasksRes.success && tasksRes.data) {
            setTasks(tasksRes.data.filter((t) => t.milestoneId === milestoneId));
          }
        }
      } else {
        setError(res.error?.message || 'Failed to load milestone');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to milestone service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestone();
  }, [milestoneId]);

  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestone) return;
    try {
      setSavingMilestone(true);
      const res = await apiClient.patch(`/api/v1/mentor/milestones/${milestone.id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        dueDate: editDueDate,
      });
      if (res.success) {
        setIsEditOpen(false);
        await fetchMilestone();
      } else {
        alert(res.error?.message || 'Failed to update milestone');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update milestone');
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestone) return;
    if (!taskTitle.trim()) {
      alert('Task title is required');
      return;
    }

    try {
      setCreatingTask(true);
      const res = await apiClient.post('/api/v1/mentor/tasks', {
        internshipId: milestone.internshipId,
        milestoneId: milestone.id,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        dueDate: taskDueDate || undefined,
        priority: taskPriority,
        expectedEvidence: expectedEvidence.trim() ? [expectedEvidence.trim()] : ['GitHub PR / Test Suite'],
      });

      if (res.success) {
        setIsAddTaskOpen(false);
        setTaskTitle('');
        setTaskDescription('');
        setTaskDueDate('');
        setExpectedEvidence('');
        await fetchMilestone();
      } else {
        alert(res.error?.message || 'Failed to create task');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error || !milestone) {
    return (
      <Card className="p-8 text-center border-rose-200 bg-rose-50/50">
        <p className="text-sm text-rose-700 font-semibold">{error || 'Milestone not found'}</p>
        <Link to="/app/mentor/milestones">
          <Button variant="secondary" className="mt-4 gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back to Milestones
          </Button>
        </Link>
      </Card>
    );
  }

  const completedCount = tasks.filter((t) => t.status === 'APPROVED').length;
  const computedProgress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : milestone.progress;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/app/mentor/milestones">
            <Button variant="outline" size="sm" className="p-2 h-9 w-9 rounded-xl">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                Milestone {milestone.order}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{milestone.title}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-semibold text-slate-800">{milestone.studentName || 'Student'}</span>
              <span>•</span>
              <span>{milestone.internshipTitle || 'Internship'}</span>
              <span>•</span>
              <span>{milestone.companyName || 'Host Enterprise'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setIsEditOpen(true)}
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Milestone
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 text-xs shadow-sm"
            onClick={() => setIsAddTaskOpen(true)}
          >
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* Milestone Overview Card */}
      <Card className="p-6 border border-slate-200/80">
        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Description & Objectives
            </span>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              {milestone.description || 'Core phase deliverables and technical milestones for this internship.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Due Date</span>
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {milestone.dueDate}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tasks Completed</span>
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                {completedCount} / {tasks.length} tasks
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phase Progress</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${computedProgress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-800">{computedProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Tasks in this Milestone</h3>
          <span className="text-xs text-slate-500 font-medium">{tasks.length} Assigned Tasks</span>
        </div>

        {tasks.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No tasks added to this milestone yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5 text-xs"
              onClick={() => setIsAddTaskOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" /> Add First Task
            </Button>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => {
              const isDone = task.status === 'APPROVED';
              return (
                <Card
                  key={task.id}
                  className="p-4 flex items-center justify-between hover:shadow-sm transition-shadow border border-slate-200/80"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isDone ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Due: {task.dueDate || 'Flexible'} • Priority: {task.priority}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        task.status === TaskStatus.APPROVED
                          ? 'success'
                          : task.status === TaskStatus.SUBMITTED
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT MILESTONE MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Milestone</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateMilestone} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(false)}
                  disabled={savingMilestone}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={savingMilestone}>
                  {savingMilestone ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Task to Milestone</h3>
                <p className="text-xs text-slate-500">
                  {milestone.studentName} • {milestone.title}
                </p>
              </div>
              <button
                onClick={() => setIsAddTaskOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Implement JWT Authentication"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Instructions & Description</label>
                <textarea
                  placeholder="Provide detailed instructions for the intern..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Expected Evidence</label>
                <input
                  type="text"
                  placeholder="e.g. GitHub PR, Postman Test Suite"
                  value={expectedEvidence}
                  onChange={(e) => setExpectedEvidence(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddTaskOpen(false)}
                  disabled={creatingTask}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={creatingTask}>
                  {creatingTask ? 'Adding...' : 'Add Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
