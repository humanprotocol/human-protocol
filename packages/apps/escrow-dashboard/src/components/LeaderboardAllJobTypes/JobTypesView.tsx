import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Collapse,
  Grid,
  List,
  ListItemButton,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ViewTitle } from '../ViewTitle';
import tasksSvg from 'src/assets/tasks.svg';

import {
  ImageLabelingJobType,
  ImageLabelingJobTypeLabels,
  MarketMakingJobType,
  MarketMakingJobTypeLabels,
  OpenQueriesJobType,
  OpenQueriesJobTypeLabels,
  TextLabelingJobType,
  TextLabelingJobTypeLabels,
} from 'src/constants/leaderboard';

const JobTypeList = ({ label, values, labelMap }: any) => {
  const [collapseIn, setCollapseIn] = useState(true);

  const toggleCollapse = () => setCollapseIn(!collapseIn);

  return (
    <>
      <ListItemButton onClick={toggleCollapse}>
        <Typography variant="body1" color="primary">
          {label}
        </Typography>
      </ListItemButton>
      <Collapse in={collapseIn} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {values.map((jobType: any) => (
            <ListItemButton key={jobType} sx={{ pl: 4 }}>
              <Typography variant="body1" color="#5E69A6">
                {labelMap[jobType]}
              </Typography>
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </>
  );
};

export const JobTypeCard = () => {
  return (
    <Card>
      <CardMedia
        sx={{ height: 140 }}
        image="/static/images/cards/contemplative-reptile.jpg"
        title="green iguana"
      />
      <CardContent>
        <Typography
          gutterBottom
          variant="h6"
          component="div"
          fontWeight={500}
          mb={1}
        >
          Type of annotation task
        </Typography>
        <Typography variant="body1" color="text.secondary">
          It is a long established fact that a reader will be distracted by the
          readable content of a page when looking at its layout.
        </Typography>
      </CardContent>
    </Card>
  );
};

export const JobTypesView = () => {
  return (
    <Box mt={10}>
      <Link to="/leaderboard">
        <Button
          variant="outlined"
          color="primary"
          sx={{ mb: '60px' }}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
      </Link>
      <ViewTitle title="Job types" iconUrl={tasksSvg} fontSize={50} />
      <Box sx={{ mt: '54px', display: 'flex' }}>
        <List
          sx={{
            width: '100%',
            maxWidth: 240,
            bgcolor: 'background.paper',
            borderRadius: '4px',
            boxShadow:
              '0px 3px 64px 2px rgba(233, 235, 250, 0.20), 0px 8px 20px 1px rgba(133, 142, 198, 0.10), 0px 5px 5px -3px rgba(203, 207, 232, 0.50);',
            marginRight: '52px',
          }}
          component="nav"
        >
          <ListItemButton>
            <Typography variant="body1" color="primary">
              All
            </Typography>
          </ListItemButton>
          <JobTypeList
            label="Text labeling"
            values={Object.values(TextLabelingJobType)}
            labelMap={TextLabelingJobTypeLabels}
          />
          <JobTypeList
            label="Image labeling"
            values={Object.values(ImageLabelingJobType)}
            labelMap={ImageLabelingJobTypeLabels}
          />
          <JobTypeList
            label="Market Making"
            values={Object.values(MarketMakingJobType)}
            labelMap={MarketMakingJobTypeLabels}
          />
          <JobTypeList
            label="Open Queries"
            values={Object.values(OpenQueriesJobType)}
            labelMap={OpenQueriesJobTypeLabels}
          />
        </List>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={4}>
            <JobTypeCard />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <JobTypeCard />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <JobTypeCard />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <JobTypeCard />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <JobTypeCard />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <JobTypeCard />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
