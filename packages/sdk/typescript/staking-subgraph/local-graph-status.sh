#!/bin/sh

GRAPHQL_URL="http://localhost:8030/graphql"


node_health() {
  RESPONSE_BODY=$(curl -s -X POST "$GRAPHQL_URL" -H 'Content-Type: application/json' --data '{"query": "{ version { version } }"}')
  VERSION=$(echo "$RESPONSE_BODY" | grep -o '"version":"[^"]*"' | awk -F'"' '{print $4}')

  if [ -n "$VERSION" ]; then
    echo "Graph node is healthy. Version is $VERSION"
    exit 0
  else
    echo "Graph node is not healthy"
    exit 1
  fi
}

subgraph_health() {
  if [ -z "$SUBGRAPH_NAME" ]; then
    echo "Error: SUBGRAPH_NAME environment variable is not set"
    exit 1
  fi

  RESPONSE_BODY=$(curl -s -X POST "$GRAPHQL_URL" -H 'Content-Type: application/json' --data "{ \"query\": \"{indexingStatusForCurrentVersion(subgraphName: \\\"$SUBGRAPH_NAME\\\") { health } }\" }")
  STATUS=$(echo "$RESPONSE_BODY" | grep -o '"health":"[^"]*"' | awk -F'"' '{print $4}')

  if [[ "$STATUS" == "healthy" ]]; then
    echo "Subgraph is healthy"
    exit 0
  else
    echo "Subgraph is not healthy: $STATUS"
    exit 1
  fi
}

# Call the function passed as the first argument
"$@"
