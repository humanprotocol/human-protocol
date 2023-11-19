import { Box, Button, Pagination, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bagImg from 'src/assets/bag.png';
import Campaigns from 'src/components/Campaigns/Campaign';
import { CreateCampaignModal } from 'src/components/Campaigns/Create/CreateCampaign';
import { useCampaignsPolling } from 'src/hooks/useCampaignsPolling';

export default function AllCampaigns() {
  const [createCampaignModalOpen, setCreateCampaignModalOpen] = useState(false);
  const navigate = useNavigate();
  const { campaigns } = useCampaignsPolling();

  const handleClickCreate = () => {
    setCreateCampaignModalOpen(true);
  };

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
