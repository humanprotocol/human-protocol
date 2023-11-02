import { Box, Button, Pagination, Typography } from '@mui/material';
import { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { CampaignData } from '../../types';
import bagImg from 'src/assets/bag.png';
import Campaigns from 'src/components/Campaigns/Campaign';
import { CreateCampaignModal } from 'src/components/Campaigns/Create/CreateCampaign';
import { EmptyCampaign } from 'src/components/Campaigns/EmptyCampaign';
import { InfoBoxes } from 'src/components/Campaigns/InfoBoxes';
import { NoCampaigns } from 'src/components/Campaigns/NoCampaigns';
// import { FundCampaignModal } from 'src/components/Campaigns/Fund/FundCampaign';

export default function Dashboard() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const [createCampaignModalOpen, setCreateCampaignModalOpen] = useState(false);
  // const [fundCampaignModalOpen, setfundCampaignModalOpen] = useState(false);
  const handleClickCreate = () => {
    setCreateCampaignModalOpen(true);
  };
  // const handleClickFund = () => {
  //   setfundCampaignModalOpen(true);
  // }

  const data = [
    { title: 'Rewards Paid', value: '$ 23,000' },
    { title: 'Total Liquidity Provided', value: '$ 1,000,000' },
    { title: 'Volume Traded', value: '$ 99,000' },
    { title: 'Number of Active Campaigns', value: '50' },
  ];

  const campdata: CampaignData[] = [
    {
      name: 'WETH/HMT',
      exchange: 'Uniswap (ETH)',
      apr: '35 %',
      rewardPool: '2,304 HMT',
      rewardToken: {
        symbol: 'HMT',
        quantity: '1,424 ETH',
        total: '2,232,002 HMT',
      },
      tvl: '~$140,024',
      endDate: '1st Aug 2023',
      status: 'ACTIVE',
    },
    {
      name: 'WETH/HMT',
      exchange: 'Uniswap (ETH)',
      apr: '35 %',
      rewardPool: '2,304 HMT',
      rewardToken: {
        symbol: 'HMT',
        quantity: '1,424 ETH',
        total: '2,232,002 HMT',
      },
      tvl: '~$140,024',
      endDate: '1st Aug 2023',
      status: 'ACTIVE',
    },
    {
      name: 'WETH/HMT',
      exchange: 'Uniswap (ETH)',
      apr: '35 %',
      rewardPool: '2,304 HMT',
      rewardToken: {
        symbol: 'HMT',
        quantity: '1,424 ETH',
        total: '2,232,002 HMT',
      },
      tvl: '~$140,024',
      endDate: '1st Aug 2023',
      status: 'ACTIVE',
    },
    // ... add more campaigns here
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
        ) : (
          <>
            <NoCampaigns message="At the moment you are not running any campaign." />
          </>
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
        <Campaigns campaigndata={campdata} />
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
