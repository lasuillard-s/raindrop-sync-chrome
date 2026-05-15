FROM mcr.microsoft.com/devcontainers/typescript-node:24-trixie@sha256:58cdebfe398bd451d5f51a567a00d9880691a17a93236d2be07354b80e6e289e

USER root:root

SHELL ["/bin/bash", "-c"]

# Install core tools
RUN apt-get update && apt-get install --no-install-recommends --yes \
    curl \
    fonts-noto \
    git \
    gnupg2 \
    make \
    python3-pip \
    xauth \
    xvfb
