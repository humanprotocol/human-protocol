format:
	pipenv run black .

build-contracts:
	yarn workspace @human-protocol/core compile
	cp -r ../../core/artifacts/contracts .

run-test:
	yarn workspace @human-protocol/core local &

	sleep 5
	yarn workspace @human-protocol/core deploy:local

	cp -r ../../core/artifacts/contracts .

	pipenv run python -m unittest
