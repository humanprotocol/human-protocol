setup:
	pipenv install --dev

clean-package:
	rm -rf build artifacts dist *.egg-info .eggs

build-contracts:
	./scripts/build-contracts.sh

format:
	pipenv run black .

unit-test:
	make build-contracts
	./scripts/run-unit-test.sh

run-test:
	make unit-test

build-package:
	make clean-package
	make build-contracts
	python3 setup.py sdist bdist_wheel

publish-package:
	make build-package
	twine upload dist/* --skip-existing

run-example:
	pipenv run python3 example.py
