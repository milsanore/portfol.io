# INTRO
- the aim of this prompt is to create an excellent, maintainable, enterprise-grade, application skeleton
- do not install system dependencies, I will do so manually; stay within this project folder


# INTEGRATION TESTS
- my definition of "integration" test is: we really run the app, we really call endpoints, and we verify their responses
- create a `tests_integration` folder; in there:
- create a dedicated `jest.config.js` file for integration tests
  - i.e. a second jest project for tests where nothing will be mocked, i.e. real API calls will be made
- we can leverage docker-compose to really run the project, and then execute this second jest project to run integration tests
- create an integration test that calls the hello-world GET endpoint (should be at http://localhost:3000/hello) and verifies the result
- add a 'script' to the package.json file for running integration tests


# LOAD TEST
- use k6 as the load-testing engine
- create a `tests_load` folder; in there:
  - create a load test for the hello-world GET endpoint (should be at http://localhost:3000/hello)
  - use 20 VUs, go from 0 to 20 VUs in one second, and then run for 29s at 20 VUs
- it will run in a similar fashion to the integration tests
  - i.e. we use docker-compose to run the project, and then run k6
