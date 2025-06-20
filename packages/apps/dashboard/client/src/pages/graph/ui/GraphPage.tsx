import { useEffect } from 'react';

import AreaChart from '@/features/graph';
import useChartParamsStore from '@/features/graph/store/useChartParamsStore';
import Breadcrumbs from '@/shared/ui/Breadcrumbs';
import PageWrapper from '@/widgets/page-wrapper';

const Graph = () => {
  const { revertToInitialParams } = useChartParamsStore();

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
