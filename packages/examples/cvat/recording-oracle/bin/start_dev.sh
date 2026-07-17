export ENVIRONMENT=development

alembic upgrade head
python -m src.entrypoints.run