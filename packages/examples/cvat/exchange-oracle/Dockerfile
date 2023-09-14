FROM python:3.10

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y jq && \
    pip install poetry

COPY pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

COPY . .

COPY ../../../sdk/python/human-protocol-sdk /lib/human-protocol-sdk

CMD ["sh", "./bin/start_dev.sh"]
