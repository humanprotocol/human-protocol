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
import React, { useEffect, useState } from 'react';
import { RoundedBox } from './RoundedBox';
import {
  CreatePaymentType,
  FortuneJobRequestType,
  FundingMethodType,
  JobLaunchResponse,
} from './types';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

type JobRequestProps = {
  fundingMethod: FundingMethodType;
  onBack: () => void;
  onLaunch: () => void;
  onSuccess: (response: JobLaunchResponse) => void;
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
  const [tokenAmount, setTokenAmount] = useState(0);

  const handleJobRequestFormFieldChange = (
    fieldName: string,
    fieldValue: any
  ) => {
    const regex = /^[0-9\b]+$/;
    if (fieldName !== 'fortunesRequired') {
      setJobRequest({ ...jobRequest, [fieldName]: fieldValue });
    } else if (regex.test(fieldValue) || fieldValue === '') {
      setJobRequest({ ...jobRequest, [fieldName]: fieldValue });
    }
  };

  const handlePaymentDataFormFieldChange = (
    fieldName: string,
    fieldValue: any
  ) => {
    setPaymentData({ ...paymentData, [fieldName]: fieldValue });
  };

  useEffect(() => {
    const getHMTPrice = async () => {
      const currentPrice = (
        await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=human-protocol&vs_currencies=${paymentData.currency.toLowerCase()}`
        )
      ).data['human-protocol'][paymentData.currency.toLowerCase()];
      setTokenAmount(Number(paymentData.amount) / currentPrice);
    };
    getHMTPrice();
  }, [paymentData.amount, paymentData.currency]);

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
      const data: FortuneJobRequestType = {
        ...jobRequest,
        fundAmount: tokenAmount.toString(),
        token: ESCROW_NETWORKS[jobRequest.chainId as ChainId]?.hmtAddress!,
        fiat: true,
      };
      console.log(await axios.post(`${baseUrl}/check-escrow`, data));

      const clientSecret = (
        await axios.post(`${baseUrl}/create-payment-intent`, {
          currency: paymentData.currency.toLowerCase(),
          amount: (Number(paymentData.amount) * 100).toString(),
        })
      )?.data?.clientSecret;

      const card = elements.getElement(CardElement);
      if (!card) return;
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: card,
            billing_details: {
              name: paymentData.name,
            },
          },
        });
      if (stripeError) throw new Error(stripeError.message);

      const jobLauncherAddress = process.env.REACT_APP_JOB_LAUNCHER_ADDRESS;
      if (!jobLauncherAddress) {
        alert('Job Launcher address is missing');
        setIsLoading(false);
        return;
      }

      onLaunch();
      data.paymentId = paymentIntent?.id;
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
      {tokenAmount !== 0 && (
        <Typography
          variant="body2"
          color="primary"
          sx={{ mb: 1, mt: 1, display: 'flex', justifyContent: 'flex-end' }}
        >
          Escrow will be funded with {tokenAmount}HMT aprox.
        </Typography>
      )}
      {tokenAmount === 0 && <br></br>}
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
