import { useEffect } from 'react';

import Breadcrumbs from '@/components/Breadcrumbs';
import { AreaChart } from '@/components/Charts';
import PageWrapper from '@/components/PageWrapper';
import { useGraphPageChartParams } from '@/utils/hooks/use-graph-page-chart-params';

const Graph = () => {
  const { revertToInitialParams } = useGraphPageChartParams();

  useEffect(() => {
    revertToInitialParams();
  }, [revertToInitialParams]);

  return (
    <PageWrapper className="standard-background">
      <Breadcrumbs title="Charts" />
      <AreaChart />
    </PageWrapper>
  );
};

export default Graph;
