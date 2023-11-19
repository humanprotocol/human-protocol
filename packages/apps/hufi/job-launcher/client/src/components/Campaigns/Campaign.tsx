import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import React, { useState } from 'react';
import { JoinCampaignModal } from './JoinCampaignModal';
import { DeployedCampaign } from 'src/types';

interface CampaignProps {
  campaigndata: DeployedCampaign[];
}

const Campaigns: React.FC<CampaignProps> = ({ campaigndata }) => {
  const [joinCampaignModalOpen, setJoinCampaignModalOpen] = useState(false);
  const [exchange, setExchange] = useState('');
  const handleClickJoin = (exchange: React.SetStateAction<string>) => {
    setExchange(exchange);
    setJoinCampaignModalOpen(true);
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
      {campaigndata.map((campaign: DeployedCampaign, index: number) => {
        const milliseconds = campaign.manifest.endBlock * 1000; // Convert to milliseconds
        const dateObject = new Date(milliseconds);
        const today = new Date();
        // Format date (according to local timezone)
        const enddate = dateObject.toLocaleDateString();
        const checkEndDate = new Date(enddate);
        const check = checkEndDate > today ? 'Active' : 'Expired';
        return (
          <Box key={index} sx={{ mt: 0 }}>
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
                      <Typography variant="h6">
                        {campaign.manifest.tokenA}/{campaign.manifest.tokenB}
                      </Typography>
                      <Typography
                        sx={{ color: 'secondary.light' }}
                        variant="subtitle2"
                      >
                        {campaign.manifest.exchangeName}
                      </Typography>
                      <Button
                        sx={{
                          borderColor: 'secondary.light',
                          color: 'secondary.light',
                        }}
                        variant="outlined"
                        disabled
                      >
                        Fund Campaign
                      </Button>
                    </Box>
                  </Box>

                  <Typography>-</Typography>
                  <Typography>HMT</Typography>
                  <Typography>{campaign.manifest.fundAmount}</Typography>
                  <Typography>N/A</Typography>
                  <Typography>{enddate}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ color: 'success.main', mb: 5 }}>
                        {check}
                      </Typography>

                      <Button
                        sx={{ backgroundColor: 'secondary.light' }}
                        onClick={() =>
                          handleClickJoin(campaign.manifest.exchangeName)
                        }
                        variant="contained"
                      >
                        Join
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
      })}
      <JoinCampaignModal
        exchange={exchange}
        open={joinCampaignModalOpen}
        onClose={() => setJoinCampaignModalOpen(false)}
      />
    </Box>
  );
};

export default Campaigns;
