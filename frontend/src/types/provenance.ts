export type DataProvenance = 'MOCK' | 'OBSERVED' | 'INFERRED' | 'SIMULATED' | 'FEEDBACK';

export interface ProvenanceMetadata {
  type: DataProvenance;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  indicatorColor: string;
  description: string;
}
