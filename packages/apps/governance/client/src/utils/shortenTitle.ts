const MAX_TITLE_LENGTH = 90

export const shortenTitle = (title: string): string => {
  if (title.length <= MAX_TITLE_LENGTH) {
    return title
  } else {
    return title.substring(0, MAX_TITLE_LENGTH) + '...'
  }
}
