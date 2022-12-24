clean-package:
	rm -rf build contracts dist *.egg-info

build-contracts:
	./scripts/build-contracts.sh

format:
	pipenv run black .

run-test:
	make build-contracts
	./scripts/run-test.sh

build-package:
	make clean-package
	make build-contracts
	python3 setup.py sdist bdist_wheel --version

generate-html-docs:
	./scripts/generate-docs.sh --format html
