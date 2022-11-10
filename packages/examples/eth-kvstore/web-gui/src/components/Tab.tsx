import React, { useState, Suspense } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SwipeableViews from 'react-swipeable-views';
import GeneratePGP from './GeneratePGP'
import KeyValue from './KeyValue'
import Decrypt from './Decrypt'
import YourPublicKey from './YourPublicKey'

function TabPanel(props:any) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {children}
    </div>
  );
}
export default function CenteredTabs() {
  const [value, setValue] = useState(0);

  const handleChange = (event:any, newValue:number) => {
    setValue(newValue);
  };
  const handleChangeIndex = (index:number) => {
    setValue(index);
  };
  return (
    <Box className="boxBg">
      <Tabs value={value} onChange={handleChange} variant="fullWidth" >
        <Tab label="Generate Public Key" ></Tab>
        <Tab label="Your Public Key" />
        <Tab label="Key Value Store" />
        <Tab label="Decrypt" />
      </Tabs>
      <SwipeableViews

        index={value}
        onChangeIndex={handleChangeIndex}
      >
        <TabPanel value={value} index={0}  >
          <GeneratePGP />
        </TabPanel>
        <TabPanel value={value} index={1} className="height100" >
          <YourPublicKey />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <KeyValue />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <Decrypt />
        </TabPanel>
      </SwipeableViews>
    </Box>
  );
}
