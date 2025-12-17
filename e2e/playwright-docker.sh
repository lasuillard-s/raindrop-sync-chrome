#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset

: '
Set up the environment for end-to-end testing using Docker Compose.

Logs will be saved to e2e-*.log files.
'

git_root="$(git rev-parse --show-toplevel)"
log_file="${git_root}/e2e-$(date +"%Y%m%dT%H%M%S").log"
pass_envvars=( CI )

cd "${git_root}/e2e"

# Variables for docker-compose
export PLAYWRIGHT_VERSION="$(yarn exec --silent -- playwright --version | cut -d' ' -f2)"

docker compose config >> "$log_file"

docker compose pull --ignore-buildable --include-deps >> "$log_file" 2>&1
docker buildx bake \
    --file ./docker-compose.yaml \
    --file ./docker-bake.json \
    --allow=fs.read=.. \
    --load \
    >> "$log_file" 2>&1

function cleanup() {
    docker compose logs --timestamps >> "$log_file"
    docker compose down
}
trap cleanup EXIT
docker compose up --wait --wait-timeout 600

docker compose exec \
    $(for var in "${pass_envvars[@]}"; do echo "--env $var"; done) \
    playwright \
    yarn exec --silent playwright "$@" \
    | tee --append "$log_file"
