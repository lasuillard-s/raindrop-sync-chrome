FROM mcr.microsoft.com/devcontainers/typescript-node:4.0.9-24-trixie

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
