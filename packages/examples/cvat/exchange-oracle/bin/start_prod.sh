export ENVIRONMENT=production

alembic upgrade head
python -m src.entrypoints.run