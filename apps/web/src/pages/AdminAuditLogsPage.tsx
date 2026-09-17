import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { apiClient } from '../services/apiClient';
import { AuditLogDto } from '@internos/types';
import { ClipboardList, Filter } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const queryParam = actionFilter ? `?action=${encodeURIComponent(actionFilter)}` : '';
      const res = await apiClient.get<{ logs: AuditLogDto[]; total: number }>(`/api/v1/admin/audit-logs${queryParam}`);
      if (res.success && res.data) {
        setLogs(res.data.logs);
        setTotal(res.data.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE') || action.includes('IMPORT')) return <Badge variant="emerald">{action}</Badge>;
    if (action.includes('UPDATE') || action.includes('ASSIGN')) return <Badge variant="amber">{action}</Badge>;
    if (action.includes('DELETE') || action.includes('DEACTIVATED')) return <Badge variant="rose">{action}</Badge>;
    return <Badge variant="slate">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-indigo-600" />
          Institutional Audit Trail & Governance Log
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Immutable event telemetry recording administrative actions, role assignments, department creations, and bulk ingestions.
        </p>
      </div>

      {/* Filter bar */}
      <Card>
        <CardBody className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold">Filter Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">All Operations</option>
              <option value="USER_CREATE">USER_CREATE</option>
              <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
              <option value="USER_ACTIVATED">USER_ACTIVATED</option>
              <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
              <option value="DEPARTMENT_CREATE">DEPARTMENT_CREATE</option>
              <option value="DEPARTMENT_ASSIGN_HOD">DEPARTMENT_ASSIGN_HOD</option>
              <option value="STUDENTS_CSV_IMPORT">STUDENTS_CSV_IMPORT</option>
              <option value="INSTITUTION_PROFILE_UPDATE">INSTITUTION_PROFILE_UPDATE</option>
            </select>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Showing {logs.length} of {total} events
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Operation</th>
                <th className="px-6 py-3.5">Target Entity</th>
                <th className="px-6 py-3.5">Audit Payload Details</th>
                <th className="px-6 py-3.5">Initiator IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Retrieving immutable audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/75">
                    <td className="px-6 py-3.5 font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-slate-800">{log.entity}</span>
                      {log.entityId && (
                        <span className="block text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
                          {log.entityId}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <pre className="font-mono text-[11px] bg-slate-100 p-2 rounded max-w-sm overflow-x-auto text-slate-700">
                        {log.details ? JSON.stringify(log.details, null, 1) : '{}'}
                      </pre>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
