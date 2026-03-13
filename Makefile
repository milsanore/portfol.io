#!make
SHELL:=/bin/bash

# ###############################################
# A set of execution recipes (all PHONY).
# In essence, a programmatic entrypoint into the app.
# Run `make` for help.
# ###############################################

# pp - pretty print function
yellow := $(shell tput setaf 3)
normal := $(shell tput sgr0)
define pp
	@printf '$(yellow)$(1)$(normal)\n'
endef

.PHONY: help
help: Makefile
	@echo " Choose a command to run:"
	@sed -n 's/^##//p' $< | column -t -s ':' | sed -e 's/^/ /'

## init: 🏌️ initialize the project
.PHONY: init
init:
	$(call pp,initializing project)
	test -e .env || cp .env.example .env
	git config core.hooksPath hooks
	rm -rf build && mkdir build
	npm ci
	npm run build
	npm run migrate:up

## build: 🔨 compile
.PHONY: build
build:
	$(call pp,NB assuming `make init` has been called)
	npm run build

## run: 🏃 run the app
.PHONY: run
run:
	npm run start

## test: 🧪 run unit tests
.PHONY: test
test:
	npm run test -- --coverage

## integration: 🧪+🧪 run integration tests
.PHONY: integration
integration:
	npm run test:integration

## load: 🏎️ run load tests
.PHONY: load
load:
	npm run test:load

## tidy: 🧹 tidy things up before committing code
.PHONY: tidy
tidy:
	npm run format
	npm run lint


# CONTAINERISATION RECIPES ----------------------------------------------------

## docker: 💿 create an app docker image
.PHONY: docker
docker:
	docker build . -t portfolio:latest

## compose: 🚢 start compose
.PHONY: compose
compose:
	docker compose -p portfolio up -d

## compose-deps: 🚢 start compose (dependencies only)
.PHONY: compose-deps
compose-deps:
	docker compose -p portfolio up -d postgres

## compose-stop: 🧊🚢 stop compose
.PHONY: compose-stop
compose-stop:
	docker compose -p portfolio stop

## skaffold: 🎁🏃 run the app in k8s (with a filewatcher)
.PHONY: skaffold
skaffold:
	skaffold dev
