export interface CommonProps {
  cardMaxWidth?: string;
}

export interface ErrorMessageProps extends CommonProps {
  errorMessage: string;
  children?: never;
}

export interface ChildErrorProps extends CommonProps {
  errorMessage?: never;
  children: React.ReactElement;
}
