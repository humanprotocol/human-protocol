import { Box, Button, Pagination, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampaignData } from '../../../types';
import bagImg from 'src/assets/bag.png';
import Campaigns from 'src/components/Campaigns/Campaign';
import { CreateCampaignModal } from 'src/components/Campaigns/Create/CreateCampaign';

export default function Dashboard() {
  const [createCampaignModalOpen, setCreateCampaignModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleClickCreate = () => {
    setCreateCampaignModalOpen(true);
  };

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
          All Campaigns
        </Typography>
      </Box>

      <Box>
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
