export type ValidatedPublication = {
  classes: ClassCollection[];
  maturity: MaturityLevel;
  maturityLevelReport?: MaturityLevelReport;
};

export type ClassCollection = {
  classURI: string;
  className: string;
  count: number;
  objects: ValidatedSubject[];
  sparqlValidationResults?: ValidationResult[];
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
  maturityLevel?: MaturityLevel;
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

export type MaturityLevelReport = {
  foundMaturity: MaturityLevel;
  maturityLevel1Report: specificMaturityLevelReport;
  maturityLevel2Report: specificMaturityLevelReport;
  maturityLevel3Report: specificMaturityLevelReport;
}

export type specificMaturityLevelReport = {
  maturityLevel?: MaturityLevel;
  missingOptionalProperties: Property[];
  missingClasses: string[];
  invalidProperties: ValidatedProperty[];
  mandatarissenThatAreNotDereferenced?: string[];
}

export type Property = {
  targetClass: string;
  path: string;
}

export enum MaturityLevel {
  Niveau0 = "Niveau 0",
  Niveau1 = "Niveau 1",
  Niveau2 = "Niveau 2",
  Niveau3 = "Niveau 3"
}