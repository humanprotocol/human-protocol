import { ConnectButton } from '@rainbow-me/rainbowkit';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
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
                  <Button onClick={openConnectModal} variant="outlined">
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
                <div style={{ display: 'flex', gap: 12 }}>
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
                        alt="Remy Sharp"
                        src="/static/images/avatar/1.jpg"
                      />
                    }
                  >
                    {' '}
                    {account.displayName}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
