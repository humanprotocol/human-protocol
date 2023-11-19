import { Box, Button, Pagination, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import bagImg from 'src/assets/bag.png';
import Campaigns from 'src/components/Campaigns/Campaign';
import { CreateCampaignModal } from 'src/components/Campaigns/Create/CreateCampaign';
import { EmptyCampaign } from 'src/components/Campaigns/EmptyCampaign';
import { InfoBoxes } from 'src/components/Campaigns/InfoBoxes';
import { NoCampaigns } from 'src/components/Campaigns/NoCampaigns';
import { useCampaignsPolling } from 'src/hooks/useCampaignsPolling';

export default function Participating() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const { campaigns } = useCampaignsPolling();
  const [createCampaignModalOpen, setCreateCampaignModalOpen] = useState(false);
  const handleClickCreate = () => {
    setCreateCampaignModalOpen(true);
  };
  const data = [
    { title: 'Total Rewards Earned', value: '3,450 HMT' },
    { title: 'Pending Rewards', value: '$ 493' },
    { title: 'Total Liquidity', value: '1,424 ETH' },
    { title: 'Number of Participating Campaigns', value: '3' },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItmes: 'center', mt: '50px' }}>
          <img src={bagImg} alt="bag" />
        </Box>
        <Typography variant="h4" fontWeight={600}>
          Participating
        </Typography>
      </Box>

      <Box>
        <InfoBoxes data={data} columns={4} />
      </Box>

      <Box sx={{ mt: '50px' }}>
        <Box
          sx={{
            mb: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5">Participating</Typography>
        </Box>
        {!isConnected ? (
          <EmptyCampaign />
        ) : (
          <NoCampaigns message="At the moment you are not participating in any campaign, please see below running campaigns to participate" />
        )}
      </Box>
      <Box sx={{ mt: '50px' }}>
        <Box
          sx={{
            mb: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5">All Campaigns</Typography>
          <Button
            sx={{ backgroundColor: 'secondary.light' }}
            size="large"
            variant="contained"
            onClick={handleClickCreate}
          >
            Launch Campaign
          </Button>
        </Box>
        <Campaigns campaigndata={campaigns} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={() => {
              navigate('/campaigns/allcampaigns');
            }}
            sx={{ borderColor: 'secondary.light' }}
            variant="contained"
          >
            View All
          </Button>
          <Pagination count={5} />{' '}
          {/* adjust count as per the number of pages */}
        </Box>
      </Box>
      <CreateCampaignModal
        open={createCampaignModalOpen}
        onClose={() => setCreateCampaignModalOpen(false)}
      />
    </Box>
  );
}
