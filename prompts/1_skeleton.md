# INTRO
- the aim of this prompt is to create an excellent, maintainable, enterprise-grade, application skeleton
- do not install system dependencies, I will do so manually; stay within this project folder


# THE API
- create a typescript/node/fastify api
- use an .nvmrc file to set the node version for the project, and also set it in the package.json file
- use node 24
- use typescript 5.9
- keep source code in the `src/` folder
- use eslint for the linter, with a modern best-practices third party ruleset (don't create your own ruleset)
- use Prettier for the code formatter
- create a `.env.example` file, that will be added to source control, but add `.env` to `.gitignore`
  - this can be copied to `.env` for running locally
  - `.env` can then be sourced in the terminal in order to import environment variables
  - the keys (i.e. names) of all environment variables required by the app should be defined in `.env.example`, and try to group them sensibly using newlines and comments
- create `hooks` folder and keep all git hooks in there
  - create a `commit_check.sh` script that will fail if linting/formatting/unit-test errors are found
    - use strict shell error checking
    - make it executable (`chmod +x`)
  - create a git hook that will call `commit_check.sh` and fail to commit code if the script returns errors
- compile code into the `build/` folder, and add `build/` to `.gitignore`


# SCHEMA
- the api endpoints must be defined by a static schema that is source-controlled
- create a `src/schema.json` file for this purpose
- set `{ "version": "0.9.0" }` as the version in the schema file
- register the schema globally with fastify (e.g. `fastify.addSchema()`)
- allow validation of responses to be conditional, based on an environment variable
  - this way it can be enabled during integration tests, but disabled in production (for performance, if necessary)


# ENDPOINTS
- expose a single hello-world GET endpoint
- define it in `src/schema.json`, and validate requests and responses (conditional, as mentioned above)


# UNIT TESTS
- use jest for unit tests
- keep the jest config in a dedicated `jest.config.js` (i.e. outside of the package.json file)
- in `src/`, and in each of it's subfolders, create a `__tests__` folder, and keep unit tests in there
- match code filenames with equivalent `.spec.ts` test files (e.g. `src/main.ts` => `src/__tests__/main.spec.ts`)
- create a unit test for the hello-world GET endpoint
