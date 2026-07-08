export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
  skipped?: boolean;
  skipReason?: string | null;
  originalIndex?: number;
}

export interface CrmFieldConfig {
  key: keyof Omit<CrmRecord, 'skipped' | 'skipReason' | 'originalIndex'>;
  label: string;
  description: string;
  required: boolean;
}
