import { LineChart, AreaChart } from '@components/Charts';
import Tabs from '@mui/material/Tabs';
import TabPanel from '@mui/lab/TabPanel';
import Tab from '@mui/material/Tab';
import { useState } from 'react';
import TabContext from '@mui/lab/TabContext';
import Typography from '@mui/material/Typography';
import PageWrapper from '@components/PageWrapper';

type graphType = 'bucketed' | 'cumulative';

const Graph = () => {
	const [value, setValue] = useState<graphType>('bucketed');

	const handleChange = (_: unknown, newValue: graphType) => {
		setValue(newValue);
	};
	return (
		<PageWrapper>
			<TabContext value={value}>
				<Tabs
					textColor="primary"
					sx={{ marginBottom: 2 }}
					value={value}
					onChange={handleChange}
					aria-label="chart-tabs"
				>
					<Tab
						label={<Typography fontWeight={600}>Bucketed</Typography>}
						value="bucketed"
					/>
					<Tab
						label={<Typography fontWeight={600}>Cumulative</Typography>}
						value="cumulative"
					/>
				</Tabs>
				<TabPanel
					sx={{
						p: 0,
					}}
					value="bucketed"
				>
					<AreaChart />
				</TabPanel>
				<TabPanel
					sx={{
						p: 0,
					}}
					value="cumulative"
				>
					<LineChart />
				</TabPanel>
			</TabContext>
		</PageWrapper>
	);
};

export default Graph;
