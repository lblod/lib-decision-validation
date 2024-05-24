export type ClassCollection = {
  classURI: string,
  className: string, 
  count: number,
  objects: ValidatedSubject[]
}

export type ParsedSubject = {
  uri: string;
  class: string;
  properties: ParsedProperty[];
};


export type ParsedProperty = {
  path: string;
  value: string | ParsedSubject;
};


export type ValidatedSubject = {
  uri: string;
  class: string;
  className: string;
  usedShape?: string;
  shapeName?: string;
  totalCount: number;
  validCount?: number;
  properties: ValidatedProperty[];
};


export type ValidatedProperty = {
  name: string;
  targetClass?: string;
  description: string;
  path: string;
  value: string[] | ValidatedSubject[];
  minCount?: number
  maxCount?: number;
  actualCount: number;
  valid: boolean;
};

export type DocumentType = {
  id?: string;
  label: string
}
