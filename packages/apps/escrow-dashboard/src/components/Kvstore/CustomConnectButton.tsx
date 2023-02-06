import { ConnectButton } from '@rainbow-me/rainbowkit';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
export const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted ;
        const connected =
          ready &&
          account &&
          chain 
        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                        <Button sx={{marginLeft:{xs:0.7,sm:0.7,md:0}}}  onClick={openConnectModal} variant="outlined">
                    Connect Wallet
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <Button onClick={openConnectModal} variant="outlined">
                    Wrong Network
                  </Button>
                );
              }
              return (
                      <Box sx={{ display: 'flex', gap: 12 }}>
                  <Button
                    endIcon={<ArrowDropDownIcon />}
                    onClick={openAccountModal}
                    variant="contained"
                    sx={{
                      '&:hover': {
                        color: 'gray',
                        backgroundColor: '#f6f7fd',
                      },
                      borderRadius: 12,
                      paddingLeft: 1,
                      paddingTop: 0.4,
                      paddingBottom: 0.4,
                      backgroundColor: '#f6f7fe',
                      color: '#320a8d',
                    }}
                    startIcon={
                      <Avatar

                          src={"https://cdn.stamp.fyi/avatar/eth:"+account.displayName}
                      />
                    }
                  >
                    {' '}
                    {account.displayName}
                  </Button>
                </Box>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
