export ENVIRONMENT=production

alembic upgrade head
python run.py