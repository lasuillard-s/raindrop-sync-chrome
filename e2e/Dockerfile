FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /workspace

VOLUME /workspace/node_modules

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
