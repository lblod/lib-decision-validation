export type ParsedSubject = {
  url: string;
  type: string;
  properties: ParsedProperty[];
};


export type ParsedProperty = {
  path: string;
  value: string | ParsedSubject;
};


export type ValidatedSubject = {
  url: string;
  type: string;
  typeName: string;
  usedShape?: string;
  name?: string;
  totalCount: number;
  validCount?: number;
  properties: ValidatedProperty[];
};


export type ValidatedProperty = {
  name: string;
  targetClass: string;
  description: string;
  path: string;
  value: string[] | ValidatedSubject[];
  minCount?: number
  maxCount?: number;
  actualCount: number;
  valid: boolean;
};
