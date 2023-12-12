FROM python:3.10

WORKDIR /app

RUN apt-get update -y && \
    pip install poetry


COPY pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

COPY . .
COPY docker/test/.env src/.env

# delay needed to wait for doccano_backend, as they have no proper healthcheck option
CMD sleep 10 && pytest