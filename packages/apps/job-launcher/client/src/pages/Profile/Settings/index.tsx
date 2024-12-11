import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useEffect, useState } from 'react';
import BillingDetailsModal from '../../../components/BillingDetails/BillingDetailsModal';
import AddCardModal from '../../../components/CreditCard/AddCardModal';
import CardList from '../../../components/CreditCard/CardList';
import { PaymentTable } from '../../../components/Payment/PaymentTable';
import SuccessModal from '../../../components/SuccessModal';
import { countryOptions, vatTypeOptions } from '../../../constants/payment';
import { useSnackbar } from '../../../providers/SnackProvider';
import { getUserBillingInfo, getUserCards } from '../../../services/payment';
import { BillingInfo, CardData } from '../../../types';

const Settings = () => {
  const { showError } = useSnackbar();
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditBillingOpen, setIsEditBillingOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [openBillingAfterAddCard, setOpenBillingAfterAddCard] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cards, setCards] = useState<CardData[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);

  const fetchCards = async () => {
    try {
      const data = await getUserCards();
      setCards(data);
    } catch (error) {
      showError('Error fetching cards');
    }
  };

  const fetchBillingInfo = async () => {
    try {
      const data = await getUserBillingInfo();
      setBillingInfo({ ...billingInfo, ...data });
    } catch (error) {
      showError('Error fetching billing info');
    }
  };

  useEffect(() => {
    const fetchInfo = async () => {
      setLoadingInitialData(true);
      await fetchCards();
      await fetchBillingInfo();
      setLoadingInitialData(false);
    };
    fetchInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSuccessAction = (message: string) => {
    setSuccessMessage(message);
    setIsSuccessOpen(true);
  };

  return loadingInitialData ? (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height={'80vh'}
    >
      <CircularProgress />
    </Box>
  ) : (
    <Box>
      <Box
        mb={8}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          Settings
        </Typography>
      </Box>

      <Grid container spacing={4} mb={11}>
        {/* Billing Info card */}
        <Grid item md={12} lg={6}>
          <Card>
            <CardContent>
              <Grid container padding={3} spacing={2}>
                <Grid item lg={12} xl={4}>
                  <Box justifyContent="space-between" mb={4}>
                    <Typography variant="h5" mb={1}>
                      Billing Details
                    </Typography>
                    <Typography variant="body1" mb={4}>
                      Add/edit your billing details.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setIsEditBillingOpen(true)}
                      disabled={cards.length === 0}
                    >
                      {billingInfo?.name
                        ? 'Edit Billing Details'
                        : '+ Add Billing Details'}
                    </Button>
                  </Box>
                </Grid>
                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                <Grid item lg={12} xl={7} sx={{ height: '300px' }}>
                  {billingInfo?.name ? (
                    <>
                      <Typography variant="h6">Details</Typography>
                      <Typography>
                        Full Name / Company Name: {billingInfo?.name}
                      </Typography>
                      <Typography>Email: {billingInfo?.email}</Typography>
                      <Typography>
                        Address: {billingInfo?.address?.line}
                      </Typography>
                      <Typography>
                        Postal code: {billingInfo?.address?.postalCode}
                      </Typography>
                      <Typography>
                        City: {billingInfo?.address?.city}
                      </Typography>
                      <Typography>
                        Country: {countryOptions[billingInfo?.address?.country]}
                      </Typography>
                      <Typography>
                        VAT Type: {vatTypeOptions[billingInfo?.vatType]}
                      </Typography>
                      <Typography>VAT Number: {billingInfo?.vat}</Typography>
                    </>
                  ) : (
                    <Typography variant="body1">
                      No billing details added yet
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Details card */}
        <Grid item md={12} lg={6}>
          <Card>
            <CardContent>
              <Grid container padding={3} spacing={2}>
                <Grid item lg={12} xl={4}>
                  <Box justifyContent="space-between" mb={4}>
                    <Typography variant="h5" mb={1}>
                      Payment Details
                    </Typography>
                    <Typography variant="body1" mb={4}>
                      Manage your credit cards and payment options
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setIsAddCardOpen(true)}
                    >
                      + Add Credit Card
                    </Button>
                  </Box>
                </Grid>
                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                <Grid
                  item
                  lg={12}
                  xl={7}
                  sx={{ height: '300px', overflowY: 'auto' }}
                >
                  <CardList
                    cards={cards}
                    fetchCards={fetchCards}
                    successMessage={(message) => handleSuccessAction(message)}
                    openAddCreditCardModal={setIsAddCardOpen}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box>
                <Box
                  sx={{
                    mb: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h4">Payments</Typography>
                </Box>
              </Box>
              <PaymentTable rows={5} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <AddCardModal
        open={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onComplete={() => {
          handleSuccessAction('Your card has been successfully added.');
          fetchCards();
          if (!billingInfo?.name || !billingInfo?.address)
            setOpenBillingAfterAddCard(true);
        }}
      />

      <BillingDetailsModal
        open={isEditBillingOpen}
        onClose={() => setIsEditBillingOpen(false)}
        billingInfo={billingInfo}
        setBillingInfo={(info) => {
          setBillingInfo(info);
          handleSuccessAction(
            'Your billing details have been successfully updated.',
          );
        }}
      />

      <SuccessModal
        open={isSuccessOpen}
        onClose={() => {
          if (openBillingAfterAddCard) setIsEditBillingOpen(true);
          setIsSuccessOpen(false);
        }}
        message={successMessage}
      />
    </Box>
  );
};

export default Settings;
