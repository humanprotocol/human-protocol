import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
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
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import axios from 'axios';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import {
  ChainId,
  Currencies,
  ESCROW_NETWORKS,
  HM_TOKEN_DECIMALS,
  SUPPORTED_CHAIN_IDS,
} from '../constants';
import { RoundedBox } from './RoundedBox';
import {
  CreatePaymentType,
  FortuneJobRequestType,
  FundingMethodType,
  JobLaunchResponse,
} from './types';

type JobRequestProps = {
  fundingMethod: FundingMethodType;
  onBack: () => void;
  onLaunch: () => void;
  onSuccess: (response: JobLaunchResponse) => void;
  onFail: (message: string) => void;
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
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();
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

  useEffect(() => {
    setProvider(
      new ethers.providers.JsonRpcProvider(
        ESCROW_NETWORKS[jobRequest.chainId as ChainId]?.rpcUrl
      )
    );
  }, [jobRequest.chainId]);

  const handleLaunch = async () => {
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      alert('Stripe.js has not yet loaded.');
      return;
    }
    setIsLoading(true);
    const data: FortuneJobRequestType = {
      ...jobRequest,
      fundAmount: tokenAmount.toString(),
      token: ESCROW_NETWORKS[jobRequest.chainId as ChainId]?.hmtAddress!,
      fiat: true,
    };
    try {
      const contract = new ethers.Contract(data.token, HMTokenABI, provider);
      const jobLauncherAddress = import.meta.env.VITE_APP_JOB_LAUNCHER_ADDRESS;
      if (!jobLauncherAddress) {
        alert('Job Launcher address is missing');
        setIsLoading(false);
        return;
      }
      const balance = await contract.balanceOf(jobLauncherAddress);

      const fundAmount = ethers.utils.parseUnits(
        data.fundAmount,
        HM_TOKEN_DECIMALS
      );
      if (balance.lt(fundAmount)) {
        throw new Error('Balance not enough for funding the escrow');
      }
      const baseUrl = import.meta.env.VITE_APP_JOB_LAUNCHER_SERVER_URL;
      await axios.post(`${baseUrl}/check-escrow`, data);

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

      onLaunch();
      data.paymentId = paymentIntent?.id;
      const result = await axios.post(`${baseUrl}/escrow`, data);
      onSuccess(result.data);
    } catch (err) {
      if (err.name === 'AxiosError') onFail(err.response.data);
      else onFail(err.message);
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
            pl: 3,
            py: 3,
            width: '30vw',
          }}
        >
          <Typography variant="body2" color="primary" mb={2}>
            Funds
          </Typography>
          <Grid container spacing={3} sx={{ width: '100%' }}>
            <Grid item xs={12}>
              <Typography variant="caption" color="primary" sx={{ mb: 1 }}>
                Card
              </Typography>
              <RoundedBox sx={{ p: 2, borderRadius: '4px' }}>
                <CardElement id="card" />
              </RoundedBox>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="primary" sx={{ mb: 1 }}>
                Name on Card
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="John Smith"
                value={paymentData.name}
                onChange={(e) =>
                  handlePaymentDataFormFieldChange('name', e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <FormControl fullWidth>
                <Typography variant="caption" color="primary" sx={{ mb: 1 }}>
                  Amount
                </Typography>
                <TextField
                  fullWidth
                  placeholder="10"
                  variant="outlined"
                  value={paymentData.amount}
                  onChange={(e) =>
                    handlePaymentDataFormFieldChange('amount', e.target.value)
                  }
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <FormControl fullWidth>
                <Typography variant="caption" color="primary" sx={{ mb: 1 }}>
                  Currency
                </Typography>
                <Select
                  size="small"
                  variant="outlined"
                  value={paymentData.currency}
                  onChange={(e) =>
                    handlePaymentDataFormFieldChange('currency', e.target.value)
                  }
                  fullWidth
                  sx={{ background: 'white', height: '56px' }}
                >
                  {Currencies.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
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
          sx={{
            minWidth: '240px',
            py: 1,
            boxShadow:
              '0px 3px 1px -2px #858ec6, 0px 2px 2px rgba(233, 235, 250, 0.5), 0px 1px 5px rgba(233, 235, 250, 0.2)',
          }}
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
