export const gqlFetch = (
  url: string,
  query: string,
  variables?: any,
  headers?: any
) =>
  url && url.length
    ? fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ query, variables }),
      })
    : Promise.reject(new Error('No URL provided'));
