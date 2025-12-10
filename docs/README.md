# SDK Docs workflow

## Prerequisites
- `pip install -r docs/requirements.txt`
- `yarn install`
- `yarn build:libs`

## Local preview
- TypeScript docs: `mkdocs serve -f docs/mkdocs-ts.yaml`
- Python docs: `mkdocs serve -f docs/mkdocs-python.yaml`

## Deploying a new version (mike)
- TypeScript:  
  `yarn workspace @human-protocol/sdk build:doc`  
  `mike deploy -F ./docs/mkdocs-ts.yaml --deploy-prefix docs/ts [VERSION]`  
  `mike set-default -F ./docs/mkdocs-ts.yaml --deploy-prefix docs/ts [VERSION]`
- Python:  
  `mike deploy -F ./docs/mkdocs-python.yaml --deploy-prefix docs/python [VERSION]`  
  `mike set-default -F ./docs/mkdocs-python.yaml --deploy-prefix docs/python [VERSION]`

## Deleting a deployed version
- TypeScript: `mike delete -F ./docs/mkdocs-ts.yaml --deploy-prefix docs/ts [VERSION]`
- Python: `mike delete -F ./docs/mkdocs-python.yaml --deploy-prefix docs/python [VERSION]`

## Landing page (docs/index.html)
- If you edit `docs/index.html`, apply the change both on your working branch and on `gh-pages`. 

NEVER MERGE THE BRANCHES: `gh-pages` only contains docs builds, not the monorepo code.

## Serving static files
- Serve only `index.html` (SDK docs won’t load): from `docs/`, run  
  `python -m http.server 8080 --bind 127.0.0.1`
- Serve the full published docs: create a mike deployment, switch to the `gh-pages` branch, go to `docs/`, then run  
  `python -m http.server 8080 --bind 127.0.0.1`

## Repository structure (docs)
- `docs/index.html`: Static landing page that links to SDK docs (TS/Python).
- `docs/mkdocs-ts.yaml`: MkDocs config for the TypeScript site (deploys under `docs/ts` via mike).
- `docs/mkdocs-python.yaml`: MkDocs config for the Python site (deploys under `docs/python` via mike).
- `docs/ts/`: TypeScript site output; versioned builds live under `docs/ts/<version>` with per-version assets in `docs/ts/<version>/assets/`.
- `docs/python/`: Python site output (if published); versioned builds live under `docs/python/<version>`.
- `docs/overrides/`: Shared MkDocs theme overrides and assets (logo/header partials and images).
