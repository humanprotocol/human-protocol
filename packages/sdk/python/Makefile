build-contracts:
	./scripts/build-contracts.sh

format:
	pipenv run black .

run-test:
	make build-contracts
	./scripts/run-test.sh

build-package:
	make build-contracts
	python3 setup.py sdist bdist_wheel

generate-html-docs:
	./scripts/generate-docs.sh --format html
