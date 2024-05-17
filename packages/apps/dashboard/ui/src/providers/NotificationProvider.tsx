import { Alert, AlertColor, AlertTitle, Snackbar } from '@mui/material';
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from 'react';

type NotificationContextData = {
  showMessage: (title: string, content: string, severity?: AlertColor) => void;
  hideMessage: () => void;
};

const NotificationContext = createContext<NotificationContextData>(
  {} as NotificationContextData
);

export const NotificationProvider: FC<PropsWithChildren> = ({ children }) => {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  const showMessage = (
    title: string,
    content: string,
    severity: AlertColor = 'info'
  ) => {
    setTitle(title);
    setContent(content);
    setSeverity(severity);
  };

  const hideMessage = () => {
    setTitle('');
    setContent('');
    setSeverity('info');
  };

  return (
    <NotificationContext.Provider value={{ showMessage, hideMessage }}>
      <Snackbar
        open={!!title.length}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={10000}
        onClose={hideMessage}
      >
        <Alert
          variant="filled"
          severity={severity}
          sx={{ width: '100%' }}
          onClose={hideMessage}
        >
          <AlertTitle>{title}</AlertTitle>
          {content}
        </Alert>
      </Snackbar>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotification must be used within an NotificationProvider'
    );
  }

  return context;
};
