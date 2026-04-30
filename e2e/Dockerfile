ARG PLAYWRIGHT_VERSION

FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION:?}-noble

WORKDIR /workspace

VOLUME /workspace/node_modules

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
