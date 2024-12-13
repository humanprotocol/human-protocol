import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { CardData } from '../../types';
import { CardIcon } from '../Icons/CardIcon';

const SelectCardModal = ({
  open,
  onClose,
  cards,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  cards: CardData[];
  onSelect: (card: CardData) => void;
}) => {
  const theme = useTheme();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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
            Select Credit Card
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
          <IconButton sx={{ ml: 'auto', mb: 2 }} onClick={onClose}>
            <CloseIcon color="primary" />
          </IconButton>

          <Box sx={{ maxHeight: '600px', overflowY: 'auto' }}>
            {cards.map((card) => (
              <Box
                key={card.id}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p={1}
                mb={2}
                border={`1px solid ${selectedCardId === card.id ? '#3f51b5' : '#E0E0E0'}`}
                borderRadius="8px"
                sx={{
                  cursor: 'pointer',
                  '&:hover': { borderColor: '#3f51b5' },
                }}
                onClick={() => setSelectedCardId(card.id)}
              >
                <CardIcon fontSize="medium" />
                <Typography>**** **** **** {card.last4}</Typography>
                <Typography>
                  Exp. date {card.expMonth}/{card.expYear}
                </Typography>
              </Box>
            ))}
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={!selectedCardId}
            sx={{ mt: 2 }}
            onClick={() => {
              const selected = cards.find((card) => card.id === selectedCardId);
              if (selected) {
                onSelect(selected);
              }
            }}
          >
            Select Credit Card
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default SelectCardModal;
