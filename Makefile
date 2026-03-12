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
	git config core.hooksPath hooks
	rm -rf build && mkdir build
	npm ci

## build: 🔨 compile
.PHONY: build
build:
	$(call pp,NB assuming `make init` has been called)
	npm run build

## run: 🏃‍♂️ run the app
.PHONY: run
run:
	npm run start

## test: 🧪 run unit tests
.PHONY: test
test:
	npm run test
# TODO: coverage

## load: 🏎️ run load tests
.PHONY: load
load:
#	npm run load

## tidy: 🧹 tidy things up before committing code
.PHONY: tidy
tidy:
	npm run lint
	npm run format

# CONTAINERISATION RECIPES ----------------------------------------------------

## docker: 🚢 create an app docker image
.PHONY: docker
docker:
	docker build .
