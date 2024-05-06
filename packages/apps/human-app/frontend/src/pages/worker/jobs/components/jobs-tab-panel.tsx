import { Box } from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  activeTab: number;
}

export function TabPanel({ children, index, activeTab }: TabPanelProps) {
  return (
    <div
      aria-labelledby={`tabpanel-${index}`}
      hidden={activeTab !== index}
      id={`jobs-tabpanel-${index}`}
      role="tabpanel"
    >
      {activeTab === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}
