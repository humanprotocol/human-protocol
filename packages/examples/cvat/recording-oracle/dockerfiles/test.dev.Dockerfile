# Local dev test image: only dependencies are baked in; the source tree is bind-mounted at
# runtime by docker-compose.test.head.dev.yml. Skipping the source COPY keeps rebuilds fast when
# iterating locally. For CI / clean self-contained runs, use test.ci.Dockerfile instead.
FROM python:3.10

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y jq libgl1 libsm6 libxext6 && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache poetry

COPY pyproject.toml poetry.lock ./

COPY libs ./libs

RUN --mount=type=cache,target=/root/.cache \
    poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --no-root

RUN python -m pip uninstall -y poetry pip

CMD ["pytest"]
