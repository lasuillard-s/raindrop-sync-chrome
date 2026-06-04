#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset

: '
Set up the environment for end-to-end testing using Docker Compose.

Logs will be saved to e2e/run-*.log files.
'

root_dir="$(realpath "$(dirname "${0}")/..")"
e2e_dir="${root_dir}/e2e"
log_file="${e2e_dir}/run-$(date +"%Y%m%dT%H%M%S").log"

cd "$e2e_dir"

# Get the Playwright version
export PLAYWRIGHT_VERSION="$(yarn exec --silent -- playwright --version | awk '{print $2}')"
echo "Using Playwright version ${PLAYWRIGHT_VERSION}"

# Print the docker compose configuration for debugging
docker compose config >> "$log_file"

# Pull the base images and build the services, while logging the output.
docker compose pull --ignore-buildable --include-deps >> "$log_file" 2>&1
docker buildx bake \
    --file ./docker-compose.yaml \
    --file ./docker-bake.json \
    --allow=fs.read=.. \
    --load \
    2>&1 | tee --append "$log_file"

# Register a cleanup function
function cleanup() {
    docker compose logs --timestamps >> "$log_file"
    docker compose down
}
trap cleanup EXIT

# Start the services and wait for them to be healthy
docker compose up --wait --wait-timeout 600

# Run the e2e tests, passing specified host environment variables to the container
pass_envvars=( CI )
docker compose exec \
    $(for var in "${pass_envvars[@]}"; do echo "--env ${var}"; done) \
    playwright \
    yarn exec --silent -- playwright "$@" \
    | tee --append "$log_file"
