import React from 'react';
import {
  AIAnalysisRecordDto,
  AIInternshipInsightsDto,
  AIOutcomeMatchDto,
} from '@internos/types';
import { Badge } from './Badge';
import { Button } from './Button';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Cpu,
  Wrench,
  Award,
  Quote,
  Target,
  FileText,
} from 'lucide-react';

export interface AIInsightsPanelProps {
  analysis?: AIAnalysisRecordDto | null;
  insights?: AIInternshipInsightsDto | null;
  loading?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  analysis,
  insights,
  loading = false,
  onRetry,
  isRetrying = false,
}) => {
  if (loading) {
    return (
      <div className="p-8 text-center space-y-3 bg-slate-900/50 border border-slate-800 rounded-xl">
        <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-300">Processing evidence-based AI intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Mandatory Academic Advisory Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-semibold text-amber-300 flex items-center gap-2">
            <span>Academic Advisory Intelligence Only</span>
            <Badge variant="amber" size="sm">Strictly Advisory</Badge>
          </div>
          <p className="text-amber-200/80 leading-relaxed">
            AI-extracted insights do NOT determine final grades, student competency, or internship health.
            AI does NOT approve, reject, or complete internships. Insights are grounded solely in submitted text as review assistance for faculty and mentors.
          </p>
        </div>
      </div>

      {/* Mode A: Single Submission Deliverable View */}
      {analysis && (
        <div className="space-y-6">
          {/* Header & Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Brain className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Milestone Evidence Analysis</span>
                  <span className="text-xs text-slate-400 font-normal">v{analysis.submissionVersion}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Model: <span className="text-slate-300 font-mono">{analysis.model}</span> · Prompt: <span className="text-slate-300 font-mono">{analysis.promptVersion}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {analysis.status === 'COMPLETED' && (
                <>
                  <Badge variant="emerald" dot>
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                    Confidence: {Math.round(analysis.confidence * 100)}%
                  </Badge>
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      disabled={isRetrying}
                      className="border-slate-700 text-slate-300 hover:text-white"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
                      Re-Analyze
                    </Button>
                  )}
                </>
              )}

              {analysis.status === 'SKIPPED' && (
                <Badge variant="slate">
                  Skipped (Excluded Policy)
                </Badge>
              )}

              {analysis.status === 'FAILED' && (
                <>
                  <Badge variant="rose" dot>
                    <XCircle className="w-3.5 h-3.5 inline mr-1" />
                    Analysis Failed
                  </Badge>
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      disabled={isRetrying}
                      className="border-rose-700 text-rose-300 hover:bg-rose-950/40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
                      Retry Analysis
                    </Button>
                  )}
                </>
              )}

              {analysis.status === 'PENDING' && (
                <Badge variant="indigo" dot>
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 animate-spin" />
                  Analysis Queued
                </Badge>
              )}
            </div>
          </div>

          {/* Failed Message Fallback */}
          {analysis.status === 'FAILED' && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
              <div className="font-semibold">AI Intelligence Extraction Unsuccessful</div>
              <p>{analysis.errorMessage || 'Upstream provider error or timeout. Deliverable and workflow remain completely unaffected.'}</p>
            </div>
          )}

          {/* Skipped Notice */}
          {analysis.status === 'SKIPPED' && (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-xs space-y-1">
              <div className="font-semibold text-slate-300">Analysis Skipped by Institutional Policy</div>
              <p>{analysis.errorMessage || 'Daily diary entries and micro-logs are not analyzed by AI. Only major progress deliverables are processed.'}</p>
            </div>
          )}

          {/* Extracted Data Display */}
          {analysis.status === 'COMPLETED' && (
            <div className="space-y-6">
              {/* 1. Activities & Work Accomplished */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Extracted Activities & Milestones</span>
                </div>
                {analysis.extractedInfo.activities.length > 0 ? (
                  <div className="grid gap-2">
                    {analysis.extractedInfo.activities.map((act, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1">
                        <div className="font-medium text-slate-200">{act.description}</div>
                        {act.evidenceRef && act.evidenceRef !== act.description && (
                          <div className="text-slate-400 italic text-[11px] flex items-center gap-1">
                            <Quote className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>"{act.evidenceRef}"</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No explicit development activities extracted.</p>
                )}
              </div>

              {/* 2. Technologies & Tools */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  <span>Technologies & Tools Identified</span>
                </div>
                {analysis.extractedInfo.technologies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.extractedInfo.technologies.map((tech, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200"
                        title={`Category: ${tech.category} · Evidence: "${tech.evidenceRef}"`}
                      >
                        <Wrench className="w-3 h-3 text-sky-400" />
                        <span className="font-medium text-white">{tech.name}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                          {tech.category}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No specific technology keywords detected in text.</p>
                )}
              </div>

              {/* 3. Skills Demonstrated */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  <span>Engineering Competencies & Skills</span>
                </div>
                {analysis.extractedInfo.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.extractedInfo.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-medium"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No general skills categorized.</p>
                )}
              </div>

              {/* 4. Verbatim Evidence Quotes */}
              {analysis.extractedInfo.evidence.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Grounding Evidence Quotes</span>
                  </div>
                  <div className="space-y-2">
                    {analysis.extractedInfo.evidence.map((ev, idx) => (
                      <div key={idx} className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs space-y-1">
                        <div className="text-emerald-300 font-serif italic">"{ev.quote}"</div>
                        <div className="text-[11px] text-slate-400 flex justify-between items-center">
                          <span>{ev.context}</span>
                          <span className="text-emerald-400 font-semibold">{Math.round(ev.confidence * 100)}% confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Expected Outcomes Mapping */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Institutional Expected Outcomes Alignment</span>
                </div>
                {analysis.extractedInfo.outcomes.length > 0 ? (
                  <div className="grid gap-3">
                    {analysis.extractedInfo.outcomes.map((out, idx) => (
                      <OutcomeMatchCard key={idx} outcome={out} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No Program Outcomes mapped.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode B: Aggregated Faculty Monitoring View */}
      {insights && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Deliverables Analyzed</div>
              <div className="text-xl font-bold text-white">
                {insights.analyzedSubmissions} <span className="text-xs font-normal text-slate-400">/ {insights.totalSubmissions}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Evidence Confidence</div>
              <div className="text-xl font-bold text-indigo-400">
                {Math.round(insights.overallConfidence * 100)}%
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Tech Stack Count</div>
              <div className="text-xl font-bold text-sky-400">
                {insights.technologiesMastered.length}
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Skills Demonstrated</div>
              <div className="text-xl font-bold text-purple-400">
                {insights.skillsDemonstrated.length}
              </div>
            </div>
          </div>

          {/* Mastered Technologies */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Identified Tooling & Technologies
            </div>
            <div className="flex flex-wrap gap-1.5">
              {insights.technologiesMastered.map((t, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Program Outcome Attainment Breakdown */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Program Outcome (PO) Evidence Attainment
            </div>
            <div className="space-y-2.5">
              {insights.outcomeAttainments.map((oa, idx) => (
                <div key={idx} className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">[{oa.outcomeCode}] {oa.outcomeName}</span>
                    <Badge variant={oa.matchCount > 0 ? 'emerald' : oa.partialCount > 0 ? 'amber' : 'slate'} size="sm">
                      {oa.matchCount > 0 ? `${oa.matchCount} Milestone Evidence Matches` : oa.partialCount > 0 ? 'Partial Evidence' : 'No Evidence Found'}
                    </Badge>
                  </div>
                  {oa.evidenceQuotes.length > 0 && (
                    <div className="space-y-1 text-slate-400 italic text-[11px] border-l-2 border-slate-700 pl-2">
                      {oa.evidenceQuotes.slice(0, 2).map((q, qIdx) => (
                        <div key={qIdx}>"{q}"</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OutcomeMatchCard: React.FC<{ outcome: AIOutcomeMatchDto }> = ({ outcome }) => {
  const badgeVariants: Record<string, 'emerald' | 'amber' | 'slate'> = {
    MATCHED: 'emerald',
    PARTIAL: 'amber',
    NO_EVIDENCE: 'slate',
  };

  const badgeLabels: Record<string, string> = {
    MATCHED: 'Evidence Matched',
    PARTIAL: 'Partial Evidence',
    NO_EVIDENCE: 'No Evidence Found',
  };

  return (
    <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-slate-200">
          <span className="text-indigo-400 font-mono mr-1.5">[{outcome.outcomeCode}]</span>
          {outcome.outcomeName}
        </div>
        <Badge variant={badgeVariants[outcome.matchStatus] || 'slate'} size="sm">
          {badgeLabels[outcome.matchStatus] || outcome.matchStatus}
        </Badge>
      </div>

      <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 font-serif italic flex items-start gap-1.5">
        <Quote className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <span>{outcome.evidenceQuote}</span>
      </div>

      {outcome.analysis && (
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {outcome.analysis}
        </p>
      )}
    </div>
  );
};
