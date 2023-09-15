import { Tab, Tabs } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledTab = styled(Tab)((props) => ({
  padding: '36px 100px 20px',
  textTransform: 'none',
  fontSize: '20px',
  fontWeight: 500,
  background: '#e9ebfa',
  borderTop: '16px solid #F6F7FE',
  borderLeft: props.value === 0 ? '12px solid #F6F7FE' : 'none',
  borderRight: props.value === 1 ? '12px solid #F6F7FE' : 'none',
  borderTopLeftRadius: props.value === 0 ? '32px' : 0,
  borderTopRightRadius: props.value === 1 ? '32px' : 0,
  '&.Mui-selected': {
    background: '#fff',
    border: '1px solid #dbe1f6',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    borderBottom: 'none',
  },
}));

export const StyledTabs = styled(Tabs)`
  & .MuiTabs-indicator {
    display: none;
  }
  & .MuiTabs-flexContainer {
    background: #F6F7FE;
  }
  margin-bottom: -1px;
}`;

export const HomeStyledTabs = styled(Tabs)`
  & .MuiTabs-indicator {
    display: none;
  }
  margin-bottom: -1px;
}`;

export const HomeStyledTab = styled(Tab)((props) => ({
  padding: '36px 100px 20px',
  textTransform: 'none',
  fontSize: '20px',
  fontWeight: 500,
  background: '#e9ebfa',
  borderTop: '16px solid #fff',
  borderLeft: props.value === 0 ? '12px solid #fff' : 'none',
  borderRight: props.value === 1 ? '12px solid #fff' : 'none',
  borderTopLeftRadius: props.value === 0 ? '32px' : 0,
  borderTopRightRadius: props.value === 1 ? '32px' : 0,
  '&.Mui-selected': {
    background: '#fff',
    border: '1px solid #dbe1f6',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    borderBottom: 'none',
  },
}));
