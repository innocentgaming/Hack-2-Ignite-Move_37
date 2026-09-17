import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { apiClient } from '../services/apiClient';
import {
  CompanyDto,
  InternshipDetailsDto,
} from '@internos/types';
import {
  Building2,
  UserCheck,
  Target,
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

export const InternshipRegistrationPage: React.FC = () => {
  const navigate = useNavigate();

  // Existing Companies in Tenant
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Form Mode: Existing vs New Company
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // New Company Fields
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('Technology & Software');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');

  // Internship Fields
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('');
  const [internshipType, setInternshipType] = useState('FULL_TIME');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  // Mentor Fields
  const [mentorName, setMentorName] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorDesignation, setMentorDesignation] = useState('');
  const [mentorPhone, setMentorPhone] = useState('');

  // Structured Expected Outcomes
  const [outcomes, setOutcomes] = useState<
    Array<{ title: string; description: string; expectedEvidence: string }>
  >([
    {
      title: 'Full Stack API Engineering',
      description: 'Design and deliver production REST/GraphQL microservices',
      expectedEvidence: 'PR review link and OpenAPI schema',
    },
    {
      title: 'Continuous Integration & Deployment',
      description: 'Configure automated unit testing and Docker container pipelines',
      expectedEvidence: 'Staging deployment URL and build logs',
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitForApprovalImmediately, setSubmitForApprovalImmediately] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await apiClient.get<CompanyDto[]>('/api/v1/companies');
        if (res.success && res.data) {
          setCompanies(res.data);
          if (res.data.length > 0) {
            setSelectedCompanyId(res.data[0].id);
          } else {
            setIsNewCompany(true);
          }
        }
      } catch (err) {
        console.warn('Could not fetch companies directory:', err);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleAddOutcome = () => {
    setOutcomes([
      ...outcomes,
      {
        title: '',
        description: '',
        expectedEvidence: '',
      },
    ]);
  };

  const handleRemoveOutcome = (index: number) => {
    if (outcomes.length <= 1) {
      alert('At least one expected outcome is required');
      return;
    }
    setOutcomes(outcomes.filter((_, idx) => idx !== index));
  };

  const handleOutcomeChange = (
    index: number,
    field: 'title' | 'description' | 'expectedEvidence',
    value: string
  ) => {
    const updated = [...outcomes];
    updated[index] = { ...updated[index], [field]: value };
    setOutcomes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Internship title/role is required');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start and End dates are required');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be strictly after start date');
      return;
    }

    if (isNewCompany && (!newCompanyName.trim() || !newCompanyIndustry.trim())) {
      setError('Company name and industry are required when adding a new company');
      return;
    }
    if (!isNewCompany && !selectedCompanyId) {
      setError('Please select an existing host company or add a new one');
      return;
    }

    // Ensure outcomes have default expected evidence if not provided
    const normalizedOutcomes = outcomes.map((o) => ({
      title: o.title.trim() || 'Software Engineering Industry Competency',
      description: o.description.trim() || 'Hands-on practical development deliverable.',
      expectedEvidence: o.expectedEvidence.trim() || 'Pull Request link and verifiable code artifact',
    }));

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        role: role.trim() || title.trim(),
        internshipType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        description: description.trim(),
        ...(isNewCompany
          ? {
              newCompany: {
                name: newCompanyName.trim(),
                industry: newCompanyIndustry.trim(),
                website: newCompanyWebsite.trim() || undefined,
                address: newCompanyAddress.trim() || undefined,
              },
            }
          : { companyId: selectedCompanyId }),
        mentor: mentorName.trim()
          ? {
              name: mentorName.trim(),
              email: mentorEmail.trim(),
              designation: mentorDesignation.trim() || 'Industry Mentor',
              phone: mentorPhone.trim() || undefined,
            }
          : undefined,
        expectedOutcomes: normalizedOutcomes,
      };

      const res = await apiClient.post<InternshipDetailsDto>('/api/v1/internships', payload);
      if (res.success && res.data) {
        const createdId = res.data.id;

        // If student checked "Submit for Approval immediately"
        if (submitForApprovalImmediately) {
          await apiClient.post(`/api/v1/internships/${createdId}/submit`, {});
        }

        navigate('/app/internships');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register internship');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/app/internships')}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            Phase 4 • Student Registration
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Register New Academic Internship
          </h1>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: HOST COMPANY */}
        <Card className="shadow-sm">
          <CardBody className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-800">1. Host Company / Organization</h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsNewCompany(false)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    !isNewCompany
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Select Existing ({companies.length})
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCompany(true)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    isNewCompany
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  + Add New Company
                </button>
              </div>
            </div>

            {!isNewCompany ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Select Host Organization <span className="text-red-500">*</span>
                </label>
                {loadingCompanies ? (
                  <div className="text-xs text-slate-400">Loading companies directory...</div>
                ) : companies.length === 0 ? (
                  <div className="text-sm text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    No approved companies found. Please switch to &quot;Add New Company&quot;.
                  </div>
                ) : (
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {companies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name} — {comp.industry} {comp.isVerified ? '✓ (Verified)' : ''}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-slate-400">
                  Multiple interns can belong to the same host organization.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Company / Enterprise Name"
                  required
                  placeholder="e.g. Stripe, Google, or Siemens"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                />
                <FormInput
                  label="Industry / Domain"
                  required
                  placeholder="e.g. Cloud Infrastructure, FinTech, Automotive"
                  value={newCompanyIndustry}
                  onChange={(e) => setNewCompanyIndustry(e.target.value)}
                />
                <FormInput
                  label="Corporate Website (Optional)"
                  placeholder="https://company.com"
                  value={newCompanyWebsite}
                  onChange={(e) => setNewCompanyWebsite(e.target.value)}
                />
                <FormInput
                  label="Office / Facility Address (Optional)"
                  placeholder="Street, City, State / Remote"
                  value={newCompanyAddress}
                  onChange={(e) => setNewCompanyAddress(e.target.value)}
                />
              </div>
            )}
          </CardBody>
        </Card>

        {/* SECTION 2: ROLE & TIMELINE */}
        <Card className="shadow-sm">
          <CardBody className="p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-800">2. Role, Dates & Track</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Job Title / Internship Role"
                required
                placeholder="e.g. Full Stack Developer Intern"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!role) setRole(e.target.value);
                }}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Internship Track <span className="text-red-500">*</span>
                </label>
                <select
                  value={internshipType}
                  onChange={(e) => setInternshipType(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="FULL_TIME">Full-Time Industry Internship</option>
                  <option value="PART_TIME">Part-Time / Academic Semester Track</option>
                  <option value="RESEARCH">University / Industrial Research Track</option>
                  <option value="REMOTE">Remote / Distributed Internship</option>
                </select>
              </div>

              <FormInput
                label="Start Date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <FormInput
                label="End Date"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Role Summary & Project Scope
              </label>
              <textarea
                rows={3}
                placeholder="Describe key responsibilities, team assignments, tech stack, and deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
              />
            </div>
          </CardBody>
        </Card>

        {/* SECTION 3: INDUSTRY MENTOR DETAILS */}
        <Card className="shadow-sm">
          <CardBody className="p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-800">3. Industry Mentor Contact</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Mentor Full Name"
                placeholder="e.g. Sarah Jenkins"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
              />
              <FormInput
                label="Mentor Professional Email"
                type="email"
                placeholder="sjenkins@company.com"
                value={mentorEmail}
                onChange={(e) => setMentorEmail(e.target.value)}
              />
              <FormInput
                label="Mentor Designation"
                placeholder="e.g. Senior Software Architect"
                value={mentorDesignation}
                onChange={(e) => setMentorDesignation(e.target.value)}
              />
              <FormInput
                label="Phone Number (Optional)"
                placeholder="+1 555-0199"
                value={mentorPhone}
                onChange={(e) => setMentorPhone(e.target.value)}
              />
            </div>
          </CardBody>
        </Card>

        {/* SECTION 4: STRUCTURED EXPECTED OUTCOMES */}
        <Card className="shadow-sm">
          <CardBody className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-800">4. Structured Expected Outcomes</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOutcome}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Outcome
              </Button>
            </div>

            <p className="text-xs text-slate-500">
              Define discrete academic and practical learning outcomes with verifiable deliverables.
              Every modification is versioned in the institutional audit log.
            </p>

            <div className="space-y-4">
              {outcomes.map((outcome, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Outcome #{idx + 1}
                    </span>
                    {outcomes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOutcome(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormInput
                      label="Outcome Objective / Title"
                      required
                      placeholder="e.g. CI/CD Integration, Distributed Caching"
                      value={outcome.title}
                      onChange={(e) => handleOutcomeChange(idx, 'title', e.target.value)}
                    />
                    <FormInput
                      label="Verifiable Expected Evidence"
                      required
                      placeholder="e.g. GitHub Pull Request, test report, performance graph"
                      value={outcome.expectedEvidence}
                      onChange={(e) =>
                        handleOutcomeChange(idx, 'expectedEvidence', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Detailed Outcome Description (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Detailed learning criteria and scope..."
                      value={outcome.description}
                      onChange={(e) => handleOutcomeChange(idx, 'description', e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Submission Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={submitForApprovalImmediately}
              onChange={(e) => setSubmitForApprovalImmediately(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span>
              Submit immediately for Institutional Approval (transitions directly to{' '}
              <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">PENDING_APPROVAL</code>)
            </span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/app/internships')}
              disabled={submitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 flex-1 sm:flex-none"
            >
              {submitting ? 'Registering...' : 'Register Internship'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
