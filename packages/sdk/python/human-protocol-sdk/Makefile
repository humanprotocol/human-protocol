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

generate-autodoc:
	pipenv run sphinx-apidoc -l -e -M -o ./docs ./human_protocol_sdk */gql && rm -rf ./docs/modules.rst

clean-doc-md:
	rm -rf docs/_build && rm -rf ../../../../docs/sdk/python/*

generate-doc-md:
	make clean-doc-md && cd docs && make markdown && cp -r _build/markdown/* ../../../../../docs/sdk/python
