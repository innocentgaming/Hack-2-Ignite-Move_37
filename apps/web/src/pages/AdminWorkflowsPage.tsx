import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { apiClient } from '../services/apiClient';
import {
  WorkflowTemplateDto,
  WorkflowStepConfig,
  WorkflowStepType,
  WorkflowStepFrequency,
  LatePolicyType,
  UserRole,
  DepartmentDto,
} from '@internos/types';
import {
  GitBranch,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  CheckCircle2,
  X,
} from 'lucide-react';

export const AdminWorkflowsPage: React.FC = () => {
  const [templates, setTemplates] = useState<WorkflowTemplateDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Selected Template in Builder
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplateDto | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Template Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [internshipType, setInternshipType] = useState('FULL_TIME');
  const [targetDeptId, setTargetDeptId] = useState('');
  const [steps, setSteps] = useState<WorkflowStepConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tplRes, deptRes] = await Promise.all([
        apiClient.get<WorkflowTemplateDto[]>('/api/v1/workflows/templates'),
        apiClient.get<DepartmentDto[]>('/api/v1/admin/departments'),
      ]);

      if (tplRes.success && tplRes.data) {
        setTemplates(tplRes.data);
        if (tplRes.data.length > 0 && !selectedTemplate) {
          selectTemplateForViewing(tplRes.data[0]);
        }
      }
      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow blueprints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectTemplateForViewing = (tpl: WorkflowTemplateDto) => {
    setSelectedTemplate(tpl);
    setName(tpl.name);
    setDescription(tpl.description || '');
    setInternshipType(tpl.internshipType);
    setTargetDeptId(tpl.assignmentRules.departmentIds?.[0] || '');
    setSteps(JSON.parse(JSON.stringify(tpl.steps)));
    setIsEditing(false);
  };

  const startNewTemplate = () => {
    setSelectedTemplate(null);
    setName('New Specialized Internship Workflow');
    setDescription('Configured lifecycle steps and assessment rubric');
    setInternshipType('FULL_TIME');
    setTargetDeptId('');
    setSteps([
      {
        id: `step-1-${Date.now()}`,
        order: 1,
        type: WorkflowStepType.SUBMISSION,
        frequency: WorkflowStepFrequency.DAILY,
        actor: UserRole.STUDENT,
        required: true,
        deadlineDays: 1,
        title: 'Daily Work Diary',
        description: 'Record daily development milestones and blockers',
        evaluationCriteria: 'Daily log quality and progress tracking',
        maxMarks: 10,
        latePolicy: LatePolicyType.ALLOW_NO_PENALTY,
      },
      {
        id: `step-2-${Date.now()}`,
        order: 2,
        type: WorkflowStepType.SUBMISSION,
        frequency: WorkflowStepFrequency.MONTHLY,
        actor: UserRole.STUDENT,
        required: true,
        deadlineDays: 30,
        title: 'Monthly Milestone Report',
        description: 'Monthly synthesis and technical deliverables submission',
        evaluationCriteria: 'Technical deliverables and documentation',
        maxMarks: 50,
        latePolicy: LatePolicyType.ALLOW_WITH_PENALTY,
      },
      {
        id: `step-3-${Date.now()}`,
        order: 3,
        type: WorkflowStepType.REVIEW,
        frequency: WorkflowStepFrequency.MONTHLY,
        actor: UserRole.FACULTY,
        required: true,
        deadlineDays: 35,
        title: 'Faculty Supervisor Review',
        description: 'Academic supervisor review and milestone endorsement',
        evaluationCriteria: 'Milestone completion and code quality',
        maxMarks: 50,
        latePolicy: LatePolicyType.STRICT_LOCK,
      },
      {
        id: `step-4-${Date.now()}`,
        order: 4,
        type: WorkflowStepType.REVIEW,
        frequency: WorkflowStepFrequency.MONTHLY,
        actor: UserRole.MENTOR,
        required: true,
        deadlineDays: 35,
        title: 'Industry Mentor Review',
        description: 'Corporate mentor workplace evaluation',
        evaluationCriteria: 'Workplace professionalism and technical delivery',
        maxMarks: 50,
        latePolicy: LatePolicyType.STRICT_LOCK,
      },
      {
        id: `step-5-${Date.now()}`,
        order: 5,
        type: WorkflowStepType.EVALUATION,
        frequency: WorkflowStepFrequency.ONE_TIME,
        actor: UserRole.FACULTY,
        required: true,
        deadlineDays: 90,
        title: 'Final Capstone Evaluation',
        description: 'Comprehensive exit rubric and internship defense',
        evaluationCriteria: 'Summative rubric scores and technical outcome mastery',
        maxMarks: 100,
        latePolicy: LatePolicyType.STRICT_LOCK,
      },
    ]);
    setIsEditing(true);
  };

  const handleAddStep = () => {
    const nextOrder = steps.length + 1;
    const newStep: WorkflowStepConfig = {
      id: `step-${nextOrder}-${Date.now().toString(36)}`,
      order: nextOrder,
      type: WorkflowStepType.SUBMISSION,
      frequency: WorkflowStepFrequency.WEEKLY,
      actor: UserRole.STUDENT,
      required: true,
      deadlineDays: nextOrder * 7,
      title: `Step ${nextOrder}: New Activity`,
      description: 'Activity description and expected outcomes',
      evaluationCriteria: 'Quality criteria for assessment',
      maxMarks: 20,
      latePolicy: LatePolicyType.ALLOW_WITH_PENALTY,
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) {
      setError('A workflow must contain at least one step.');
      return;
    }
    const updated = steps.filter((_, i) => i !== index).map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(updated);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    const copy = [...steps];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    const reordered = copy.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(reordered);
  };

  const handleStepChange = <K extends keyof WorkflowStepConfig>(
    index: number,
    field: K,
    value: WorkflowStepConfig[K]
  ) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleSaveWorkflow = async () => {
    if (!name.trim()) {
      setError('Workflow template name is required.');
      return;
    }
    if (steps.length === 0) {
      setError('At least one step is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const assignmentRules = {
        departmentIds: targetDeptId ? [targetDeptId] : undefined,
        internshipTypes: [internshipType],
      };

      if (selectedTemplate && !isEditing) {
        // Just previewing
        return;
      }

      if (selectedTemplate) {
        // Update Template (Version Increment)
        const res = await apiClient.put<WorkflowTemplateDto>(`/api/v1/workflows/templates/${selectedTemplate.id}`, {
          name,
          description,
          internshipType,
          assignmentRules,
          steps,
        });
        if (!res.success) throw new Error(res.error?.message || 'Failed to update template');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await loadData();
      } else {
        // Create New Template
        const res = await apiClient.post<WorkflowTemplateDto>('/api/v1/workflows/templates', {
          name,
          description,
          internshipType,
          assignmentRules,
          steps,
        });
        if (!res.success) throw new Error(res.error?.message || 'Failed to create template');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving workflow blueprint');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitBranch className="w-7 h-7 text-indigo-600" />
            Configurable Workflow Engine & Visual Builder
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Construct structured academic workflows (Daily Diary &rarr; Monthly Report &rarr; Reviews &rarr; Final Evaluation).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={startNewTemplate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Workflow
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Workflow template blueprint successfully saved. Version incremented where applicable.</span>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading workflow blueprints...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Catalog (Left Column) */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            Institution Blueprints ({templates.length})
          </div>

          <div className="space-y-3">
            {templates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => selectTemplateForViewing(tpl)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-900 line-clamp-1">{tpl.name}</span>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 shrink-0">
                      v{tpl.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>
                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
                    <span>{tpl.steps.length} Lifecycle Steps</span>
                    <span className="font-mono text-slate-600 font-medium">{tpl.internshipType}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Builder Studio (Right 3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Studio Parameters Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedTemplate ? `Blueprint: ${selectedTemplate.name}` : 'Create New Blueprint'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deterministic matching rules and pipeline configuration.
                  </p>
                </div>
                {selectedTemplate && (
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo">Version {selectedTemplate.version}</Badge>
                    <Badge variant="emerald">{selectedTemplate.status}</Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Workflow Blueprint Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsEditing(true);
                  }}
                  required
                />
                <FormInput
                  label="Description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setIsEditing(true);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Applicable Department</label>
                  <select
                    value={targetDeptId}
                    onChange={(e) => {
                      setTargetDeptId(e.target.value);
                      setIsEditing(true);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 bg-white"
                  >
                    <option value="">-- All Departments in Institution --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Internship Track</label>
                  <select
                    value={internshipType}
                    onChange={(e) => {
                      setInternshipType(e.target.value);
                      setIsEditing(true);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 bg-white"
                  >
                    <option value="FULL_TIME">FULL_TIME (Industrial Standard)</option>
                    <option value="PART_TIME">PART_TIME (Semester Concurrent)</option>
                    <option value="RESEARCH">RESEARCH (Academic Practicum)</option>
                  </select>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Step Sequence Studio */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Pipeline Steps Sequence ({steps.length} Steps)
              </h3>
              <Button size="sm" variant="outline" onClick={handleAddStep} className="flex items-center gap-1.5 text-xs">
                <Plus className="w-4 h-4 text-indigo-600" />
                Append Step
              </Button>
            </div>

            {/* Interactive Steps List */}
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                        className="font-bold text-base text-slate-900 outline-none border-b border-transparent focus:border-indigo-500"
                        placeholder="Step Title..."
                      />
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        onClick={() => handleMoveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move step up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveStep(idx, 'down')}
                        disabled={idx === steps.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move step down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveStep(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 ml-2"
                        title="Remove step"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Step Attributes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Step Type</label>
                      <select
                        value={step.type}
                        onChange={(e) => handleStepChange(idx, 'type', e.target.value as WorkflowStepType)}
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                      >
                        <option value={WorkflowStepType.SUBMISSION}>Submission</option>
                        <option value={WorkflowStepType.REVIEW}>Review</option>
                        <option value={WorkflowStepType.EVALUATION}>Evaluation</option>
                        <option value={WorkflowStepType.APPROVAL}>Approval</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Frequency</label>
                      <select
                        value={step.frequency}
                        onChange={(e) => handleStepChange(idx, 'frequency', e.target.value as WorkflowStepFrequency)}
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                      >
                        <option value={WorkflowStepFrequency.DAILY}>Daily</option>
                        <option value={WorkflowStepFrequency.WEEKLY}>Weekly</option>
                        <option value={WorkflowStepFrequency.BIWEEKLY}>Biweekly</option>
                        <option value={WorkflowStepFrequency.MONTHLY}>Monthly</option>
                        <option value={WorkflowStepFrequency.ONE_TIME}>One-time</option>
                        <option value={WorkflowStepFrequency.CUSTOM}>Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Assigned Actor</label>
                      <select
                        value={step.actor}
                        onChange={(e) => handleStepChange(idx, 'actor', e.target.value as UserRole)}
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                      >
                        <option value={UserRole.STUDENT}>Student</option>
                        <option value={UserRole.FACULTY}>Faculty Supervisor</option>
                        <option value={UserRole.HOD}>Department Head (HOD)</option>
                        <option value={UserRole.MENTOR}>Industry Mentor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Deadline Offset (Days)</label>
                      <input
                        type="number"
                        value={step.deadlineDays}
                        onChange={(e) => handleStepChange(idx, 'deadlineDays', parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded-lg border border-slate-300 p-2"
                      />
                    </div>
                  </div>

                  {/* Rubric Criteria and Late Policy */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Evaluation Criteria</label>
                      <input
                        type="text"
                        value={step.evaluationCriteria || ''}
                        onChange={(e) => handleStepChange(idx, 'evaluationCriteria', e.target.value)}
                        placeholder="e.g. Technical depth & consistency"
                        className="w-full rounded-lg border border-slate-300 p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Maximum Marks</label>
                      <input
                        type="number"
                        value={step.maxMarks || 0}
                        onChange={(e) => handleStepChange(idx, 'maxMarks', parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded-lg border border-slate-300 p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Late Policy</label>
                      <select
                        value={step.latePolicy}
                        onChange={(e) => handleStepChange(idx, 'latePolicy', e.target.value as LatePolicyType)}
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                      >
                        <option value={LatePolicyType.ALLOW_NO_PENALTY}>Allow (No Penalty)</option>
                        <option value={LatePolicyType.ALLOW_WITH_PENALTY}>Allow (Penalty Tracked)</option>
                        <option value={LatePolicyType.STRICT_LOCK}>Strict Lock (Reject Late)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-400">
                Editing steps automatically bumps version (existing internships retain original snapshots).
              </p>
              <Button onClick={handleSaveWorkflow} disabled={saving} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Publishing Version...' : selectedTemplate ? 'Save & Bump Version' : 'Publish Workflow Template'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
