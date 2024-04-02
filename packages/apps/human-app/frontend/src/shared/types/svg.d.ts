declare module '*.svg' {
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  // eslint-disable-next-line import/no-default-export -- export vite config
  export default ReactComponent;
}

declare module '*.svg?url' {
  const content: string;
  // eslint-disable-next-line import/no-default-export -- export vite config
  export default content;
}
