import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import {
  SUPPORTED_CHAIN_IDS,
  ESCROW_NETWORKS,
  ChainId,
  Currencies,
} from 'src/constants';
import React, { useState } from 'react';
import { RoundedBox } from './RoundedBox';
import {
  CreatePaymentType,
  FortuneJobRequestType,
  FundingMethodType,
} from './types';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

type JobRequestProps = {
  fundingMethod: FundingMethodType;
  onBack: () => void;
  onLaunch: () => void;
  onSuccess: (escrowAddress: string) => void;
  onFail: () => void;
};

export const JobRequest = ({
  fundingMethod,
  onBack,
  onLaunch,
  onSuccess,
  onFail,
}: JobRequestProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [jobRequest, setJobRequest] = useState<FortuneJobRequestType>({
    chainId: SUPPORTED_CHAIN_IDS.includes(ChainId.LOCALHOST)
      ? ChainId.LOCALHOST
      : SUPPORTED_CHAIN_IDS.includes(ChainId.POLYGON_MUMBAI)
      ? ChainId.POLYGON_MUMBAI
      : SUPPORTED_CHAIN_IDS[0],
    title: '',
    description: '',
    fortunesRequired: '',
    token: '',
    fundAmount: '',
    jobRequester: '',
  });
  const [paymentData, setPaymentData] = useState<CreatePaymentType>({
    amount: '',
    currency: 'USD',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleJobRequestFormFieldChange = (
    fieldName: string,
    fieldValue: any
  ) => {
    setJobRequest({ ...jobRequest, [fieldName]: fieldValue });
  };

  const handlePaymentDataFormFieldChange = (
    fieldName: string,
    fieldValue: any
  ) => {
    setPaymentData({ ...paymentData, [fieldName]: fieldValue });
  };

  const handleLaunch = async () => {
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      alert('Stripe.js has not yet loaded.');
      return;
    }
    setIsLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_JOB_LAUNCHER_SERVER_URL;
      const clientSecret = (
        await axios.post(`${baseUrl}/create-payment-intent`, {
          currency: paymentData.currency.toLowerCase(),
          amount: (Number(paymentData.amount) * 100).toString(),
        })
      )?.data?.clientSecret;

      const card = elements.getElement(CardElement);
      if (!card) return;
      const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name: paymentData.name,
          },
        },
      });

      console.log(`Payment ${paymentIntent?.status}: ${paymentIntent?.id}`);

      const jobLauncherAddress = process.env.REACT_APP_JOB_LAUNCHER_ADDRESS;
      if (!jobLauncherAddress) {
        alert('Job Launcher address is missing');
        setIsLoading(false);
        return;
      }

      //Convert amount paid into HMT

      const data: FortuneJobRequestType = {
        ...jobRequest,
        fundAmount: ((paymentIntent?.amount as number) / 100).toString(),
        token: ESCROW_NETWORKS[jobRequest.chainId as ChainId]?.hmtAddress!,
        fiat: true,
        paymentId: paymentIntent?.id,
      };
      onLaunch();
      const result = await axios.post(`${baseUrl}/escrow`, data);
      onSuccess(result.data);
    } catch (err) {
      console.log(err);
      onFail();
    }

    setIsLoading(false);
  };

  return (
    <RoundedBox sx={{ p: '50px 140px' }}>
      <Typography variant="body2" color="primary" mb={4}>
        Job Details
      </Typography>
      <Box sx={{ display: 'flex', gap: 4 }}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <FormControl sx={{ minWidth: 240 }} size="small">
            <InputLabel>Network</InputLabel>
            <Select
              label="Network"
              variant="outlined"
              value={jobRequest.chainId}
              onChange={(e) =>
                handleJobRequestFormFieldChange(
                  'chainId',
                  Number(e.target.value)
                )
              }
            >
              {SUPPORTED_CHAIN_IDS.map((chainId) => (
                <MenuItem key={chainId} value={chainId}>
                  {ESCROW_NETWORKS[chainId]?.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Grid container sx={{ width: '100%' }} spacing={3}>
            <Grid item xs={12} sm={12} md={6}>
              <FormControl fullWidth>
                <TextField
                  placeholder="Title"
                  value={jobRequest.title}
                  onChange={(e) =>
                    handleJobRequestFormFieldChange('title', e.target.value)
                  }
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <FormControl fullWidth>
                <TextField
                  placeholder="Fortunes Requested"
                  value={jobRequest.fortunesRequired}
                  onChange={(e) =>
                    handleJobRequestFormFieldChange(
                      'fortunesRequired',
                      e.target.value
                    )
                  }
                />
              </FormControl>
            </Grid>
          </Grid>
          <FormControl fullWidth>
            <TextField
              placeholder="Description"
              value={jobRequest.description}
              onChange={(e) =>
                handleJobRequestFormFieldChange('description', e.target.value)
              }
            />
          </FormControl>
          <FormControl fullWidth>
            <TextField
              placeholder="Job Requester Address"
              value={jobRequest.jobRequester}
              onChange={(e) =>
                handleJobRequestFormFieldChange('jobRequester', e.target.value)
              }
            />
          </FormControl>
        </Box>
        <Box
          sx={{
            borderRadius: '10px',
            background: '#fbfbfe',
            px: 2.5,
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            width: '30vw',
          }}
        >
          <Typography variant="body2" color="primary">
            Funds
          </Typography>
          <FormControl>
            <Typography variant="caption" color="primary" sx={{ mb: 1 }}>
              Card
            </Typography>
            <RoundedBox sx={{ p: 2 }}>
              <CardElement id="card" />
            </RoundedBox>
          </FormControl>
          <FormControl>
            <Typography variant="caption" color="primary" sx={{ mb: 1 }}>
              Name on Card
            </Typography>
            <RoundedBox sx={{ p: 2 }}>
              <TextField
                fullWidth
                variant="standard"
                placeholder="John Smith"
                value={paymentData.name}
                onChange={(e) =>
                  handlePaymentDataFormFieldChange('name', e.target.value)
                }
              />
            </RoundedBox>
          </FormControl>
          <Grid container sx={{ width: '100%' }} spacing={3}>
            <Grid item xs={12} sm={12} md={6}>
              <FormControl fullWidth>
                <Typography variant="caption" color="primary" sx={{ mb: 1 }}>
                  Amount
                </Typography>
                <RoundedBox sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="10"
                    variant="standard"
                    value={paymentData.amount}
                    onChange={(e) =>
                      handlePaymentDataFormFieldChange('amount', e.target.value)
                    }
                  />
                </RoundedBox>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <FormControl fullWidth>
                <Typography variant="caption" color="primary" sx={{ mb: 1 }}>
                  Currency
                </Typography>
                <RoundedBox sx={{ p: 1 }}>
                  <Select
                    size="small"
                    variant="filled"
                    value={paymentData.currency}
                    onChange={(e) =>
                      handlePaymentDataFormFieldChange(
                        'currency',
                        e.target.value
                      )
                    }
                    sx={{ background: 'white', width: '95%', ml: 1 }}
                  >
                    {Currencies.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </RoundedBox>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 8 }}>
        <Button
          variant="outlined"
          sx={{ minWidth: '240px', py: 1 }}
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          sx={{ minWidth: '240px', py: 1 }}
          onClick={handleLaunch}
          disabled={isLoading}
        >
          {isLoading && <CircularProgress size={24} sx={{ mr: 1 }} />} Fund and
          Request Job
        </Button>
      </Box>
    </RoundedBox>
  );
};
