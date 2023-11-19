import { Box, Button, Pagination, Typography } from '@mui/material';
import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { DeployedCampaign } from '../../types';
import bagImg from 'src/assets/bag.png';
import Campaigns from 'src/components/Campaigns/Campaign';
import { CreateCampaignModal } from 'src/components/Campaigns/Create/CreateCampaign';
import { EmptyCampaign } from 'src/components/Campaigns/EmptyCampaign';
import { InfoBoxes } from 'src/components/Campaigns/InfoBoxes';
import { NoCampaigns } from 'src/components/Campaigns/NoCampaigns';
import { useCampaignsPolling } from 'src/hooks/useCampaignsPolling';
// import { FundCampaignModal } from 'src/components/Campaigns/Fund/FundCampaign';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const { campaigns } = useCampaignsPolling();
  const [createCampaignModalOpen, setCreateCampaignModalOpen] = useState(false);
  const [myCampaigns, setMyCampaigns] = useState(Array<DeployedCampaign>);
  // const [fundCampaignModalOpen, setfundCampaignModalOpen] = useState(false);
  const handleClickCreate = () => {
    setCreateCampaignModalOpen(true);
  };

  useEffect(() => {
    const filteredCamps = campaigns.filter((item) => {
      return item.manifest.requesterDescription === address;
    });
    setMyCampaigns(filteredCamps);
  }, [campaigns, isConnected]);

  const data = [
    { title: 'Rewards Paid', value: '$ 23,000' },
    { title: 'Total Liquidity Provided', value: '$ 1,000,000' },
    { title: 'Volume Traded', value: '$ 99,000' },
    { title: 'Number of Active Campaigns', value: '50' },
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
          Dashboard
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
          <Typography variant="h5">My Campaigns</Typography>
        </Box>
        {!isConnected ? (
          <EmptyCampaign />
        ) : myCampaigns.length > 0 ? (
          <Campaigns campaigndata={myCampaigns} />
        ) : (
          <NoCampaigns message="At the moment you are not running any campaign." />
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
