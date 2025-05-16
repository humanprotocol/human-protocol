import { FC, useEffect, useState, useRef } from 'react';
import {
  IKVStore,
  KVStoreKeys,
  OperatorCategory,
  Role,
} from '@human-protocol/sdk';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import BaseModal from './BaseModal';
import SaveConfirmationModal from './SaveConfirmationModal';
import { ModalError, ModalLoading, ModalSuccess } from '../ModalState';
import {
  ModalRequestStatus,
  useModalRequestStatus,
} from '../../hooks/useModalRequestStatus';
import { useSnackbar } from '../../providers/SnackProvider';

type Props = {
  open: boolean;
  onClose: () => void;
  initialData: IKVStore[];
  onSave: (keys: string[], values: string[]) => Promise<void>;
};

type Field = {
  key: string;
  value: string;
  isCustom?: boolean;
};

const SuccessState: FC = () => (
  <ModalSuccess>
    <Typography variant="subtitle2" p={1}>
      You have successfully edited your KV Store
    </Typography>
  </ModalSuccess>
);

const KVStoreModal: FC<Props> = ({ open, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState<Field[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Field[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const { showError } = useSnackbar();
  const { changeStatus, isIdle, isLoading, isSuccess, isError } =
    useModalRequestStatus();

  useEffect(() => {
    if (open) {
      const preparedData = initialData.map((item) => ({
        ...item,
        isCustom: !Object.values(KVStoreKeys).includes(item.key),
      }));
      setFormData(preparedData);
      setPendingChanges([]);
    }
  }, [open, initialData]);

  const handleClose = () => {
    if (isLoading) return;

    setFormData([]);
    setPendingChanges([]);
    changeStatus(ModalRequestStatus.Idle);
    onClose();
  };

  const updatePendingChanges = (key: string, value: string) => {
    setPendingChanges((prev) => {
      const originalItem = initialData.find((item) => item.key === key);
      const isRevertedToOriginal = originalItem && originalItem.value === value;

      if (isRevertedToOriginal) {
        return prev.filter((change) => change.key !== key);
      }

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

    setTimeout(() => {
      formContainerRef.current?.lastElementChild?.scrollIntoView({
        behavior: 'smooth',
      });
    }, 100);
  };

  const handleSave = async () => {
    const hasDeletedItems = initialData.some(
      (initialItem) =>
        !formData.some((currentItem) => currentItem.key === initialItem.key)
    );
    if (hasDeletedItems) {
      setShowConfirmationModal(true);
    } else {
      await handleConfirmSave();
    }
  };

  const handleConfirmSave = async () => {
    if (isLoading) return;

    setShowConfirmationModal(false);
    changeStatus(ModalRequestStatus.Loading);
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
      changeStatus(ModalRequestStatus.Success);
    } catch (error) {
      console.error('Error during saving KV Store:', error);
      changeStatus(ModalRequestStatus.Error);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      sx={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h2" mb={2} p={1}>
        Edit KV Store
      </Typography>
      <Box
        ref={formContainerRef}
        sx={{
          maxHeight: '400px',
          overflowY: 'auto',
          display: isIdle ? 'flex' : 'none',
          flexDirection: 'column',
          gap: 1,
          mb: 5,
          width: '100%',
          px: 3,
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
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'background.default',
                        },
                      },
                    }}
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
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'background.default',
                        },
                      },
                    }}
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
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'background.default',
                        },
                      },
                    }}
                  >
                    {Object.entries(OperatorCategory).map(
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
              <IconButton onClick={() => handleDelete(index)}>
                <DeleteIcon sx={{ color: 'primary.main' }} />
              </IconButton>
            </Grid>
          </Grid>
        ))}
      </Box>

      {isLoading && <ModalLoading />}
      {isSuccess && <SuccessState />}
      {isError && <ModalError />}

      <Box display="flex" mt={2} gap={1}>
        {isIdle && (
          <>
            <Button variant="outlined" size="large" onClick={handleAddField}>
              Add Field
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={pendingChanges.length === 0}
            >
              Save
            </Button>
          </>
        )}

        {(isLoading || isSuccess) && (
          <Button
            variant="contained"
            size="large"
            onClick={handleClose}
            disabled={isLoading}
          >
            Close
          </Button>
        )}
        {isError && (
          <Button
            variant="contained"
            size="large"
            onClick={() => changeStatus(ModalRequestStatus.Idle)}
          >
            Edit
          </Button>
        )}
      </Box>
      {showConfirmationModal && (
        <SaveConfirmationModal
          open={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onConfirmSave={handleConfirmSave}
        />
      )}
    </BaseModal>
  );
};

export default KVStoreModal;
