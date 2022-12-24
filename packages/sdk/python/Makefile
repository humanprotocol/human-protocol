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
	python3 setup.py --version 0.0.8 sdist bdist_wheel

generate-html-docs:
	./scripts/generate-docs.sh --format html
