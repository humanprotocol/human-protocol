import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { ROLES } from 'src/constants';
import useLeaderboardData from 'src/hooks/useLeaderboardData';
import { shortenAddress } from 'src/utils';

export const LeaderboardView = ({
  showAll = true,
}: {
  showAll?: boolean;
}): React.ReactElement => {
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const stakers = useLeaderboardData();

  const displayRows = useMemo(() => {
    if (!stakers) return [];
    if (!showAll) return stakers.slice(0, 5);
    if (selectedRoles.length === 0) return stakers;
    return stakers.filter((s) => selectedRoles.includes(s.role));
  }, [showAll, selectedRoles, stakers]);

  const handleRoleCheckbox = (role: number) => (e: any) => {
    if (e.target.checked) {
      setSelectedRoles([...selectedRoles, role]);
    } else {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    }
  };

  return (
    <Grid container>

      <Grid item xs={12} sm={showAll ? 9 : 12} md={showAll ? 10 : 12}>
      on the works
      </Grid>
    </Grid>
  );
};
