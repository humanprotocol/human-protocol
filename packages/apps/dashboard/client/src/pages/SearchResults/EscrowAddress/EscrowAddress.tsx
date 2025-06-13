import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import TitleSectionWrapper from '@/components/SearchResults';
import { AddressDetailsEscrowSchema } from '@/services/api/use-address-details';
import SectionWrapper from '@/shared/ui/SectionWrapper';

import HmtBalance from '../HmtBalance';

const EscrowAddress = ({
  data: {
    token,
    balance,
    factoryAddress,
    totalFundedAmount,
    amountPaid,
    status,
    launcher,
    exchangeOracle,
    recordingOracle,
    reputationOracle,
  },
}: {
  data: AddressDetailsEscrowSchema;
}) => {
  return (
    <SectionWrapper>
      <Stack gap={4}>
        <TitleSectionWrapper title="Token">
          <Typography variant="body2">{token}</Typography>
        </TitleSectionWrapper>
        {balance !== undefined && balance !== null ? (
          <TitleSectionWrapper title="Balance">
            <HmtBalance balance={balance} />
          </TitleSectionWrapper>
        ) : null}
        <TitleSectionWrapper
          title="Factory Address"
          tooltip="Address of EscrowFactory contract"
        >
          <Typography variant="body2">{factoryAddress}</Typography>
        </TitleSectionWrapper>
        <TitleSectionWrapper title="Total Funded Amount">
          <Stack direction="row" whiteSpace="nowrap">
            <Typography variant="body2">{totalFundedAmount}</Typography>
            <Typography
              component="span"
              variant="body2"
              ml={0.5}
              color="text.secondary"
            >
              HMT
            </Typography>
          </Stack>
        </TitleSectionWrapper>
        <TitleSectionWrapper title="Paid Amount">
          <Stack direction="row" whiteSpace="nowrap">
            <Typography variant="body2">{amountPaid}</Typography>
            <Typography
              component="span"
              variant="body2"
              ml={0.5}
              color="text.secondary"
            >
              HMT
            </Typography>
          </Stack>
        </TitleSectionWrapper>

        <TitleSectionWrapper title="Status">
          <Chip label={status} variant="outlined" color="secondary" />
        </TitleSectionWrapper>

        <TitleSectionWrapper
          title="Job Launcher"
          tooltip="Address of the Job Launcher that created the escrow"
        >
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {launcher}
          </Typography>
        </TitleSectionWrapper>

        <TitleSectionWrapper
          title="Exchange Oracle"
          tooltip="The Exchange Oracle is HUMAN Protocol's powerhouse, routing tasks to skilled workers ensuring smooth communication."
        >
          <Typography variant="body2">{exchangeOracle}</Typography>
        </TitleSectionWrapper>

        <TitleSectionWrapper
          title="Recording Oracle"
          tooltip={
            'The Recording Oracle is where task solutions get the green light. It is storing, and recording task solutions on the blockchain.\n' +
            '\n' +
            "From quality checks to reputation adjustments, it's the assurance you need for dependable results."
          }
        >
          <Typography variant="body2">{recordingOracle}</Typography>
        </TitleSectionWrapper>

        <TitleSectionWrapper
          title="Reputation Oracle"
          tooltip={
            'The Reputation Oracle is the trust engine of the HUMAN Protocol. It cross-checks validated solutions from the Recording Oracle, adjusts reputation scores, and manages payments.\n' +
            '\n' +
            "It's the final seal of quality and trust within the ecosystem."
          }
        >
          <Typography variant="body2">{reputationOracle}</Typography>
        </TitleSectionWrapper>
      </Stack>
    </SectionWrapper>
  );
};

export default EscrowAddress;
