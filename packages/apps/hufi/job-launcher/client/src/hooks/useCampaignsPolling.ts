import { useState, useEffect } from 'react';
import { useNetwork } from 'wagmi';
import {
  getCampaignsDetailsData,
  getCampaignsList,
} from 'src/services/campaign';
import { DeployedCampaign } from 'src/types';

export const useCampaignsPolling = () => {
  const [campaigns, setCampaigns] = useState<Array<DeployedCampaign>>([]);
  const [lastKnownCampaigns, setLastKnownCampaigns] = useState(['']);
  const { chain } = useNetwork();
  const chainId = chain ? chain.id : 80001;
  const [, setNewCampaigns] = useState(['']);

  // Return a function that allows manual refreshing
  const refreshCampaigns = () => {
    setLastKnownCampaigns([]); // This will trigger useEffect to run again
  };
  useEffect(() => {
    let isCancelled = false;

    // Function to fetch campaigns and update state if there are new campaigns
    const fetchCampaigns = async () => {
      try {
        const currentCampaignList: Array<string> = await getCampaignsList(
          chainId
        );

        if (!isCancelled) {
          const freshCampaigns = currentCampaignList.filter(
            (campaign) => !lastKnownCampaigns.includes(campaign)
          );

          if (freshCampaigns.length > 0) {
            setLastKnownCampaigns(currentCampaignList);

            setNewCampaigns(freshCampaigns);

            const details = await getCampaignsDetailsData(
              chainId,
              freshCampaigns
            );
            setCampaigns((prevDetails) => [...prevDetails, ...details]);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error fetching campaigns:', error);
        }
      }
    };

    fetchCampaigns();
    const intervalId = setInterval(fetchCampaigns, 60000);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      isCancelled = true;
    };
  }, [lastKnownCampaigns]);

  return { campaigns, refreshCampaigns };
};
