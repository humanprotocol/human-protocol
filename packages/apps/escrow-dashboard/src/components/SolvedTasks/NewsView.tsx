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
              padding: '16px',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  borderRadius: '8px',
                  border: '1px solid rgba(203, 207, 232, 0.80)',
                  background: '#fff',
                  boxShadow:
                    '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
                  color: '#320A8D',
                  fontSize: '12px',
                  letterSpacing: '0.4px',
                  lineHeight: '266%',
                  mt: '24px',
                  ml: '8px',
                  width: '72px',
                  height: '32px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              >
                NEWS
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  px: { xs: '8px', lg: '18px', xl: '24px' },
                  pt: { xs: '10px', lg: '16px' },
                }}
              >
                <Typography
                  sx={{
                    lineHeight: '150%',
                    fontSize: '24px',
                  }}
                  color="primary"
                  mb="14px"
                >
                  {data?.title}
                </Typography>
                <Typography
                  sx={{
                    lineHeight: '143%',
                    fontSize: '14px',
                    letterSpacing: '0.17px',
                  }}
                  color="primary"
                  mb="38px"
                >
                  {data?.description}
                </Typography>
              </Box>
            </Box>
            {data?.image && (
              <Box
                component="img"
                src={data?.image}
                alt="news"
                sx={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  maxHeight: '180px',
                  width: { xs: '100%', sm: 'auto' },
                  marginLeft: 'auto',
                  display: { xs: 'block', sm: 'none', lg: 'block' },
                }}
              />
            )}
          </Box>
        </CardActionArea>
      )}
    </CardContainer>
  );
};
