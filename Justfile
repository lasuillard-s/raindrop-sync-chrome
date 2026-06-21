_default:
    just --list

# Install deps and tools
install:
    yarn install
    yarn exec -- playwright install --with-deps chromium

# Update deps and tools
update:
    yarn upgrade
    pre-commit autoupdate

alias up := update

# =============================================================================
# Development
# =============================================================================

# Run all checks
ci: (format "yes") lint test e2e

# Autoformat code
[arg("check", long="check", value="yes")]
format check="no":
    yarn run {{ if check == "yes" { "fmt:check" } else { "fmt" } }}

alias fmt := format

# Run all linters
lint:
    yarn run lint
    yarn run typecheck

# Run all tests
test:
    yarn run test:all

# Run end-to-end tests
e2e:
    yarn run e2e-docker

# Apply autofixes
fix:
    yarn run lint:fix
    yarn run fmt

# Build extension
build:
    yarn run build

[private]
_IS_CONTAINER := `[[ -n "${CONTAINER:-}" ]] && echo "yes" || echo "no"`

# NOTE: --user-data-dir flag is required for debugger to work properly; https://stackoverflow.com/questions/56326924/debugging-a-chrome-instance-with-remote-debugging-port-flag
# Launch browser via Playwright (--load-extension to load extension)
[arg("load-extension", long="load-extension", value="yes")]
browser load-extension="no":
    #!/usr/bin/env bash
    cft_path="$(node --eval 'const { chromium } = require("playwright"); console.log(chromium.executablePath());')"
    "$cft_path" \
        --no-first-run \
        {{ if _IS_CONTAINER == "yes" { "--no-sandbox --disable-gpu --disable-dev-shm-usage" } else { "" } }} \
        {{ if load-extension == "yes" { "--load-extension=./dist --disable-extensions-except=./dist" } else { "" } }} \
        --remote-debugging-port=9222 \
        --user-data-dir=./.chromium-user-data \
        --enable-logging \
        --v=1 \
        --log-file=./chromium.log

# Run development server (--browser to run browser concurrently)
[arg("browser", long="browser", value="yes")]
run browser="no":
    #!/usr/bin/env bash
    if [ "{{ browser }}" = "yes" ]; then
        yarn exec -- concurrently \
            --kill-others \
            --kill-signal SIGKILL \
            --raw \
            "yarn run dev" \
            "just browser --load-extension"
    else
        yarn run dev
    fi

# =============================================================================
# Utility
# =============================================================================

# Remove temporary files
clean:
    rm --recursive --force \
        coverage/ \
        junit.xml \
        .svelte-kit/ \
        dist/ \
        .tmp/ \
        playwright-report/ \
        dummy-non-existing-folder/
    find . -path '*.log*' -delete
