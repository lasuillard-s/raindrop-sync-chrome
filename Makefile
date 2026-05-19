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
	yarn exec -- playwright install --with-deps chromium
.PHONY: install

init:  ## Initialize the project workspace
	pre-commit install --install-hooks
.PHONY: init

update:  ## Update deps and tools
	yarn upgrade
	pre-commit autoupdate
.PHONY: update

# Note, --user-data-dir flag is required for debugger to work properly
# https://stackoverflow.com/questions/56326924/debugging-a-chrome-instance-with-remote-debugging-port-flag
browser:  ## Launch Chrome for Testing with extension loaded
	cft_path="$$(node --eval 'const { chromium } = require("playwright"); console.log(chromium.executablePath());')"
	"$$cft_path" \
		--no-first-run \
		--disable-gpu \
		--load-extension="$(CURDIR)/dist" \
		--disable-extensions-except="$(CURDIR)/dist" \
		--no-sandbox \
		--remote-debugging-port=9222 \
		--user-data-dir="$(CURDIR)/chrome-dev-profile" \
		--enable-logging \
		--v=1 \
		--log-file="$(CURDIR)/chrome.log"
.PHONY: browser

# ? Some lifecycle events (e.g. onInstalled) are not triggered when extension is loaded, so this target is useful for testing such scenarios
browser-noext:  ## Launch the browser without loading the extension
	cft_path="$$(node --eval 'const { chromium } = require("playwright"); console.log(chromium.executablePath());')"
	"$$cft_path" \
		--no-first-run \
		--disable-gpu \
		--no-sandbox \
		--remote-debugging-port=9222 \
		--user-data-dir="$(CURDIR)/chrome-dev-profile" \
		--enable-logging \
		--v=1 \
		--log-file="$(CURDIR)/chrome.log"
.PHONY: browser-noext

run:  ## Run browser with development server
	yarn exec -- concurrently \
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
	yarn run fmt
.PHONY: fmt

fix:  ## Autofix issues
	yarn run lint:fix
.PHONY: fix

lint:  ## Run all linters
	yarn run fmt:check
	yarn run lint
	yarn run check
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

e2e-ui:  ## Open Playwright UI for interactive e2e testing
	yarn run e2e-docker:ui
.PHONY: e2e-ui

# =============================================================================
# Handy Scripts
# =============================================================================
clean:  ## Remove temporary files
	rm --recursive --force coverage/ junit.xml .svelte-kit/ dist/ .tmp/ playwright-report/ dummy-non-existing-folder/
	find . -path '*/__snapshots__*' -delete
	find . -path "*.log*" -delete
.PHONY: clean
