format:
	pipenv run black . --check

run-test:
	cd ../../../../
	yarn workspace @human-protocol/core local &

	sleep 5
	yarn workspace @human-protocol/core deploy:local

	pipenv run python -m unittest
