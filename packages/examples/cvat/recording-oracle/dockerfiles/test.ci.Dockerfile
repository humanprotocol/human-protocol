FROM python:3.10

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y jq libgl1  libsm6 libxext6 && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache 'poetry==1.8.5'

COPY libs ./libs

COPY pyproject.toml poetry.lock ./

RUN --mount=type=cache,target=/root/.cache \
    poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --no-root

RUN python -m pip uninstall -y poetry pip

COPY . .

RUN rm -f ./src/.env

CMD ["pytest"]