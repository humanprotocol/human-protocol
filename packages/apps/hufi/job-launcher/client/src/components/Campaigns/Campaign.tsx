import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import React, { useState } from 'react';
import { FundCampaignModal } from './Fund/FundCampaign';
import { CampaignData } from 'src/types';

interface CampaignProps {
  campaigndata: CampaignData[];
}

const Campaigns: React.FC<CampaignProps> = ({ campaigndata }) => {
  const [fundCampaignModalOpen, setfundCampaignModalOpen] = useState(false);
  const handleClickFund = () => {
    setfundCampaignModalOpen(true);
  };
  return (
    <Box>
      <Box sx={{ mr: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography></Typography>
        <Typography>Tokens</Typography>
        <Typography>APR</Typography>
        <Typography>Reward Pool</Typography>
        <Typography>Reward Quantity</Typography>
        <Typography>Total Volume</Typography>
        <Typography>End Date</Typography>
        <Typography>Status</Typography>
      </Box>
      {campaigndata.map((campaign: CampaignData, index: number) => (
        <Box sx={{ mt: 0 }}>
          <Card sx={{ marginBottom: '20px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <img
                    src="../../src/assets/campaignlogo.svg"
                    alt="Campaign Logo"
                    style={{ width: '50px', height: '50px' }}
                  />
                  <Box>
                    <Typography variant="h6">{campaign.name}</Typography>
                    <Typography
                      sx={{ color: 'secondary.light' }}
                      variant="subtitle2"
                    >
                      {campaign.exchange}
                    </Typography>
                    <Button
                      sx={{
                        borderColor: 'secondary.light',
                        color: 'secondary.light',
                      }}
                      onClick={handleClickFund}
                      variant="outlined"
                    >
                      Fund Campaign
                    </Button>
                  </Box>
                </Box>

                <Typography>{campaign.apr}</Typography>
                <Typography>{campaign.rewardPool}</Typography>
                <Typography>{campaign.rewardToken?.quantity}</Typography>
                <Typography>{campaign.tvl}</Typography>
                <Typography>{campaign.endDate}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ color: 'success.main', mb: 5 }}>
                      {campaign.status}
                    </Typography>

                    <Button onClick={handleClickFund} variant="contained">
                      Join
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ))}
      <FundCampaignModal
        open={fundCampaignModalOpen}
        onClose={() => setfundCampaignModalOpen(false)}
      />
    </Box>
  );
};

export default Campaigns;
