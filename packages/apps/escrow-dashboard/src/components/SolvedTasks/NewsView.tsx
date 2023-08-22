import { Box, CardActionArea, Typography } from '@mui/material';
import { CardContainer } from '../Cards';
import { useHumanProtocolNews } from 'src/hooks/useHumanProtocolNews';

export const NewsView = () => {
  const { data, isLoading } = useHumanProtocolNews();

  return (
    <CardContainer sxProps={{ padding: 0 }}>
      {isLoading ? (
        <></>
      ) : (
        <CardActionArea
          href={data?.link ?? ''}
          target="_blank"
          sx={{ height: '100%' }}
        >
          <Box
            sx={{
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                px: { xs: 0, md: 3 },
                pt: { xs: 0, md: 2 },
              }}
            >
              <Box
                sx={{
                  borderRadius: '8px',
                  border: '1px solid rgba(203, 207, 232, 0.80)',
                  background: '#fff',
                  boxShadow:
                    '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
                  px: 2,
                  color: '#320A8D',
                  fontSize: '12px',
                  lineHeight: '266%',
                  mb: '20px',
                }}
              >
                NEWS
              </Box>
              <Typography
                sx={{
                  lineHeight: '150%',
                  fontSize: '24px',
                }}
                color="primary"
                mb={2}
              >
                {data?.title}
              </Typography>
              <Typography variant="body2" color="primary" maxWidth={450} mb={4}>
                {data?.description}
              </Typography>
            </Box>
            {data?.image && (
              <Box
                sx={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={data?.image}
                  alt="news"
                  sx={{
                    width: '100%',
                    maxHeight: { xs: '160px', sm: '240px' },
                    objectFit: 'cover',
                  }}
                />
              </Box>
            )}
          </Box>
        </CardActionArea>
      )}
    </CardContainer>
  );
};
