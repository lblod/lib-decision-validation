export type ValidatedPublication = {
  classes: ClassCollection[];
  maturity: string;
};

export type ClassCollection = {
  classURI: string;
  className: string;
  count: number;
  objects: ValidatedSubject[];
};

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
  sparqlValidationResults?: ValidationResult[];
  properties: ValidatedProperty[] | ProcessedProperty[];
};

export type ValidationResult = {
  resultSeverity?: string;
  focusNode?: string;
  resultPath?: string;
  value?: string;
  resultMessage: string;
}

export type SparqlConstraint = {
  message: string;
  select: string
}

export type ValidatedProperty = {
  name: string;
  targetClass?: string;
  description: string;
  path: string;
  value: string[] | ValidatedSubject[];
  minCount: number;
  maxCount?: number;
  actualCount: number;
  maturityLevel?: string;
  valid: boolean;
  example?: string;
  sparqlValidationResults?: ValidationResult[];
};

export type DocumentType = {
  id?: string;
  label: string;
};

export type ProcessedProperty = {
  name: string;
  path: string;
  value: string[] | ValidatedSubject[];
  actualCount: number;
  example?: string;
  sparqlValidationResults?: ValidationResult[];
};
