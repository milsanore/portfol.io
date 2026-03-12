# INTRO
- the aim of this prompt is to create an excellent, maintainable, enterprise-grade, application skeleton
- do not install system dependencies, I will do so manually; stay within this project folder


# CONTAINERISATION AND DEPLOYMENT

## 1. DOCKER
- create a Dockerfile with matching system dependencies as local, so that the application can be built and run with consistent dependencies
- make it a two-stage file, i.e. the first stage builds the app, the second stage runs the app (with no dev dependencies)
- keep the production container lean (e.g. use alpine, or an alternative lean container)

## 2. DOCKER COMPOSE
- create a docker-compose file that spins up containers for the app and the latest postgres

## 3. KUBERNETES
- the aim is to run the application in k8s locally, so that we can test additional prod behaviour in the future (e.g. istio, networking, DNS resolution, resource constraints, HPA, etc)
- create a `deployment/helm` folder
- in there, create a basic helm chart that can deploy the app to the k8s cluster that ships with docker-desktop
- use skaffold (and a `skaffold.yaml`) file for file-watch-style deployment to k8s
- the app running in k8s will need to call out to the postgres database running on localhost (via docker compose)
  - i.e. we use docker-compose to start postgres, then connect to it from the node app running in k8s
- if it's neat, try to keep one `values.yaml` file per environment inside the `deployment/k8s` folder
- e.g. `deployment/k8s/values.sbx.yaml`, `deployment/k8s/values.int.yaml`, `deployment/k8s/values.prod.yaml`, etc
