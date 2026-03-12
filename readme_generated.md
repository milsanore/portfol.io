# portfol.io — Developer Guide

## System Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | 24.x (see `.nvmrc`) | Runtime and build |
| [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/) | Latest | Containerised runs and local dependencies |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest (Kubernetes enabled) | Local Kubernetes cluster |
| [Helm](https://helm.sh/docs/intro/install/) | v3+ | Kubernetes package management |
| [Skaffold](https://skaffold.dev/docs/install/) | Latest | File-watch deployment to local k8s |
| [k6](https://k6.io/docs/getting-started/installation/) | Latest | Load testing |

> **Tip:** Run `make init` after cloning to bootstrap the project (installs dependencies, sets up git hooks, and creates a local `.env`).


## Running the App

### Native (Node.js)

```bash
make init   # first time only
make run
```

The app will be available at `http://localhost:3000`.

### Containerised (Docker Compose)

Starts the app and PostgreSQL:

```bash
make compose
```

To start dependencies only (e.g. when running the app natively or via k8s):

```bash
make compose-deps
```

Stop all services:

```bash
make compose-stop
```

### Local Kubernetes (Docker Desktop)

Requires Docker Desktop with Kubernetes enabled. Starts the app in the local k8s cluster with file watching — any source change triggers a rebuild and redeploy.

Start PostgreSQL first (the k8s app connects to it via `host.docker.internal`):

```bash
make compose-deps
```

Then deploy to k8s:

```bash
make skaffold
```

The app will be port-forwarded to `http://localhost:3000`.


## Running Tests

### Unit Tests

Runs all unit tests with coverage. No external dependencies required.

```bash
make test
```

Coverage output is written to `coverage/lcov.info` and can be visualised in VS Code with the [Coverage Gutters](https://marketplace.visualstudio.com/items?itemName=ryanluker.vscode-coverage-gutters) extension.

### Integration Tests

Requires the app to be running (e.g. via `make compose` or `make compose-deps && make run`).

```bash
make compose        # start app + postgres
make integration
```

Target URL defaults to `http://localhost:3000`. Override with the `BASE_URL` environment variable.

### Load Tests

Requires the app to be running and [k6](https://k6.io) installed.

```bash
make compose        # start app + postgres
make load
```

Runs 20 virtual users for 30 seconds (1s ramp-up + 29s sustained). Exits non-zero if any checks fail.

Target URL defaults to `http://localhost:3000`. Override with `BASE_URL`:

```bash
BASE_URL=http://my-env:3000 make load
```
