'use client';

import React, { useState } from 'react';
import { Search, CheckCircle, AlertTriangle, User, Phone, Mail, Building, MapPin, Calendar, Tag } from 'lucide-react';
import { CrmRecord } from '../types/index';

interface ResultsTableProps {
  records: Array<CrmRecord>;
}

export default function ResultsTable({ records }: ResultsTableProps) {
  const [activeTab, setSearchTab] = useState<'imported' | 'skipped'>('imported');
  const [searchQuery, setSearchQuery] = useState('');

  const importedRecords = records.filter(r => !r.skipped);
  const skippedRecords = records.filter(r => r.skipped);

  const activeRecords = activeTab === 'imported' ? importedRecords : skippedRecords;

  const filteredRecords = activeRecords.filter((rec) =>
    Object.values(rec).some((val) =>
      String(val || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getStatusBadgeClass = (status: string) => {
    const s = String(status || '').toUpperCase();
    if (s === 'GOOD_LEAD_FOLLOW_UP') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20';
    if (s === 'DID_NOT_CONNECT') return 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20';
    if (s === 'BAD_LEAD') return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20';
    if (s === 'SALE_DONE') return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20';
    return 'bg-muted text-muted-foreground border border-border';
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm transition-all duration-300">
      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-border pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSearchTab('imported')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide border transition-all duration-200 cursor-pointer ${
              activeTab === 'imported'
                ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-550/30'
                : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Imported ({importedRecords.length})
          </button>
          <button
            onClick={() => setSearchTab('skipped')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide border transition-all duration-200 cursor-pointer ${
              activeTab === 'skipped'
                ? 'bg-amber-500/10 text-amber-650 dark:text-amber-400 border-amber-550/30'
                : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Skipped ({skippedRecords.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab} records...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 pl-9 pr-4 py-2 text-sm bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/45 transition-colors duration-200"
          />
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-xl border border-border max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {activeTab === 'imported' ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted text-foreground border-b border-border sticky top-0 z-10">
                <th className="px-4 py-3 font-bold bg-muted">Name</th>
                <th className="px-4 py-3 font-bold bg-muted">Contact info</th>
                <th className="px-4 py-3 font-bold bg-muted">Company & Owner</th>
                <th className="px-4 py-3 font-bold bg-muted">Location</th>
                <th className="px-4 py-3 font-bold bg-muted">Status & Source</th>
                <th className="px-4 py-3 font-bold bg-muted">Notes & Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors duration-150 odd:bg-muted/20">
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400 font-bold uppercase text-[10px]">
                          {rec.name ? rec.name.slice(0, 2) : '??'}
                        </div>
                        <div>
                          <span className="block font-bold text-foreground">{rec.name || 'N/A'}</span>
                          {rec.created_at && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 animate-pulse">
                              <Calendar className="w-3 h-3 text-muted-foreground/75" /> {rec.created_at}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {rec.email && (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{rec.email}</span>
                          </div>
                        )}
                        {(rec.mobile_without_country_code || rec.country_code) && (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-mono">
                              {rec.country_code ? `${rec.country_code} ` : ''}
                              {rec.mobile_without_country_code || ''}
                            </span>
                          </div>
                        )}
                        {!rec.email && !rec.mobile_without_country_code && <span className="text-muted-foreground italic">None</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {rec.company && (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Building className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{rec.company}</span>
                          </div>
                        )}
                        {rec.lead_owner && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                            <span>Owner: {rec.lead_owner}</span>
                          </div>
                        )}
                        {!rec.company && !rec.lead_owner && <span className="text-muted-foreground">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-1 text-foreground">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          {rec.city || rec.state || rec.country ? (
                            <>
                              <span className="block">{[rec.city, rec.state].filter(Boolean).join(', ')}</span>
                              {rec.country && <span className="block text-[10px] text-muted-foreground">{rec.country}</span>}
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">Not specified</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        {rec.crm_status && (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(rec.crm_status)}`}>
                            {rec.crm_status}
                          </span>
                        )}
                        {rec.data_source && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Tag className="w-3 h-3 text-muted-foreground/80" />
                            <span>Src: {rec.data_source}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <div className="space-y-1">
                        {rec.description && (
                          <p className="text-foreground line-clamp-2" title={rec.description}>
                            {rec.description}
                          </p>
                        )}
                        {rec.crm_note && (
                          <div className="text-[10px] bg-muted/40 border border-border rounded-md p-2 text-muted-foreground font-mono whitespace-pre-line max-h-24 overflow-y-auto">
                            {rec.crm_note}
                          </div>
                        )}
                        {!rec.description && !rec.crm_note && <span className="text-muted-foreground italic">No notes</span>}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No imported records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted text-foreground border-b border-border sticky top-0 z-10">
                <th className="px-4 py-3 font-bold bg-muted">Name</th>
                <th className="px-4 py-3 font-bold bg-muted">Skip Reason</th>
                <th className="px-4 py-3 font-bold bg-muted">Raw/Extracted Contact</th>
                <th className="px-4 py-3 font-bold bg-muted">Additional Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors duration-150 odd:bg-muted/20">
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      <span className="block font-bold text-foreground">{rec.name || 'Unnamed Lead'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {rec.skipReason || 'Missing required contact channels'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <span className="block text-muted-foreground">Email: {rec.email || <span className="text-muted-foreground/60 italic font-normal">none</span>}</span>
                        <span className="block text-muted-foreground font-mono">
                          Mobile: {rec.country_code ? `${rec.country_code} ` : ''}
                          {rec.mobile_without_country_code || <span className="text-muted-foreground/60 italic font-normal">none</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      {rec.crm_note ? (
                        <div className="text-[10px] bg-muted/40 border border-border rounded p-1.5 text-muted-foreground font-mono whitespace-pre-line max-h-16 overflow-y-auto">
                          {rec.crm_note}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 italic">None</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No skipped records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
