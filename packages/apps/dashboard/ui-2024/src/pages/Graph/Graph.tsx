import { AreaChart } from '@components/Charts';
import { useEffect } from 'react';
import PageWrapper from '@components/PageWrapper';
import Breadcrumbs from '@components/Breadcrumbs';
import { useGraphPageChartParams } from '@utils/hooks/use-graph-page-chart-params';

const Graph = () => {
  const { revertToInitialParams } = useGraphPageChartParams();

  useEffect(() => {
    revertToInitialParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageWrapper className="standard-background">
      <Breadcrumbs title="Charts" />
      <AreaChart />
    </PageWrapper>
  );
};

export default Graph;
