<p align="center">
  <img src="https://ui.vlaanderen.be/3.latest/icons/app-icon/icon-highres-precomposed.png" width="100" alt="project-logo">
</p>
<p align="center">
    <h1 align="center">APP-VALIDATION-TOOL</h1>
</p>
<p align="center">
	<img src="https://img.shields.io/github/last-commit/lblod/app-validation-tool?style=default&logo=git&logoColor=white&color=0080ff" alt="last-commit">
	<img src="https://img.shields.io/github/languages/top/lblod/app-validation-tool?style=default&color=0080ff" alt="repo-top-language">
	<img src="https://img.shields.io/github/languages/count/lblod/app-validation-tool?style=default&color=0080ff" alt="repo-language-count">
<p>

<br><!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary><br>

- [Overview](#overview)
- [Features](#features)
  - [Document Type Validation](#document-type-validation)
  - [Validation Glue](#validation-glue)
- [Repository Structure](#repository-structure)
- [Installation](#installation)
- [Usage](#usage)
  - [Testing](#testing)
- [Documentation](#documentation)
</details>
<hr>

##  Overview

The App Validation Tool is an [npm module](https://www.npmjs.com/package/validation-monitoring-module) designed to safeguard the integrity of data published to a triple store, crucial in scenarios involving multiple publishers. It meticulously compares publications against a predefined data blueprint, pinpointing discrepancies and enforcing data structure compliance according to specified standards.

Crafted with Test-Driven Development (TDD) principles at its core, this npm module emphasizes reliability and robustness from the ground up. Developed in TypeScript for enhanced type safety and transpiled to JavaScript for wide-ranging compatibility, it incorporates an extensive suite of Jest tests. This rigorous testing approach ensures the module performs reliably under various scenarios, making it a trustworthy addition to any Node.js project.

## Features

### Document Type Validation

Publications must meet structural requirements to ensure consistency and readability. The module supports validation for the following document types:

    - Besluitenlijst
    - Notule
    - Agenda

In addition to specific document types, each publication is required to have a title, validated as a string to ensure it is present and correctly formatted. For "Notule" documents, there is an additional requirement to validate the maturity level, ensuring that these documents not only meet structural standards but also adhere to designated maturity criteria, adding a layer of depth to the validation process.

### Validation Glue

In order to properly validate an agenda item exists in a publication, we need to know the following:

    - Agenda item
      - title
      - resolution
      - vote
      - decision
    - Session
      - time
      - governing body

##  Repository Structure

```sh
└── app-validation-tool/
    ├── README.md
    ├── files
    │   └── basic-agenda.ttl
    │   └── decision-list.ttl
    │   └── notulen.ttl
    ├── jest.config.js
    ├── package-lock.json
    ├── package.json
    ├── src
    │   ├── index.ts
    │   ├── queries.ts
    │   ├── tests
    │   ├── examples.ts
    │   └── validation.ts
    ├── tsconfig.json
    ├── tslint.json
    ├── tsup.config.ts
    └── yarn.lock
```

## Installation

<h4>From <code>source</code></h4>

> 1. Clone the app-validation-tool repository:
>
> ```console
> $ git clone https://github.com/lblod/app-validation-tool
> ```
>
> 2. Change to the project directory:
> ```console
> $ cd app-validation-tool
> ```
>
> 3. Install the dependencies:
> ```console
> $ > npm install
> ```

<h4>From <code>npm</code></h4>

> 1. Install the module from npm:
> ```console
> $ > npm install app-validation-tool
> ```


## Usage

> To use the module, import it into your project:
> ```javascript
> import { validatePublication, getBlueprintOfDocumentType, fetchDocument, getExampleOfDocumentType, enrichClassCollectionsWithExample } from 'app-validation-tool/dist';
> ```
>
> Then, call the `validatePublication` function with the publication data to validate:
> ```typescript
> const blueprint: Bindings[] = await getBlueprintOfDocumentType('Notulen');
> const publication: Bindings[] = await fetchDocument(NOTULEN_LINK, PROXY);
>
> const validationResult = await validatePublication(publication, blueprint);
>
> const example: Document = getExampleOfDocumentType('Notulen');
> const validationResultWithExamples = await enrichClassCollectionsWithExample(validationResult, blueprint, example);
> ```
>
> The `validatePublication` function returns an array of subjects. Each subject is structured as follows:
> ```typescript
> [key: number]: {
>   name: string,
>   totalCount: number,
>   type: string,
>   typeName: string,
>   url: string,
>   usedShape: string,
>   validCount: number,
>   validatedProperties: {
>     [key: number]: {
>       name: string,
> }
> ```


### Testing

> Run the test suite using the command below:
> ```console
> npm run test
> ```

## Documentation

Link to the full documentation [here](https://app.gitbook.com/o/-MP9Yduzf5xu7wIebqPG/s/o6NmI5BUsBB4lH0um5Q4/).

[**Return**](#overview)
