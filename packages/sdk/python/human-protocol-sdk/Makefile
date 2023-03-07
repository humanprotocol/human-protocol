clean-package:
	rm -rf build contracts dist *.egg-info

build-contracts:
	./scripts/build-contracts.sh

format:
	pipenv run black .

start-minio:
	docker compose -f ./minio/docker-compose.yml up -d

stop-minio:
	docker compose -f ./minio/docker-compose.yml down -v

run-test:
	make build-contracts
	make start-minio
	./scripts/run-test.sh
	make stop-minio

build-package:
	make clean-package
	make build-contracts
	python3 setup.py sdist bdist_wheel

generate-html-docs:
	./scripts/generate-docs.sh --format html
