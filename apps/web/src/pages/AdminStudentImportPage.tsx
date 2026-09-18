import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { apiClient } from '../services/apiClient';
import { CSVImportPreviewResponse, CSVImportResult } from '@internos/types';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Check,
  AlertOctagon,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const AdminStudentImportPage: React.FC = () => {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview Data
  const [preview, setPreview] = useState<CSVImportPreviewResponse | null>(null);

  // Confirmation / Progress
  const [confirming, setConfirming] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);

  const sampleCSV = `first_name,last_name,email,roll_number,department,program,year,graduation_year
Aditya,Kadam,aditya.kadam@ghristu-demo.in,GHR-CSE-2026-102,CE,B.Tech Computer Engineering,Third Year,2027
Pooja,Deshmukh,pooja.deshmukh@ghristu-demo.in,GHR-IT-2026-108,IT,B.Tech Information Technology,Third Year,2027
Sameer,Patil,sameer.patil@ghristu-demo.in,GHR-BCA-2026-045,CSA,BCA,Second Year,2028`;

  const handleLoadSample = () => {
    setCsvText(sampleCSV);
    setPreview(null);
    setImportResult(null);
    setError(null);
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
      const res = await apiClient.post<CSVImportPreviewResponse>('/api/v1/admin/students/import/preview', {
        csvContent: csvText,
      });

      if (res.success && res.data) {
        setPreview(res.data);
      } else {
        throw new Error(res.error?.message || 'Failed to parse and validate CSV file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error validating CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (preview) {
      try {
        await apiClient.post('/api/v1/admin/students/import/cancel', {
          previewToken: preview.previewToken,
        });
      } catch {
        // ignore
      }
    }
    setPreview(null);
    setImportResult(null);
  };

  const handleConfirmImport = async () => {
    if (!preview) return;

    setConfirming(true);
    setError(null);

    try {
      const res = await apiClient.post<CSVImportResult>('/api/v1/admin/students/import/confirm', {
        previewToken: preview.previewToken,
        defaultPassword: 'TemporaryPass123!',
      });

      if (res.success && res.data) {
        setImportResult(res.data);
        setPreview(null);
      } else {
        throw new Error(res.error?.message || 'Failed to bulk insert student records');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error confirming bulk insert');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-indigo-600" />
          Bulk Student CSV Import Pipeline
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Strict institutional ingestion pipeline: CSV Upload &rarr; Parse &rarr; Validate &rarr; Duplicate Detection &rarr; Preview &rarr; Confirm &rarr; Bulk Insert.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            &times;
          </button>
        </div>
      )}

      {/* Success Notification */}
      {importResult && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-emerald-900">Bulk Ingestion Completed!</h3>
                <p className="text-sm text-emerald-800">
                  Successfully imported <strong>{importResult.importedCount} students</strong> into your institution's registry.
                </p>
                <p className="text-xs text-emerald-700 pt-1">
                  Default temporary credentials (<code>TemporaryPass123!</code>) have been securely provisioned with audit logs captured.
                </p>
                <div className="pt-3">
                  <Button variant="outline" size="sm" onClick={() => setImportResult(null)}>
                    Import Another Batch
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 1: Upload / Input & Verification */}
      {!preview && !importResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                Provide Student CSV Data
              </h3>
              <Button variant="outline" size="sm" onClick={handleLoadSample} className="text-xs">
                Load Template CSV
              </Button>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paste Raw CSV (Headers: studentId, name, email, department)
                </label>
                <textarea
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="studentId,name,email,department&#10;CS-2026-001,Alex Vance,alex@university.edu,CS"
                  className="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                    <FileCheck className="w-4 h-4 text-slate-500" />
                    <span>Upload .CSV File</span>
                    <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <Button onClick={handleParseAndPreview} disabled={loading || !csvText.trim()} className="flex items-center gap-2">
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Validating Batch...
                    </>
                  ) : (
                    <>
                      <span>Parse & Preview</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Guidelines Sidebar */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Ingestion Rules & Validation
              </h3>
            </CardHeader>
            <CardBody className="text-xs text-slate-600 space-y-3 pt-0">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800 mb-1">Mandatory Columns:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  <li><code>studentId</code> (Roll number)</li>
                  <li><code>name</code> (or firstName / lastName)</li>
                  <li><code>email</code> (Unique, valid format)</li>
                  <li><code>department</code> (Code or Name)</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold text-slate-700">Strict Safety Enforcements:</p>
                <p>&bull; <strong>Tenant Isolation:</strong> Department codes must belong to caller's institution.</p>
                <p>&bull; <strong>Duplicate Detection:</strong> Detects duplicates within batch AND across existing accounts.</p>
                <p>&bull; <strong>Preview Guarantee:</strong> No database mutation occurs until explicit admin confirmation.</p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Step 2: Verification Preview Dashboard */}
      {preview && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          {/* Status Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 text-center border-slate-200">
              <span className="text-3xl font-black text-slate-800">{preview.totalRows}</span>
              <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Total Rows</p>
            </Card>

            <Card className="p-4 text-center border-emerald-200 bg-emerald-50/30">
              <span className="text-3xl font-black text-emerald-600">{preview.validCount}</span>
              <p className="text-xs font-semibold text-emerald-700 uppercase mt-1">Valid Rows</p>
            </Card>

            <Card className="p-4 text-center border-amber-200 bg-amber-50/30">
              <span className="text-3xl font-black text-amber-600">{preview.duplicateCount}</span>
              <p className="text-xs font-semibold text-amber-700 uppercase mt-1">Duplicates Skipped</p>
            </Card>

            <Card className="p-4 text-center border-rose-200 bg-rose-50/30">
              <span className="text-3xl font-black text-rose-600">{preview.invalidCount}</span>
              <p className="text-xs font-semibold text-rose-700 uppercase mt-1">Invalid Records</p>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-600">
              Review records below. <strong>{preview.validCount} students</strong> will be created in your institution.
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={confirming}>
                Cancel & Discard
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmImport}
                disabled={confirming || preview.validCount === 0}
                className="flex items-center gap-2"
              >
                {confirming ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executing Bulk Insert...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm & Bulk Insert ({preview.validCount})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Validation Errors & Duplicates Report */}
          {preview.errorReport.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Validation Discrepancies & Duplicate Report ({preview.errorReport.length} warnings)
                </h3>
              </CardHeader>
              <CardBody className="pt-0">
                <ul className="text-xs text-amber-800 space-y-1 font-mono max-h-40 overflow-y-auto pr-2">
                  {preview.errorReport.map((err, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-amber-600">&bull;</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {/* Valid Rows Preview Table */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Validated Students Preview ({preview.validCount})
              </h3>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Roll Number</th>
                    <th className="px-6 py-3">Parsed Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {preview.validRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        No valid records found in this batch.
                      </td>
                    </tr>
                  ) : (
                    preview.validRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/75">
                        <td className="px-6 py-3 font-mono font-bold text-slate-800">{r.studentId}</td>
                        <td className="px-6 py-3 font-medium text-slate-900">
                          {r.parsedFirstName} {r.parsedLastName}
                        </td>
                        <td className="px-6 py-3 text-slate-600">{r.email}</td>
                        <td className="px-6 py-3">
                          <span className="font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {r.department.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant="emerald">Ready for Insert</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
