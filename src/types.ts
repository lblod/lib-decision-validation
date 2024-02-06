export type Blueprint = {
    classUri: string;
    propertyUri: string;
    className: string;
    propertyName: string;
    name: string;
    niveau: string;
}

export type RDFShape = {
    targetClass: string;
    properties: Array<RDFProperty>;
    closed: boolean;
}

export type RDFProperty = {
    name: string;
    status: string;
    description: string;
    path: string;
    class: string;
    datatype: string;
    minCount: number;
    maxCount: number;
}
