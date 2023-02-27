import Box from '@mui/material/Box';
import { Button, Grid, Link, Typography } from '@mui/material';
import fortuneImg from 'src/assets/fortune.png';
import requestFortunesImg from 'src/assets/request-fortunes.png';
import submitFortunesImg from 'src/assets/submit-fortunes.png';

function HomePage() {
  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }, pt: 10 }}>
      <Box
        sx={{
          background: '#f6f7fe',
          borderRadius: {
            xs: '16px',
            sm: '16px',
            md: '24px',
            lg: '32px',
            xl: '40px',
          },
          padding: {
            xs: '24px 16px',
            md: '42px 54px',
            lg: '56px 72px',
            xl: '70px 90px',
          },
        }}
      >
        <Grid container spacing={4}>
          <Grid item xs={12} sm={12} md={5} lg={4}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <img
                src={fortuneImg}
                alt="fortune"
                style={{ width: 83, height: 48 }}
              />
              <Typography color="primary" fontWeight={600} variant="h4" mt={2}>
                Fortune
              </Typography>
              <Typography color="primary" fontWeight={500} variant="h6">
                HUMAN Protocol basic functionality demo
              </Typography>
              <Typography mt={4} color="primary" variant="body2">
                Based on an old Unix program in which a pseudorandom message is
                displayed from a database of quotations, created by the
                community. We&apos;re adopting this basic idea, and
                decentralizing it, placing the basic ask-and-receive
                functionality on-chain.
              </Typography>
              <Link
                href="#"
                sx={{ textDecoration: 'none', mt: 1, display: 'block' }}
              >
                <Typography color="primary" fontWeight={600} variant="body2">
                  Blog Article
                </Typography>
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} sm={12} md={7} lg={8}>
            <Box p={4} sx={{ background: '#fff', borderRadius: 4 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      background: '#fbfbfe',
                      borderRadius: '10px',
                      textAlign: 'center',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      flexDirection: 'column',
                      py: 8,
                    }}
                  >
                    <img src={requestFortunesImg} alt="request" />
                    <Typography variant="h4" fontWeight={600} mt={2.5}>
                      Request Fortunes
                    </Typography>
                    <Button
                      href="/request"
                      variant="contained"
                      sx={{ mt: 12, minWidth: '200px' }}
                    >
                      Job Request
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      background: '#fbfbfe',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      flexDirection: 'column',
                      py: 8,
                    }}
                  >
                    <img src={submitFortunesImg} alt="submit" />
                    <Typography variant="h4" fontWeight={600} mt={2.5}>
                      Submit Fortunes
                    </Typography>
                    <Button
                      href="/jobs"
                      variant="contained"
                      sx={{ mt: 12, minWidth: '200px' }}
                    >
                      Check Fortune Jobs
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default HomePage;
