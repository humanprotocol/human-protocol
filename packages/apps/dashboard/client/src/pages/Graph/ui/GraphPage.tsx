import { useEffect } from 'react';

import { AreaChart } from '@/components/Charts';
import Breadcrumbs from '@/shared/ui/Breadcrumbs';
import { useGraphPageChartParams } from '@/utils/hooks/use-graph-page-chart-params';
import PageWrapper from '@/widgets/page-wrapper';

const GraphPage = () => {
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

export default GraphPage;
