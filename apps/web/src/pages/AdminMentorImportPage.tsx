import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { apiClient } from '../services/apiClient';
import { MentorCsvPreviewResponse, MentorCsvImportResult } from '@internos/types';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Check,
  AlertOctagon,
  ArrowRight,
  ArrowLeft,
  Download,
  Sparkles,
} from 'lucide-react';

export const AdminMentorImportPage: React.FC = () => {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview Data
  const [preview, setPreview] = useState<MentorCsvPreviewResponse | null>(null);

  // Confirmation / Progress
  const [confirming, setConfirming] = useState(false);
  const [importResult, setImportResult] = useState<MentorCsvImportResult | null>(null);

  const sampleCSV = `First Name,Last Name,Email Address,Company,Designation,Phone,Department
Anand,Deshpande,anand.deshpande@persistent.com,Persistent Systems,Founder & Chairman,9822011223,CSE
Meera,Kulkarni,meera.kulkarni@tcs.com,Tata Consultancy Services,Principal Architect,9822044556,CSE
Sanjay,Joshi,sanjay.joshi@tataelxsi.com,Tata Elxsi,Technical Director,9822077889,ENTC`;

  const handleLoadSample = () => {
    setCsvText(sampleCSV);
    setPreview(null);
    setImportResult(null);
    setError(null);
  };

  const handleDownloadTemplate = () => {
    window.open('/api/v1/admin/mentors/import/template', '_blank');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content || '');
      setPreview(null);
      setImportResult(null);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleParseAndPreview = async () => {
    if (!csvText.trim()) {
      setError('Please paste CSV contents or upload a .csv file.');
      return;
    }

    setLoading(true);
    setError(null);
    setImportResult(null);

    try {
      const res = await apiClient.post<MentorCsvPreviewResponse>('/api/v1/admin/mentors/import/preview', {
        csvContent: csvText,
      });

      if (res.success && res.data) {
        setPreview(res.data);
      } else {
        throw new Error(res.error?.message || 'Failed to parse and validate Mentor CSV');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error validating CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setImportResult(null);
  };

  const handleConfirmImport = async () => {
    if (!preview) return;

    setConfirming(true);
    setError(null);

    try {
      const res = await apiClient.post<MentorCsvImportResult>('/api/v1/admin/mentors/import/confirm', {
        previewToken: preview.token,
        validRows: preview.validRows,
      });

      if (res.success && res.data) {
        setImportResult(res.data);
        setPreview(null);
      } else {
        throw new Error(res.error?.message || 'Failed to commit mentor bulk import');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Navigation */}
      <Link
        to="/app/admin/users"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to User Governance</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mentor Bulk CSV Onboarding</h1>
            <Badge variant="indigo">AI Column Mapping (Groq llama-3.1)</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bulk import industry and academic mentors. Headers from external systems (ERP, HRMS, spreadsheets) are automatically resolved with AI assistance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            <span>Download Template (.csv)</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5 text-xs">
            <span>Load Sample Data</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs">
          <AlertOctagon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Upload or Paste CSV */}
      {!preview && !importResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-800">1. Upload or Paste Mentor CSV</h2>
              </div>
              <span className="text-xs text-slate-400">Comma-separated, UTF-8 encoded</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload File from Computer
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Or Paste CSV Raw Data Directly:
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={7}
                placeholder="First Name,Last Name,Email Address,Company,Designation,Phone,Department&#10;Rajesh,Patil,rajesh@tcs.com,Tata Consultancy Services,VP Engineering,9822011223,CSE"
                className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleParseAndPreview}
                isLoading={loading}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI Analyze & Validate CSV</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 2: Row Validation Preview */}
      {preview && !importResult && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Rows</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{preview.totalRows}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Valid Ready to Import</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{preview.validRows.length}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Invalid Rows</span>
                  <div className="text-2xl font-black text-rose-600 mt-1">{preview.errorRows.length}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Valid Records Preview */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Valid Mentor Records ({preview.validRows.length})</h3>
              <Badge variant="emerald">Clean Data Verified</Badge>
            </CardHeader>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Company / Org</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.validRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-900">{row.firstName} {row.lastName}</td>
                      <td className="p-3 font-mono text-indigo-600">{row.email}</td>
                      <td className="p-3 text-slate-700">{row.company}</td>
                      <td className="p-3 text-slate-500">{row.designation || 'Mentor'}</td>
                      <td className="p-3 font-mono text-slate-500">{row.phone || '—'}</td>
                      <td className="p-3 font-mono">{row.department || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Invalid Records with specific errors */}
          {preview.errorRows.length > 0 && (
            <Card className="border-rose-200">
              <CardHeader className="bg-rose-50/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-rose-900">
                  Invalid Rows ({preview.errorRows.length}) — Will Be Skipped
                </h3>
                <Badge variant="rose">Validation Failures</Badge>
              </CardHeader>
              <div className="overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-rose-50/80 text-rose-700 font-semibold border-b border-rose-200 sticky top-0">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Data</th>
                      <th className="p-3">Validation Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {preview.errorRows.map((inv) => (
                      <tr key={inv.rowNumber} className="hover:bg-rose-50/30">
                        <td className="p-3 font-mono text-rose-500 font-bold">{inv.rowNumber}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600 truncate max-w-xs">
                          {JSON.stringify(inv.raw)}
                        </td>
                        <td className="p-3 text-rose-600 font-medium">
                          {inv.errors.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Action Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <Button variant="outline" onClick={handleCancel}>
              Cancel & Start Over
            </Button>

            <Button
              onClick={handleConfirmImport}
              isLoading={confirming}
              disabled={preview.validRows.length === 0}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Provision {preview.validRows.length} Mentors</span>
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success Confirmation */}
      {importResult && (
        <Card className="border-emerald-200 animate-in fade-in zoom-in-95">
          <CardHeader className="bg-emerald-50/50">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>Mentors Successfully Provisioned & Enrolled</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-2xl font-black text-emerald-700">{importResult.importedCount}</span>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">Mentors Provisioned</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-2xl font-black text-slate-700">{importResult.skippedCount}</span>
                <p className="text-xs text-slate-600 font-medium mt-0.5">Skipped (Invalid)</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="text-2xl font-black text-indigo-700">{importResult.importedCount}</span>
                <p className="text-xs text-indigo-800 font-medium mt-0.5">Invitations Generated</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={handleCancel}>
                Import Another Batch
              </Button>
              <Link to="/app/admin/users">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  View in User Governance →
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default AdminMentorImportPage;
