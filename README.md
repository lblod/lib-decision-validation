
# Validation Monitoring Tool

Concept for a tool to validate publications for harvesting. When multiple publishers are publishing data to a triple store, this tool can be used to validate the data against a blueprint of said data.

A publication can have several requirements in order to make structural sense. These are the type of requirements that can be checked by this tool:

    Document Type: This can be one of the following:
        - besluitenlijst
        - notule
        - agenda

    Title: Each publication must have a title. The title should be a string.

## Running the project

Firstly we should install our dependencies
```npm install```

After we can run the npm script 'dev'
```npm run dev```

### Running tests

We can run our tests using the npm script 'test'
```npm run test```
