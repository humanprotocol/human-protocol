format:
	pipenv run black .

run-test:
	yarn workspace @human-protocol/core local &

	sleep 5
	yarn workspace @human-protocol/core deploy:local

	cp -r ../../core/artifacts/contracts .

	pipenv run python -m unittest
