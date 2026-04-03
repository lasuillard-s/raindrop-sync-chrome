FROM mcr.microsoft.com/devcontainers/typescript-node:24-trixie

USER root:root

SHELL ["/bin/bash", "-c"]

# Install core tools
RUN apt-get update && apt-get install --no-install-recommends -y \
    curl \
    fonts-noto \
    git \
    gnupg2 \
    make \
    python3-pip \
    xauth \
    xvfb \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && rm -rf /var/lib/apt/lists/*

# Add Google APT repository
RUN ARCH=$(dpkg --print-architecture) \
    && curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor --output /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=${ARCH} signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/chrome.list

# Install core tools
RUN apt-get update && apt-get install --no-install-recommends -y \
    google-chrome-stable \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && rm -rf /var/lib/apt/lists/*
