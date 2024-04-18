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
  totalCount: string;
  validCount?: string;
  properties: ValidatedProperty[];
};


export type ValidatedProperty = {
  name: string;
  targetClass: string;
  description: string;
  path: string;
  value: string[] | ValidatedSubject[];
  minCount?: string
  maxCount?: string;
  actualCount: string;
  valid: boolean;
};
