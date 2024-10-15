FROM python:3.10

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y jq ffmpeg libsm6 libxext6 pipx && \
    pipx install --pip-args='--no-cache' poetry==1.8.4

COPY pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root \
    && poetry cache clear pypi --all

# TODO: Consider moving to multistage builds and system cache for faster builds and smaller images.
COPY . .

CMD ["sh", "./bin/start_dev.sh"]
