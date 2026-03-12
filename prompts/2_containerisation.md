# INTRO
- the aim of this prompt is to create an excellent, maintainable, enterprise-grade, application skeleton
- do not install system dependencies, I will do so manually; stay within this project folder


# CONTAINERISATION AND DEPLOYMENT

## 1. DOCKER
- create a Dockerfile with matching dependencies as local, so that the application can be built and run with consistent dependencies
- make it a two-stage file, i.e. the first stage builds the app and has all dependencies required to do so, the second stage is just for running the app with no dev dependencies
- keep it the production container lean (e.g. use alpine, or an alternative lean container)

## 2. DOCKER COMPOSE
- create a docker-compose file that spins up containers for the app, postgres, and the latest kafka (KRaft, no Zookeeper)

## 3. KUBERNETES
- the aim is to run the application in k8s locally, so that we can test additional prod behaviour
  - e.g. istio, networking (e.g. DNS), resource constraints, HPA, etc
- create a `deployment/helm` folder
- in there, create a basic helm chart that will work to deploy the app to the k8s setup that ships with docker-desktop
- the app running in docker-desktop k8s will need to call out to the postgres database running on the localhost in docker
  - i.e. we use docker-compose to start postgres and kafka, then connect to them from a node app running in k8s
- if it's neat, try to keep one `values.yaml` file per environment inside the `deployment/k8s` folder
- e.g. `deployment/k8s/values.sbx.yaml`, `deployment/k8s/values.int.yaml`, `deployment/k8s/values.prod.yaml`, etc
- use skaffold (and a `skaffold.yaml`) file for file-watch style deployment to k8s
