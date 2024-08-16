FROM python:3.10

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y jq ffmpeg libsm6 libxext6 && \
    pip install poetry

COPY pyproject.toml poetry.lock ./

RUN --mount=type=cache,target=/root/.cache poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

CMD ["pytest", "-W", "ignore::DeprecationWarning", "-W", "ignore::RuntimeWarning", "-W", "ignore::UserWarning"]