FROM python:3.10

WORKDIR /app

RUN apt-get update -y && \
    apt-get install coinor-libcbc-dev -y && \
    pip install poetry


COPY pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

COPY . .
COPY docker/test/.env src/.env

CMD ["pytest", "-s"]
