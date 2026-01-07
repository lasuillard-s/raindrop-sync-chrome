#!/usr/bin/env --split-string make --makefile

MAKEFLAGS += --warn-undefined-variable --no-builtin-rules --silent
.DEFAULT_GOAL := help
.DELETE_ON_ERROR:
.SUFFIXES:

SHELL := bash
.ONESHELL:
.SHELLFLAGS := -o errexit -o nounset -o pipefail -c


help: Makefile  ## Show this help message
	@grep -E '(^[a-zA-Z_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'


# =============================================================================
# Common
# =============================================================================
install:  ## Install deps and tools
	yarn install
	yarn run playwright install --with-deps
.PHONY: install

init:  ## Initialize the project workspace
	pre-commit install --install-hooks
	cp --no-clobber .env.example .env
.PHONY: init

update:  ## Update deps and tools
	yarn upgrade
	pre-commit autoupdate
.PHONY: update

# Note, --user-data-dir flag is required for debugger to work properly
# https://stackoverflow.com/questions/56326924/debugging-a-chrome-instance-with-remote-debugging-port-flag
browser:  ## Launch browser with extensions loaded
	dotenvx run -- google-chrome \
		--no-first-run \
		--disable-gpu \
		--load-extension="${PWD}/dist" \
		--no-sandbox \
		--remote-debugging-port=9222 \
		--user-data-dir=./chrome-dev-profile \
		--enable-logging \
		--v=1 \
		--log-file=./chrome.log
.PHONY: browser

run:  ## Run browser with development server
	dotenvx run -- yarn run concurrently \
		--kill-others \
		--kill-signal SIGKILL \
		--raw \
		"yarn run dev" \
		"$(MAKE) browser"
.PHONY: run


# =============================================================================
# CI
# =============================================================================
ci: lint test e2e  ## Run CI tasks
.PHONY: ci

fmt:  ## Run autoformatters
	yarn run prettier --list-different --write .
	yarn run eslint --fix .
.PHONY: fmt

lint:  ## Run all linters
	yarn run prettier --check .
	yarn run eslint .
	yarn run tsc --noEmit
.PHONY: lint

test:  ## Run tests
	yarn run test
.PHONY: test

build:
	yarn run build
.PHONY: build

e2e: build  ## Run e2e tests
	yarn run e2e-docker --update-snapshots
.PHONY: e2e


# =============================================================================
# Handy Scripts
# =============================================================================
clean:  ## Remove temporary files
	rm --recursive --force coverage/ junit.xml .svelte-kit/ dist/ .tmp/ playwright-report/ dummy-non-existing-folder/
	find . -path '*/__snapshots__*' -delete
	find . -path "*.log*" -delete
.PHONY: clean
