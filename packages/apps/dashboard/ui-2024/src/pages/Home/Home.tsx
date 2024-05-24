import React, {useState} from 'react';
import PageWrapper from '@components/PageWrapper';
import Search from '@components/Search';
import ShadowIcon from '@components/ShadowIcon';

import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import SimpleBar from 'simplebar-react';
import { Link } from 'react-router-dom';


import bitfinex from '@assets/bitfinex.png';
import probitGlobal from '@assets/probitGlobal.png';
import gate from '@assets/gate.png';
import bing from '@assets/bing.png';
import coinlist from '@assets/coinlist.png';
import lbank from '@assets/lbank.png';
import cup from '@assets/cup.png';
import human from '@assets/human.png';
import exchange from '@assets/exchange.png';
import recording from '@assets/recording.png';
import reputation from '@assets/reputation.png';
import ethereum from '@assets/ethereum.png';

function createData(
  role: string,
  address: string,
  stake: string,
  networks: string,
  reputation: string,
  operator: string,
) {
  return { role, address, stake, networks, reputation, operator };
}

const rows = [
  createData('Job Launcher', '1A1zP...ivfNa', '1e-18 HMT', 'Polygon', 'Medium', '1%'),
  createData('Recording Oracle', '1A1zP...ivfNa', '1e-18 HMT', 'Polygon', 'High', '1%'),
  createData('Reputation Oracle', '1A1zP...ivfNa', '3e-18 HMT', 'Polygon', 'Medium', '2%'),
  createData('Exchange Oracle', '1A1zP...ivfNa', '4e-18 HMT', 'Polygon', 'Low', '1%'),
  createData('HUMAN App', '1A1zP...ivfNa', '2e-18 HMT', 'Polygon', 'Coming soon', '5%'),
];

interface Item {
  role: string,
  address: string,
  stake: string,
  networks: string,
  reputation: string,
  operator: string,
}


