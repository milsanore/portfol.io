# PORTFOL.IO

- poc of a portfolio-tracking api
- the ip is in the `prompts` folder

# BUILD & RUN
`npm run build && npm run start` (see the package.json scripts block)

# DESIGN DECISIONS
see [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md)

# NOTES
- the .md files in prompts/ are hand-written

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
- type: module in package.json
