import { Box, CardActionArea, Typography } from '@mui/material';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { CardContainer } from '../Cards';
import { useHumanProtocolNews } from 'src/hooks/useHumanProtocolNews';

export const NewsView = () => {
  const { data, isLoading } = useHumanProtocolNews();

  return (
    <CardContainer sxProps={{ padding: 0 }}>
      {isLoading ? (
        <Box
          sx={{
            px: { xs: '24px', lg: '34px', xl: '40px' },
            pt: { xs: '26px', lg: '34px', xl: '36px' },
            pb: '16px',
          }}
        >
          <Box sx={{ mb: '20px' }}>
            <SkeletonTheme
              baseColor="rgba(0, 0, 0, 0.1)"
              highlightColor="rgba(0, 0, 0, 0.18)"
            >
              <Skeleton count={1} width="72px" height="32px" />
            </SkeletonTheme>
          </Box>
          <Box sx={{ mb: '14px' }}>
            <SkeletonTheme
              baseColor="rgba(0, 0, 0, 0.1)"
              highlightColor="rgba(0, 0, 0, 0.18)"
            >
              <Skeleton count={1} width="100%" height="72px" />
            </SkeletonTheme>
          </Box>
          <Box sx={{ mb: '38px' }}>
            <SkeletonTheme
              baseColor="rgba(0, 0, 0, 0.1)"
              highlightColor="rgba(0, 0, 0, 0.18)"
            >
              <Skeleton count={1} width="100%" height="40px" />
            </SkeletonTheme>
          </Box>
          <Box>
            <SkeletonTheme
              baseColor="rgba(0, 0, 0, 0.1)"
              highlightColor="rgba(0, 0, 0, 0.18)"
            >
              <Skeleton count={1} width="100%" height="200px" />
            </SkeletonTheme>
          </Box>
        </Box>
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
                px: { xs: '8px', lg: '18px', xl: '24px' },
                pt: { xs: '10px', lg: '18px', xl: '20px' },
              }}
            >
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
                  mb: '20px',
                  width: '72px',
                  height: '32px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              >
                NEWS
              </Box>
              <Typography
                sx={{
                  lineHeight: '150%',
                  fontSize: '24px',
                  maxWidth: '375px',
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
                  maxWidth: '375px',
                  letterSpacing: '0.17px',
                }}
                color="primary"
                mb="38px"
              >
                {data?.description}
              </Typography>
            </Box>
            {data?.image && (
              <Box
                component="img"
                src={data?.image}
                alt="news"
                sx={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  width: { xs: 'calc(100% - 20px)', md: '100%' },
                  mx: { xs: '10px', md: 0 },
                }}
              />
            )}
          </Box>
        </CardActionArea>
      )}
    </CardContainer>
  );
};
