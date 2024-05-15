start: front-end-start contract-start

build: front-end-build contract-build

dev: contract-start local-front-end-dev 

install: front-end-install contract-install

# front-end
front-end-install:
	cd front-end && yarn

front-end-dev:
	cd front-end && yarn run dev


front-end-start:
	cd front-end && yarn start

front-end-build:
	cd front-end && yarn run build

# Contracts
contract-install:
	cd contracts && cargo build

contract-start: 
	yarn fuels dev

contract-build:
	yarn fuels build

local-node-run:
	fuel-core run --chain ./chainConfig.json --db-type in-memory

local-node-deploy:
	yarn fuels deploy

typegen:
	yarn fuels typegen

fetch-contract-id:
	@echo Fetching Token Streaming Contract ID...
	@cd contracts && forc contract-id 2>&1 | grep "Contract id:" | awk '{print $$NF}' > ../.local_contract_id

local-front-end-dev: 
	yarn dev

integration_test:
	cd contracts && cargo test

