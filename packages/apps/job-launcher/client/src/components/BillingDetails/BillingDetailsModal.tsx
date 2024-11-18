import CloseIcon from '@mui/icons-material/Close';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Dialog,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSnackbar } from '../..//providers/SnackProvider';
import { countryOptions, vatTypeOptions } from '../../constants/payment';
import { editUserBillingInfo } from '../../services/payment';
import { BillingInfo } from '../../types';

const BillingDetailsModal = ({
  open,
  onClose,
  billingInfo,
  setBillingInfo,
}: {
  open: boolean;
  onClose: () => void;
  billingInfo: BillingInfo;
  setBillingInfo: (value: BillingInfo) => void;
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BillingInfo>(billingInfo);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { showError } = useSnackbar();

  useEffect(() => {
    if (billingInfo) {
      setFormData(billingInfo);
    }
  }, [billingInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (['city', 'country', 'line', 'postalCode'].includes(name)) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        address: {
          ...prevFormData.address,
          [name]: value,
        },
      }));
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validateForm = () => {
    let newErrors: { [key: string]: string } = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    const addressFields = ['line', 'postalCode', 'city', 'country'];
    const hasAddressFields = addressFields.some(
      (field) => formData.address[field as keyof typeof formData.address],
    );
    const allAddressFieldsFilled = addressFields.every(
      (field) => formData.address[field as keyof typeof formData.address],
    );

    if (hasAddressFields && !allAddressFieldsFilled) {
      newErrors.address = 'All address fields must be filled or none.';
    }

    if (formData.vat && !formData.vatType) {
      newErrors.vatType = 'VAT type is required if VAT number is provided';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        delete formData.email;
        await editUserBillingInfo(formData);
        setBillingInfo(formData);
      } catch (err: any) {
        showError(
          err.message || 'An error occurred while setting up the card.',
        );
      }
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ sx: { mx: 2, maxWidth: 'calc(100% - 32px)' } }}
    >
      <Box display="flex" maxWidth="950px">
        <Box
          width={{ xs: '0', md: '40%' }}
          display={{ xs: 'none', md: 'flex' }}
          sx={{
            background: theme.palette.primary.main,
            boxSizing: 'border-box',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          px={9}
          py={6}
        >
          <Typography variant="h4" fontWeight={600} color="#fff">
            {billingInfo ? 'Edit Billing Details' : 'Add Billing Details'}
          </Typography>
        </Box>
        <Box
          sx={{ boxSizing: 'border-box' }}
          width={{ xs: '100%', md: '60%' }}
          minWidth={{ xs: '340px', sm: '392px' }}
          display="flex"
          flexDirection="column"
          p={{ xs: 2, sm: 4 }}
        >
          <IconButton sx={{ ml: 'auto' }} onClick={onClose}>
            <CloseIcon color="primary" />
          </IconButton>

          <Box width="100%" display="flex" flexDirection="column" gap={3}>
            <Typography variant="h6">Details</Typography>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
            />
            <TextField
              label="Address"
              name="line"
              value={formData.address.line}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.address}
            />
            <TextField
              label="Postal code"
              name="postalCode"
              value={formData.address.postalCode}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.address}
            />
            <TextField
              label="City"
              name="city"
              value={formData.address.city}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.address}
            />
            <TextField
              select
              label="Country"
              name="country"
              value={formData.address.country}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.address}
            >
              {Object.entries(countryOptions).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            {/* VAT Section */}
            <Box display="flex" gap={2}>
              <TextField
                select
                label="Tax ID Type"
                name="vatType"
                value={formData.vatType || ''}
                onChange={handleInputChange}
                fullWidth
                error={!!errors.vatType}
                helperText={errors.vatType || ''}
              >
                {Object.entries(vatTypeOptions).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Tax ID Number"
                name="vat"
                value={formData.vat || ''}
                onChange={handleInputChange}
                fullWidth
                error={!!errors.vatType}
                helperText=""
              />
            </Box>
            <LoadingButton
              color="primary"
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubmit}
              loading={isLoading}
            >
              {billingInfo ? 'Save Changes' : 'Add Billing Details'}
            </LoadingButton>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default BillingDetailsModal;