const Home: React.FC = () => {
  const [network, setNetwork] = useState('all');

  const handleChange = (event: SelectChangeEvent) => {
    setNetwork(event.target.value as string);
  };

  const renderIcon: React.FC<Item> = (item) => {
    let src = '';
    switch(item.role) {
      case 'Job Launcher':
        return (
          <div className='icon-table'>
            <span>JL</span>
          </div>
        );
      case 'Recording Oracle':
        src = recording;
        break;
      case 'Reputation Oracle':
        src = reputation;
        break;
      case 'Exchange Oracle':
        src = exchange;
        break;
      case 'HUMAN App':
        src = human;
        break;
      default:
        src = human;
        break;
    }

    return (
      <div className='icon-table'>
        <img src={src} alt="logo"/>
      </div>
    );
  }

  const renderReputation: React.FC<Item> = (item) => {
    switch(item.reputation) {
      case 'Medium':
        return (
          <div className='reputation-table reputation-table-medium'>
            {item.reputation}
          </div>
        );
      case 'High':
        return (
          <div className='reputation-table reputation-table-high'>
            {item.reputation}
          </div>
        );
      case 'Low':
        return (
          <div className='reputation-table reputation-table-low'>
            {item.reputation}
          </div>
        );
      case 'Coming soon':
        return (
          <div className='reputation-table reputation-table-soon'>
            {item.reputation}
          </div>
        );
      default:
        return (
          <div className='reputation-table reputation-table-soon'>
            {item.reputation}
          </div>
        );
    }
  }

  return (
    <PageWrapper violetHeader>
      <div className='home-page-header'>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>All HUMAN activity. In one place.</Typography>
        <Search className='home-page-search'/>
      </div>
      <div className='home-page-boxes'>
        <div className='home-page-box'>
          <div className='box-title'>
            Token
          </div>
          <div className='box-content'>
            <div className='box-icon'>
              <Tooltip title="HMT token price" arrow>
                <HelpOutlineIcon color="sky"/>
              </Tooltip>
            </div>
            <div>
              HMT Price
              <div className='count'>$0.0455</div>
            </div>
          </div>
          <div className='box-content'>
            <div className='box-icon'>
              <Tooltip title="Number if users holding HMT" arrow>
                <HelpOutlineIcon color="sky"/>
              </Tooltip>
            </div>
            <div>
              Holders
              <div className='count'>32,306</div>
            </div>
          </div>
        </div>
        <div className='home-page-box'>
          <div className='box-title'>
            Data Overview
            <Button
              sx={{ padding: '4px 10px' }}
              variant="outlined"
              color="secondary"
              component={Link}
              to="/graph"
            >
              View Charts
            </Button>
          </div>
          <div className='box-content'>
            <div className='box-icon'>
              <Tooltip title="Total transaction count. Transactions include actions like transferring HMT or initiating new escrows." arrow>
                <HelpOutlineIcon color="sky"/>
              </Tooltip>
            </div>
            <div>
              Total Transactions
              <div className='count'>1,786,573 <span>(12.8 TPS)</span></div>
            </div>
          </div>
          <div className='box-content'>
            <div className='box-icon'>
              <Tooltip title="Total number of tasks solved by HUMAN Protocol workers." arrow>
                <HelpOutlineIcon color="sky"/>
              </Tooltip>
            </div>
            <div>
              Total Number of Tasks
              <div className='count'>2,658,409</div>
            </div>
          </div>
        </div>
        <div className='home-page-box'>Graf</div>
      </div>
      <span className='home-page-find-title-mobile'>Find HMT at</span>
      <SimpleBar>
        <div className='home-page-find'>
          <span>Find HMT at</span>
          <span><img src={bitfinex} alt="logo"/>Bitfinex</span>
          <span><img src={probitGlobal} alt="logo"/>Probit Global</span>
          <span><img src={gate} alt="logo"/>Gate.io</span>
          <span><img src={bing} alt="logo"/>BingX</span>
          <span><img src={coinlist} alt="logo"/>Coinlist Pro</span>
          <span><img src={lbank} alt="logo"/>LBank</span>
        </div>
      </SimpleBar>


      <ShadowIcon className='home-page-leaderboard' title='Leaderboard' img={cup}/>

      <TableContainer component={Paper} sx={{ padding: "32px", marginTop: '30px' }}>
        <SimpleBar>
          <Table
            sx={{
              minWidth: 650,
              [`& .${tableCellClasses.root}`]: {
                borderBottom: "none"
              }
            }}
            aria-label="simple table"
          >
            <TableHead>
              <TableRow className='home-page-table-header'>
                <TableCell>
                  ROLE
                </TableCell>
                <TableCell>
                  <div className='icon-table'>
                    <Tooltip title="Address of the role" arrow>
                      <HelpOutlineIcon color="sky"/>
                    </Tooltip>
                    <span>ADDRESS</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='icon-table'>
                    <Tooltip title="Amount of HMT staked" arrow>
                      <HelpOutlineIcon color="sky"/>
                    </Tooltip>
                    <span>STAKE</span>
                  </div>
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <InputLabel id="network-select-label">By Network</InputLabel>
                    <Select
                      labelId="network-select-label"
                      id="network-select"
                      value={network}
                      label="By Network"
                      onChange={handleChange}
                    >
                      <MenuItem className='select-item' value={'all'}><img src={human} alt="logo"/>All Networks</MenuItem>
                      <MenuItem value={'ethereum'}>Ethereum</MenuItem>
                      <MenuItem value={'goerli'}>Ethereum Goerli</MenuItem>
                      <MenuItem value={'binance'}>Binance Smart Chain</MenuItem>
                      <MenuItem value={'testnet'}>Binance Smart Chain (Testnet)</MenuItem>
                      <MenuItem value={'polygon'}>Polygon</MenuItem>
                      <MenuItem value={'mumbai'}>Polygon Mumbai</MenuItem>
                      <MenuItem value={'moonbeam'}>Moonbeam</MenuItem>
                      <MenuItem value={'alpha'}>Moonbase Alpha</MenuItem>
                      <MenuItem value={'celo'}>Celo</MenuItem>
                      <MenuItem value={'alfajores'}>Celo Alfajores</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <div className='icon-table'>
                    <Tooltip title="Reputation of the role as per their activities " arrow>
                      <HelpOutlineIcon color="sky"/>
                    </Tooltip>
                    <span>REPUTATION SCORE</span>
                  </div>
                </TableCell>
                <TableCell>OPERATOR FEE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.role}
                  className='home-page-table-row'
                >
                  <TableCell>
                    {renderIcon(row)}{row.role}
                  </TableCell>
                  <TableCell >
                    <Grid container wrap="nowrap"  alignItems="center" sx={{ gap: "18px"}}>
                      {row.address}
                      <ContentCopyIcon color="sky"/>
                    </Grid>
                  </TableCell>
                  <TableCell >{row.stake}</TableCell>
                  <TableCell >
                    <Grid container wrap="nowrap" alignItems="center" sx={{ gap: "18px"}}>
                      <img src={ethereum} alt="logo"/>
                      {row.networks}
                    </Grid>
                  </TableCell>
                  <TableCell >{renderReputation(row)}</TableCell>
                  <TableCell >{row.operator}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SimpleBar>
      </TableContainer>
    </PageWrapper>
  );
};

export default Home;