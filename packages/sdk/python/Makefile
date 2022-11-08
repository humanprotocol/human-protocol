format:
	pipenv run black .

build-contracts:
	./scripts/build-contracts.sh

run-test:
	make build-contracts
	./scripts/run-test.sh

generate-html-docs:
	./scripts/generate-docs.sh --format html
