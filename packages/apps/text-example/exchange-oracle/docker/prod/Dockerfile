FROM python:3.10

WORKDIR /app

RUN apt-get update -y && \
    pip install poetry


COPY pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

COPY . .
COPY docker/prod/.env src/.env

CMD ["uvicorn", "src.main:exchange_oracle", "--reload"]