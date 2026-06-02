FROM mcr.microsoft.com/devcontainers/typescript-node:4.0.9-24-trixie@sha256:e36c918ec9c679c18451231e277ea9122c00a097fb6e4a23c8c3d35bf08bbc3a

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
