import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, IconButton, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { useSnackbar } from '../../providers/SnackProvider';
import { setUserDefaultCard } from '../../services/payment';
import { CardData } from '../../types';
import { CardIcon } from '../Icons/CardIcon';
import DeleteCardModal from './DeleteCardModal';

interface CardListProps {
  cards: CardData[];
  fetchCards: () => void;
  successMessage: (message: string) => void;
  openAddCreditCardModal: (open: boolean) => void;
}

const CardList: React.FC<CardListProps> = ({
  cards,
  fetchCards,
  successMessage,
  openAddCreditCardModal,
}) => {
  const theme = useTheme();
  const { showError } = useSnackbar();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardData | undefined>(
    undefined,
  );

  const isCardExpired = (cardMonth: number, cardYear: number) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    return (
      cardYear < currentYear ||
      (cardYear === currentYear && cardMonth < currentMonth)
    );
  };

  const handleSetDefaultCard = async (cardId: string) => {
    try {
      await setUserDefaultCard(cardId);
      fetchCards();
      successMessage('Your card has been successfully updated.');
    } catch (error) {
      showError('Error setting default card');
    }
  };

  const handleOpenDeleteModal = (card: CardData) => {
    setSelectedCard(card);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    if (selectedCard) {
      fetchCards();
      successMessage('Your card has been successfully deleted.');
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <Box>
      {cards.map((card) => (
        <Box
          key={card.id}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={2}
          mb={2}
          border="1px solid #E0E0E0"
        >
          <Box display="flex" alignItems="center">
            <CardIcon
              fontSize="large"
              width={40}
              height={25}
              style={{
                marginRight: '15px',
              }}
            />
            <Box>
              <Typography variant="body1">
                **** **** **** {card.last4}
              </Typography>
              <Typography variant="body2">
                Exp. date {card.expMonth}/{card.expYear}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {card.default ? (
              <Button
                variant="contained"
                size="small"
                disabled
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&.Mui-disabled': {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  },
                }}
              >
                Default
              </Button>
            ) : isCardExpired(card.expMonth, card.expYear) ? (
              <Button variant="outlined" size="small" color="error">
                Expired
              </Button>
            ) : (
              <Button
                variant="text"
                size="small"
                onClick={() => handleSetDefaultCard(card.id)}
                sx={{ textDecoration: 'underline' }}
              >
                Make Default
              </Button>
            )}
            <IconButton onClick={() => handleOpenDeleteModal(card)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      ))}
      {cards.length === 0 && (
        <Typography variant="body1">No cards to show</Typography>
      )}

      {selectedCard && (
        <DeleteCardModal
          open={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          cardId={selectedCard.id}
          isDefault={selectedCard.default}
          hasMultipleCards={cards.length > 1}
          onSuccess={handleDeleteSuccess}
          openAddCreditCardModal={openAddCreditCardModal}
        />
      )}
    </Box>
  );
};

export default CardList;
