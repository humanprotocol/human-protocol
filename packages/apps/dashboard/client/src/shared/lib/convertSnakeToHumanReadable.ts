const convertSnakeToHumanReadable = (string: string) => {
  return string
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default convertSnakeToHumanReadable;
