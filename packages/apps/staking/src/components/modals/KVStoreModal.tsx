import {
  IKVStore,
  KVStoreKeys,
  LeaderCategory,
  Role,
} from '@human-protocol/sdk';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useSnackbar } from '../../providers/SnackProvider';
import BaseModal from './BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
  initialData: IKVStore[];
  onSave: (keys: string[], values: string[]) => Promise<void>;
};

const KVStoreModal: React.FC<Props> = ({
  open,
  onClose,
  initialData,
  onSave,
}) => {
  const [formData, setFormData] = useState<
    { key: string; value: string; isCustom?: boolean }[]
  >([]);
  const [pendingChanges, setPendingChanges] = useState<
    { key: string; value: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { showError } = useSnackbar();

  useEffect(() => {
    if (open) {
      const preparedData = initialData.map((item) => ({
        ...item,
        isCustom: !Object.values(KVStoreKeys).includes(item.key),
      }));
      setFormData(preparedData);
      setPendingChanges([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updatePendingChanges = (key: string, value: string) => {
    setPendingChanges((prev) => {
      const existingChangeIndex = prev.findIndex(
        (change) => change.key === key
      );
      const newChanges = [...prev];

      if (existingChangeIndex >= 0) {
        newChanges[existingChangeIndex].value = value;
      } else {
        newChanges.push({ key, value });
      }

      return newChanges;
    });
  };

  const handleKeyChange = (index: number, newKey: string) => {
    if (formData.some((item, i) => i !== index && item.key === newKey)) {
      showError('Duplicate keys are not allowed.');
      return;
    }

    const updatedData = [...formData];
    updatedData[index].key = newKey;
    updatedData[index].isCustom = newKey === 'custom';

    if (newKey === 'custom') {
      updatedData[index].key = '';
    }

    setFormData(updatedData);

    if (!updatedData[index].isCustom) {
      updatePendingChanges(newKey, updatedData[index].value);
    }
  };

  const handleCustomKeyChange = (index: number, customKey: string) => {
    if (formData.some((item, i) => i !== index && item.key === customKey)) {
      showError('Duplicate keys are not allowed.');
      return;
    }

    const updatedData = [...formData];
    updatedData[index].key = customKey;

    setFormData(updatedData);
  };

  const handleValueChange = (index: number, newValue: string) => {
    const updatedData = [...formData];
    updatedData[index].value = newValue;

    if (!updatedData[index].isCustom) {
      updatePendingChanges(updatedData[index].key, newValue);
    }
    setFormData(updatedData);
  };

  const handleDelete = (index: number) => {
    const updatedData = formData.filter((_, i) => i !== index);
    updatePendingChanges(formData[index].key, '');
    setFormData(updatedData);
  };

  const handleAddField = () => {
    setFormData((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const customChanges = formData
        .filter(
          (item) =>
            item.isCustom &&
            !initialData.some(
              (data) => data.key === item.key && data.value === item.value
            )
        )
        .map((item) => ({
          key: item.key,
          value: item.value,
        }));
      const finalChanges = [...pendingChanges, ...customChanges].filter(
        (item) => item.key !== ''
      );
      const keys = finalChanges.map((item) => item.key);
      const values = finalChanges.map((item) => item.value);
      if (finalChanges.length > 0) {
        await onSave(keys, values);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      sx={{
        width: '80%',
        maxWidth: '1200px',
      }}
    >
      <Typography variant="h6" mb={2}>
        Edit KVStore
      </Typography>
      <Box
        sx={{
          maxHeight: '400px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          mb: 5,
        }}
      >
        {formData.map((item, index) => (
          <Grid
            container
            spacing={2}
            alignItems="center"
            key={index}
            mt={-1}
            width={'104%'}
          >
            <Grid item xs={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <FormControl sx={{ flex: item.isCustom ? 0.3 : 1 }}>
                  <InputLabel id={`key-select-label-${index}`}>Key</InputLabel>
                  <Select
                    labelId={`key-select-label-${index}`}
                    label="Key"
                    value={item.isCustom ? 'custom' : item.key}
                    onChange={(e) => handleKeyChange(index, e.target.value)}
                    disabled={initialData.some((data) => data.key === item.key)}
                  >
                    <MenuItem value="" disabled>
                      Select Key
                    </MenuItem>
                    {Object.entries(KVStoreKeys).map(([, kvKey]) => (
                      <MenuItem key={kvKey} value={kvKey}>
                        {kvKey}
                      </MenuItem>
                    ))}
                    <MenuItem value="custom">custom</MenuItem>
                  </Select>
                </FormControl>
                {item.isCustom && (
                  <TextField
                    placeholder="Custom Key"
                    value={item.key}
                    onChange={(e) =>
                      handleCustomKeyChange(index, e.target.value)
                    }
                    fullWidth
                    sx={{ flex: 0.7 }}
                    disabled={initialData.some((data) => data.key === item.key)}
                  />
                )}
              </Box>
            </Grid>
            <Grid item xs={7}>
              {item.key === 'role' ? (
                <FormControl fullWidth>
                  <InputLabel id={`value-select-label-${index}`}>
                    Value
                  </InputLabel>
                  <Select
                    labelId={`value-select-label-${index}`}
                    label="Value"
                    value={item.value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                  >
                    {Object.entries(Role).map(([roleKey, roleValue]) => (
                      <MenuItem key={roleKey} value={roleValue}>
                        {roleValue}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : item.key === 'category' ? (
                <FormControl fullWidth>
                  <InputLabel id={`value-select-label-${index}`}>
                    Value
                  </InputLabel>
                  <Select
                    labelId={`value-select-label-${index}`}
                    label="Value"
                    value={item.value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                  >
                    {Object.entries(LeaderCategory).map(
                      ([categoryKey, categoryValue]) => (
                        <MenuItem key={categoryKey} value={categoryValue}>
                          {categoryValue}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label="Value"
                  value={item.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  type={item.key === 'fee' ? 'number' : 'text'}
                  inputProps={{ min: item.key === 'fee' ? '0' : undefined }}
                />
              )}
            </Grid>
            <Grid item xs={1}>
              <Tooltip title="Delete">
                <IconButton onClick={() => handleDelete(index)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        ))}
      </Box>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}
      >
        <Button variant="outlined" onClick={handleAddField} fullWidth>
          Add Field
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </Box>
    </BaseModal>
  );
};

export default KVStoreModal;
