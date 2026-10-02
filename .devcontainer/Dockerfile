FROM node:22-bookworm

USER root
RUN apt-get update && apt-get install -y --no-install-recommends bash ca-certificates curl git unzip python3 python3-venv build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /workspace && chown node:node /workspace
WORKDIR /workspace
USER node

# Source is mounted at runtime. Credentials and personal data never enter image layers.
CMD ["sleep", "infinity"]
