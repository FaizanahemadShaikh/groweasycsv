'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  UploadCloud, 
  Layers, 
  AlertTriangle, 
  ArrowLeftRight, 
  Check, 
  Key, 
  HelpCircle, 
  RefreshCw, 
  Moon, 
  Sun, 
  FileSpreadsheet, 
  Play, 
  AlertCircle, 
  X, 
  Settings, 
  CheckCircle 
} from 'lucide-react';
import CsvPreview from '../components/CsvPreview';
import ResultsTable from '../components/ResultsTable';
import { CrmFieldConfig, CrmRecord } from '../types/index';

// Standard GrowEasy CRM fields that AI maps to according to PDF specifications
const CRM_FIELDS: CrmFieldConfig[] = [
  { key: 'created_at', label: 'Created At', description: 'Lead creation/submission date.', required: false },
  { key: 'name', label: 'Lead Name', description: 'Full name of the contact person.', required: true },
  { key: 'email', label: 'Primary Email', description: 'Primary contact email address.', required: false },
  { key: 'country_code', label: 'Country Code', description: 'Phone country code (e.g. +91).', required: false },
  { key: 'mobile_without_country_code', label: 'Mobile Number', description: 'Mobile number excluding country code (e.g. 9876543210).', required: false },
  { key: 'company', label: 'Company Name', description: 'Employer or business organization.', required: false },
  { key: 'city', label: 'City', description: 'City name.', required: false },
  { key: 'state', label: 'State / Region', description: 'State or region.', required: false },
  { key: 'country', label: 'Country', description: 'Country of residence.', required: false },
  { key: 'lead_owner', label: 'Lead Owner', description: 'Assigned representative/agent.', required: false },
  { key: 'crm_status', label: 'CRM Status', description: 'Must be one of the allowed statuses (e.g. GOOD_LEAD_FOLLOW_UP).', required: false },
  { key: 'crm_note', label: 'CRM Notes', description: 'Remarks, follow-up, and extra contacts.', required: false },
  { key: 'data_source', label: 'Data Source', description: 'GrowEasy data source values.', required: false },
  { key: 'possession_time', label: 'Possession Time', description: 'Moving timeline/date.', required: false },
  { key: 'description', label: 'Description', description: 'Brief bio or additional context.', required: false }
];

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';


