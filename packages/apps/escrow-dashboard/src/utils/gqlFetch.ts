export const gqlFetch = (
  url: string,
  query: string,
  variables?: any,
  headers?: any
) =>
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  });
