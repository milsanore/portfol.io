# PORTFOL.IO

PoC of a portfolio-tracking api

# SYSTEM DEPENDENCIES
- node 24 + npm

# DEV SYSTEM DEPENDENCIES
- make
- nvm
- docker
- kubernetes
- helm
- skaffold
- k6

# GETTING STARTED
`make init`
`make run`

# LOAD TEST
- run `make run` in one terminal, and `make load` in another (NB: you will need `k6` installed)
- (note the 2-3x performance difference in the load test with LOG_LEVEL set to error)

# AI
- the majority of the code is AI generated, but proof-read
- the bulk of the intellectual property is in the `prompts/` folder
- the .md files in `prompts/` are hand-written

# DESIGN DECISIONS
see [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md)

# TODO
- add a Makefile
- configure sonarcloud
- configure the conventional commit regex in the github project
- middleware (e.g. helmet/CORS/authentication/etc)
- if the build pipeline is slow, create a custom build image and host it in ghcr
  - e.g. the build image for my trader.cpp app: https://github.com/milsanore/trader.cpp/pkgs/container/tradercppbuild
- semantics
  - boolean naming convention
  - snake_case in general
- observability
- node file watcher (nodemon)
- module in package.json / tsconfig
- add coverage numbers to jest run
- tsc debug/release builds, source maps
