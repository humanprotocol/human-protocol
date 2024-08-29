import { AreaChart } from '@components/Charts';
import Tabs from '@mui/material/Tabs';
import TabPanel from '@mui/lab/TabPanel';
import Tab from '@mui/material/Tab';
import { useState } from 'react';
import TabContext from '@mui/lab/TabContext';
import Typography from '@mui/material/Typography';
import PageWrapper from '@components/PageWrapper';
import Breadcrumbs from '@components/Breadcrumbs';

type graphType = 'bucketed';

const Graph = () => {
	const [graphType, setGraphType] = useState<graphType>('bucketed');
	const handleGraphTypeChange = (_: unknown, newValue: graphType) => {
		setGraphType(newValue);
	};

	return (
		<PageWrapper displaySearchBar className="standard-background">
			<Breadcrumbs title="Charts" />
			<TabContext value={graphType}>
				<Tabs
					textColor="primary"
					sx={{ marginBottom: 2 }}
					value={graphType}
					onChange={handleGraphTypeChange}
					aria-label="chart-tabs"
				>
					<Tab
						sx={{
							width: { xs: '50%', sm: 'auto' },
						}}
						label={<Typography fontWeight={600}>Bucketed</Typography>}
						value="bucketed"
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
			</TabContext>
		</PageWrapper>
	);
};

export default Graph;
