# INTRO
- the aim of this prompt is to create an excellent, maintainable, enterprise-grade, application skeleton
- do not install system dependencies, I will do so manually; stay within this project folder


# CICD
- create a github action for feature branches that will:
  - check formatting and linting - fail the build if they fail
  - run unit tests, fail the build if they fail
    - optionally fail the build if unit test coverage decreases compared to master (skip if too complex)
  - run integration tests, fail the build if they fail
    - i.e. docker-in-docker
    - i.e. the build container needs to have docker installed, then run `docker compose up -d`, then run integration tests, then `docker compose down` 
  - run load tests, fail the build if they fail
    - i.e. same `docker compose up -d` approach + k6
    - to ensure some consistency, scope the CPU/memory resources of the build container to match the resources in the docker-compose file and k8s values
    - output the k6 result in the pipeline console
- create a github action for PRs to the master branch that will:
  - do everything that the feature branch does, plus:
  - validate that the PR's commit message adheres to conventional commits (see https://www.conventionalcommits.org/en/v1.0.0/)
- if you can keep the github action files inside `deployment/github` for consistency, that would be amazing
- if you can cache the content of node_modules between builds, in order to make the pipeline run faster, that would be great too


# LOCAL DEV
- create `.vscode/launch.json` that exposes targets for running the app, debugging the app, and running unit tests
- create a `.vscode/settings.json` file for linting and prettifying
- if you can configure coverage gutters - bonus points


# README
- create a `readme_generated.md` file that has sections for:
  - system dependencies
  - how to run the app locally (native and containerised)
  - how to run tests (unit, integration, load)