export default function Home() {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Application State
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Array<Record<string, string>>>([]);
  const [headers, setHeaders] = useState<Array<string>>([]);
  
  // 'upload' | 'scanning' | 'mapping' | 'importing' | 'results'
  const [step, setStep] = useState<'upload' | 'scanning' | 'mapping' | 'importing' | 'results'>('upload'); 

  // Column Mappings State: { crmFieldKey: csvHeaderName }
  const [mappings, setMappings] = useState<Record<string, string>>({});

  // Import Process Progress
  const [progress, setProgress] = useState<number>(0);
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const [totalBatches, setTotalBatches] = useState<number>(0);
  
  // Real row processing status tracker
  const [processedRows, setProcessedRows] = useState<number>(0);

  const [importedCount, setImportedCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);
  const [processedRecords, setProcessedRecords] = useState<Array<CrmRecord>>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize theme and credentials on mount
  useEffect(() => {
    // Theme setup
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Credentials setup
    const savedKey = localStorage.getItem('groq_api_key') || localStorage.getItem('openrouter_api_key') || localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setShowKeyInput(false);
      // Fetch status anyway
      fetch(`${BACKEND_URL}/health`)
        .then(res => res.json())
        .then(data => {
          if (data.hasServerKey) {
            setHasServerKey(true);
          }
        })
        .catch(err => console.warn('Could not contact health check:', err));
    } else {
      // Check server key configuration
      fetch(`${BACKEND_URL}/health`)
        .then(res => res.json())
        .then(data => {
          if (data.hasServerKey) {
            setHasServerKey(true);
            setShowKeyInput(false);
          } else {
            setShowKeyInput(true);
          }
        })
        .catch(err => {
          console.warn('Backend health check check failed:', err);
          setShowKeyInput(true);
        });
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', nextTheme);
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('groq_api_key', key);
    setShowKeyInput(false);
  };

  // Drag and Drop handlers
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    setIsDragOver(true); 
  };
  const handleDragLeave = () => { 
    setIsDragOver(false); 
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Step 1: Parse CSV Client-Side with strict validation rules
  const processFile = (fileToParse: File) => {
    // Strict extension and MIME type validation
    const isCsv = fileToParse.type === 'text/csv' || fileToParse.name.endsWith('.csv');
    if (!isCsv) {
      setError('Strict Security Policy: Only .csv files are accepted. Please select a valid CSV spreadsheet.');
      return;
    }
    
    setFile(fileToParse);
    setError(null);

    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const csvHeaders = (results.meta.fields || []) as Array<string>;
          setHeaders(csvHeaders);
          setParsedData(results.data as Array<Record<string, string>>);
          
          // Move to AI schema detection phase
          detectSchemaMapping(csvHeaders, (results.data as Array<Record<string, string>>).slice(0, 3));
        } else {
          setError('The uploaded CSV file appears to contain no valid rows.');
        }
      },
      error: (parseError) => {
        console.error('Papa Parse Error:', parseError);
        setError(`Error parsing CSV file locally: ${parseError.message}`);
      }
    });
  };

  // Step 2: Call Backend to detect Schema Mapping using Gemini
  const detectSchemaMapping = async (csvHeaders: Array<string>, sampleRows: Array<Record<string, string>>) => {
    setStep('scanning');

    try {
      const response = await fetch(`${BACKEND_URL}/api/import/detect-schema`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-groq-key': apiKey,
          'x-openrouter-key': apiKey,
          'x-gemini-key': apiKey
        },
        body: JSON.stringify({
          headers: csvHeaders,
          sampleRows: sampleRows
        })
      });

      const data = await response.json();
      
      const initialMappings: Record<string, string> = {};
      CRM_FIELDS.forEach(field => {
        if (data.success && data.mappings && data.mappings[field.key]) {
          initialMappings[field.key] = data.mappings[field.key];
        } else {
          // Rule fallback mapping
          const match = csvHeaders.find(h => {
            const hClean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            const kClean = field.key.toLowerCase();
            return hClean.includes(kClean) || kClean.includes(hClean);
          });
          initialMappings[field.key] = match || '';
        }
      });

      setMappings(initialMappings);
      setStep('mapping');

    } catch (err: any) {
      console.warn('AI Schema detection failed or bypassed:', err);
      const fallbackMappings: Record<string, string> = {};
      CRM_FIELDS.forEach(field => {
        const match = csvHeaders.find(h => {
          const hClean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
          const kClean = field.key.toLowerCase();
          return hClean.includes(kClean) || kClean.includes(hClean);
        });
        fallbackMappings[field.key] = match || '';
      });
      setMappings(fallbackMappings);
      setStep('mapping');
    }
  };

  // Handle Mapping Override
  const handleMappingChange = (crmField: string, csvHeader: string) => {
    setMappings(prev => ({
      ...prev,
      [crmField]: csvHeader
    }));
  };

  // Step 3: Run Batch AI Import
  const handleImport = async () => {
    setStep('importing');
    setProgress(0);
    setError(null);
    setImportedCount(0);
    setSkippedCount(0);
    setProcessedRows(0);

    const batchSize = 10;
    const records = parsedData;
    const totalRowsCount = records.length;
    const total = Math.ceil(totalRowsCount / batchSize);
    setTotalBatches(total);

    const results: Array<CrmRecord> = [];
    let successful = 0;
    let skipped = 0;
    let processed = 0;

    for (let i = 0; i < total; i++) {
      setCurrentBatch(i + 1);
      const start = i * batchSize;
      const end = start + batchSize;
      const batch = records.slice(start, end);

      try {
        const response = await fetch(`${BACKEND_URL}/api/import/process-batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-groq-key': apiKey,
            'x-openrouter-key': apiKey,
            'x-gemini-key': apiKey
          },
          body: JSON.stringify({
            records: batch,
            headers: headers,
            mappings: mappings
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `Server returned ${response.status}`);
        }

        results.push(...data.records);

        data.records.forEach((rec: any) => {
          if (rec.skipped) {
            skipped++;
          } else {
            successful++;
          }
        });

        processed += batch.length;
        setProcessedRows(processed);
        setProgress(Math.round((processed / totalRowsCount) * 100));
        setImportedCount(successful);
        setSkippedCount(skipped);

      } catch (err: any) {
        console.error('Batch Import Error:', err);
        setError(`Failed in batch ${i + 1}: ${err.message}. Importer stopped.`);
        setStep('mapping');
        return;
      }
    }

    setProcessedRecords(results);
    setStep('results');
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setProcessedRecords([]);
    setMappings({});
    setError(null);
    setStep('upload');
  };

  return (
    <main className="flex-1 w-full bg-background text-foreground flex flex-col font-sans relative overflow-x-hidden pb-12 transition-colors duration-200">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-[-300px] left-[-300px] w-[600px] h-[600px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-300px] w-[600px] h-[600px] rounded-full bg-emerald-500/5 dark:bg-emerald-500/3 blur-[120px] pointer-events-none" />

      {/* Header Container */}
      <header className="border-b border-border bg-card backdrop-blur-md sticky top-0 z-40 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-xl shadow-sm text-primary-foreground">
              <ArrowLeftRight className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-foreground">GrowEasy CRM</span>
                <span className="px-2 py-0.5 rounded bg-indigo-550/10 text-indigo-600 dark:text-indigo-400 border border-indigo-550/20 text-[9px] font-bold uppercase tracking-wider">AI Platform</span>
              </div>
              <p className="text-[10px] text-muted-foreground tracking-wider font-semibold uppercase">Smart Data Importer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl border border-border bg-secondary text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* API Settings toggle */}
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all duration-200 cursor-pointer ${
                (apiKey || hasServerKey)
                  ? 'bg-secondary border-border text-foreground hover:bg-muted'
                  : 'bg-amber-500/10 text-amber-660 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 animate-pulse'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {apiKey 
                ? 'API Configuration' 
                : hasServerKey 
                ? 'API Configured (Server)' 
                : 'Setup API Key'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full flex flex-col justify-start gap-8 z-10">
        
        {/* Settings API Key Panel */}
        {showKeyInput && (
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all duration-200">
            <div className="absolute top-0 right-0 bg-indigo-550/10 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase text-indigo-650 dark:text-indigo-400 border-l border-b border-border">Credentials</div>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold tracking-wide text-foreground">Groq API Key Config</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  We use the Groq API to intelligently map non-standard columns and parse multi-line emails or phone numbers. If not configured in the server&apos;s <code>.env</code> file, you can supply it here. Saved locally in your browser.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <input
                    type="password"
                    placeholder={
                      hasServerKey
                        ? "Using default server key. Enter custom key to override..."
                        : "Paste your Groq API Key here..."
                    }
                    defaultValue={apiKey ? apiKey : (hasServerKey ? "••••••••••••••••" : "")}
                    id="apiKeyInput"
                    className="flex-1 px-4 py-2.5 text-xs bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const inputEl = document.getElementById('apiKeyInput') as HTMLInputElement | null;
                        if (inputEl) {
                          const val = inputEl.value.trim();
                          if (val === "••••••••••••••••") {
                            setShowKeyInput(false);
                          } else {
                            saveApiKey(val);
                          }
                        }
                      }}
                      className="px-4 py-2.5 text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition shadow-sm cursor-pointer"
                    >
                      Save Settings
                    </button>
                    <button
                      onClick={() => setShowKeyInput(false)}
                      className="px-4 py-2.5 text-xs font-semibold bg-secondary border border-border text-foreground hover:bg-muted rounded-xl transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: UPLOAD AREA */}
        {step === 'upload' && (
          <div className="flex-1 flex flex-col justify-center items-center py-8">
            <div className="max-w-xl text-center mb-10">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground animate-float">
                AI CSV Importer
              </h2>
              <p className="mt-3.5 text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                Clean and import contact lists dynamically. Groq matches column headers, reformats dates, and segregates secondary phone numbers instantly.
              </p>
            </div>

            {error && (
              <div className="w-full max-w-xl mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
                <span>{error}</span>
              </div>
            )}

            {/* Premium Upload Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full max-w-xl p-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-card shadow-sm ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-500/5 shadow-sm scale-[1.01]'
                  : 'border-border hover:border-indigo-500/50 hover:bg-muted/40'
              }`}
              onClick={() => {
                const el = document.getElementById('csvFileInput');
                if (el) el.click();
              }}
            >
              <input
                id="csvFileInput"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-6 shadow-sm relative z-10">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-base font-semibold relative z-10 text-foreground">
                Drag and drop your CRM lead sheet, or <span className="text-indigo-650 dark:text-indigo-400 hover:underline">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2 relative z-10">
                Strict Security Policy: Accepts **CSV files only** (.csv)
              </p>
            </div>
            
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-650 dark:text-indigo-400" /> Semantic Mapping</span>
              <span className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Secondary Contact Extraction</span>
              <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Automatic Skipping Rules</span>
            </div>
          </div>
        )}

        {/* STEP 2: SCHEMA SCANNING ANIMATION */}
        {step === 'scanning' && (
          <div className="flex-1 flex flex-col justify-center items-center py-16">
            <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-sm relative overflow-hidden animate-scanner">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-6 animate-pulse mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold tracking-wide text-center text-foreground">AI Schema Scanner Active</h3>
              <p className="text-xs text-muted-foreground mt-2 text-center max-w-xs mx-auto leading-relaxed">
                Analyzing columns, layouts, and semantic metadata. Determining match mappings...
              </p>
              <div className="mt-8 flex flex-col gap-2.5 max-w-xs mx-auto w-full">
                <div className="h-7 bg-background rounded border border-border flex items-center px-2.5 text-[10px] font-mono text-muted-foreground justify-between">
                  <span>Reading column headers...</span>
                  <span className="text-indigo-650 dark:text-indigo-400 font-bold animate-pulse">Running</span>
                </div>
                <div className="h-7 bg-background rounded border border-border flex items-center px-2.5 text-[10px] font-mono text-muted-foreground justify-between">
                  <span>Resolving field types...</span>
                  <span className="text-muted-foreground/60">Pending</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: MAPPING PANEL & USER VERIFICATION */}
        {step === 'mapping' && (
          <div className="space-y-6">
            
            {/* Header Status Block */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
                  <FileSpreadsheet className="w-5 h-5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold truncate max-w-xs sm:max-w-md text-foreground">{file?.name || 'Lead Sheet'}</h3>
                  <p className="text-xs text-muted-foreground">{file ? `${(file.size / 1024).toFixed(1)} KB` : 'No file'} • {parsedData.length} leads detected</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 text-xs font-semibold bg-secondary border border-border hover:bg-muted text-foreground rounded-xl transition cursor-pointer"
                >
                  Change File
                </button>
                <button
                  onClick={handleImport}
                  disabled={!!error && !file}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 hover:opacity-90 text-white rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 text-white fill-white shrink-0" />
                  Run AI Import Flow
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
                <span>{error}</span>
              </div>
            )}

            {/* Interactive Schema Grid mapping */}
            {parsedData.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold tracking-wide text-foreground">Configure AI CRM Mapping</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Groq pre-selected appropriate column matches. Review or adjust mappings before processing. Unmapped fields will be bypassed or compiled into CRM notes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CRM_FIELDS.map((field) => {
                    const isMapped = !!mappings[field.key];
                    return (
                      <div 
                        key={field.key} 
                        className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${
                          isMapped 
                            ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-550/20' 
                            : 'bg-card border-border hover:border-border/80'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold tracking-wide text-foreground">{field.label}</span>
                            {field.required && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold uppercase tracking-wider">Required</span>
                            )}
                            {isMapped ? (
                              <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                                <Check className="w-3 h-3" /> Matched
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full border border-border">
                                <X className="w-3 h-3" /> Skipped
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 leading-normal truncate">{field.description}</p>
                        </div>

                        {/* Dropdown column matcher */}
                        <div className="shrink-0">
                          <select
                            value={mappings[field.key] || ''}
                            onChange={(e) => handleMappingChange(field.key, e.target.value)}
                            className="px-3 py-1.5 text-xs bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/60 cursor-pointer min-w-[140px] max-w-[200px] truncate"
                          >
                            <option value="">(Skip Field)</option>
                            {headers.map((header, idx) => (
                              <option key={idx} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Raw preview table */}
            {parsedData.length > 0 && <CsvPreview data={parsedData} headers={headers} />}
          </div>
        )}

        {/* STEP 4: BATCH IMPORT PROGRESS */}
        {step === 'importing' && (
          <div className="flex-1 flex flex-col justify-center items-center py-16">
            <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col items-center text-center">
              <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-border" />
                <div className="absolute inset-0 rounded-full border-4 border-indigo-550 border-t-transparent animate-spin" />
                <Layers className="w-8 h-8 text-indigo-650 dark:text-indigo-400" />
              </div>

              <h3 className="text-xl font-bold tracking-wide text-foreground">Processing lead data with AI</h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-sm">
                Mapping fields and formatting contacts using Groq API. Records are processed in batches.
              </p>

              {/* Progress and status */}
              <div className="w-full mt-8 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Processed {processedRows} of {parsedData.length} records</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-550 to-emerald-450 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Dynamic status display */}
              <div className="grid grid-cols-2 gap-4 w-full mt-6 border-t border-border pt-6">
                <div>
                  <span className="block text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-sans">Mapped CRM Leads</span>
                  <span className="block text-xl font-extrabold text-emerald-600 dark:text-emerald-450 mt-1">{importedCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-sans">Skipped Leads</span>
                  <span className="block text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{skippedCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: FINAL RESULTS DISPLAY */}
        {step === 'results' && (
          <div className="space-y-8">
            {/* Top overview metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Processed Card */}
              <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4 hover:-translate-y-0.5 shadow-sm transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Processed</span>
                  <span className="block text-2xl font-extrabold text-foreground mt-0.5">{processedRecords.length}</span>
                </div>
              </div>

              {/* Imported Card */}
              <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4 hover:-translate-y-0.5 shadow-sm transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Successful Leads</span>
                  <span className="block text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{importedCount}</span>
                </div>
              </div>

              {/* Skipped Card */}
              <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4 hover:-translate-y-0.5 shadow-sm transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skipped Leads</span>
                  <span className="block text-2xl font-extrabold text-amber-600 dark:text-amber-450 mt-0.5">{skippedCount}</span>
                </div>
              </div>

              {/* Conversion Efficiency Card */}
              <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4 hover:-translate-y-0.5 shadow-sm transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Success Rate</span>
                  <span className="block text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
                    {processedRecords.length > 0
                      ? `${Math.round((importedCount / processedRecords.length) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Section Actions */}
            <div className="flex justify-between items-center bg-card p-5 rounded-2xl border border-border shadow-sm">
              <div>
                <h4 className="font-bold text-sm text-foreground animate-pulse">Processing Complete</h4>
                <p className="text-xs text-muted-foreground mt-0.5">All data has been parsed and structured into standard CRM format.</p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-secondary border border-border hover:bg-muted text-foreground rounded-xl transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Import Another File
              </button>
            </div>

            {/* Mapped Records Viewer */}
            <ResultsTable records={processedRecords} />
          </div>
        )}

      </div>
    </main>
  );
}
