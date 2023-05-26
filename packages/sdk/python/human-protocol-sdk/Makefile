clean-package:
	rm -rf build artifacts dist *.egg-info

build-contracts:
	./scripts/build-contracts.sh

format:
	pipenv run black .

unit-test:
	make build-contracts
	./scripts/run-unit-test.sh

e2e-start-minio:
	docker compose -f ./test/e2e/minio/docker-compose.yml up -d

e2e-stop-minio:
	docker compose -f ./test/e2e/minio/docker-compose.yml down -v

e2e-test:
	make build-contracts
	make e2e-start-minio
	./scripts/run-e2e-test.sh
	make e2e-stop-minio

run-test:
	make unit-test
	make e2e-test

build-package:
	make clean-package
	make build-contracts
	python3 setup.py sdist bdist_wheel
