import { Box, CardActionArea, Typography } from '@mui/material';
import { CardContainer } from '../Cards';
import { useHumanProtocolNews } from 'src/hooks/useHumanProtocolNews';

export const NewsView = () => {
  const { data, isLoading } = useHumanProtocolNews();

  if (isLoading) return <></>;

  return (
    <CardContainer sxProps={{ padding: 0 }}>
      <CardActionArea href={data?.link ?? ''} target="_blank">
        <Box
          sx={{
            padding: '24px',
            display: 'flex',
            flexDirection: { xs: 'row', md: 'column' },
            justifyContent: 'space-between',
            height: '100%',
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
                position: { xs: 'absolute', md: 'relative' },
                top: { xs: '-16px', md: 'auto' },
              }}
            >
              NEWS
            </Box>
            <Typography
              sx={{
                lineHeight: '150%',
                fontSize: { xs: '14px', sm: '20px', md: '24px' },
              }}
              color="primary"
              mb={{ xs: 0, md: 6 }}
            >
              {data?.title}
            </Typography>
            <Typography
              variant="body2"
              color="primary"
              maxWidth={450}
              mb={5}
              sx={{ display: { xs: 'none', md: 'block' } }}
            >
              {data?.description}
            </Typography>
          </Box>
          {data?.image && (
            <Box
              sx={{
                borderRadius: '8px',
                overflow: 'hidden',
                maxWidth: { xs: '40%', md: '100%' },
              }}
            >
              <img src={data?.image} alt="news" style={{ width: '100%' }} />
            </Box>
          )}
        </Box>
      </CardActionArea>
    </CardContainer>
  );
};
