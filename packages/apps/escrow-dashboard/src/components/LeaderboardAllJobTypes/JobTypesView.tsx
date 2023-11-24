import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import {
  Box,
  Button,
  Card,
  CardMedia,
  Collapse,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { ViewTitle } from '../ViewTitle';
import tasksSvg from 'src/assets/tasks.svg';
import {
  ImageLabelingJobType,
  ImageLabelingJobTypeData,
  MarketMakingJobType,
  MarketMakingJobTypeData,
  OpenQueriesJobType,
  OpenQueriesJobTypeData,
  TextLabelingJobType,
  TextLabelingJobTypeData,
} from 'src/constants/leaderboard';

const JobTypeList = ({ label, values, labelMap, open, onClick }: any) => {
  return (
    <>
      <ListItemButton onClick={onClick}>
        <ListItemText>
          <Typography variant="body1" color="primary" fontWeight={500}>
            {label}
          </Typography>
        </ListItemText>
        {open ? (
          <ArrowDropUpIcon color="primary" />
        ) : (
          <ArrowDropDownIcon color="primary" />
        )}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {values.map((jobType: any) => (
            <ListItemButton key={jobType} sx={{ pl: 4 }}>
              <Typography variant="body1" color="#5E69A6">
                {labelMap[jobType].label}
              </Typography>
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </>
  );
};

export const JobTypeCard = ({
  image,
  label,
  description,
}: {
  image?: string;
  label?: string;
  description?: string;
}) => {
  return (
    <Card sx={{ boxShadow: '0px 0px 0px 1px #E9EBFA;', height: '100%' }}>
      <CardMedia sx={{ height: 200 }} image={image} title={label} />
      <Box sx={{ padding: '16px' }}>
        <Typography
          gutterBottom
          variant="h6"
          component="div"
          fontWeight={500}
          my={1}
        >
          {label}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          lineHeight={1.5}
          mb={2}
        >
          {description}
        </Typography>
      </Box>
    </Card>
  );
};

enum JobTypeFilter {
  All = 'All',
  TextLabeling = 'Text Labeling',
  ImageLabeling = 'Image Labeling',
  MarketMaking = 'Market Making',
  OpenQueries = 'Open Queries',
}

const FilterData = [
  {
    filterKey: JobTypeFilter.TextLabeling,
    values: Object.values(TextLabelingJobType),
    labelMap: TextLabelingJobTypeData,
  },
  {
    filterKey: JobTypeFilter.ImageLabeling,
    values: Object.values(ImageLabelingJobType),
    labelMap: ImageLabelingJobTypeData,
  },
  {
    filterKey: JobTypeFilter.MarketMaking,
    values: Object.values(MarketMakingJobType),
    labelMap: MarketMakingJobTypeData,
  },
  {
    filterKey: JobTypeFilter.OpenQueries,
    values: Object.values(OpenQueriesJobType),
    labelMap: OpenQueriesJobTypeData,
  },
];

export const JobTypesView = () => {
  const [filter, setFilter] = useState(JobTypeFilter.All);

  const filteredMapData = useMemo(() => {
    if (filter === JobTypeFilter.All) {
      return FilterData.map(({ labelMap }) => labelMap);
    }
    const item = FilterData.find(({ filterKey }) => filterKey === filter);
    if (item) return [item.labelMap];

    return [];
  }, [filter]);

  console.log(filteredMapData.flatMap((d) => Object.values(d)));

  return (
    <Box mt="58px">
      <Link to="/leaderboard">
        <Button
          variant="outlined"
          color="primary"
          sx={{ mb: '58px' }}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
      </Link>
      <ViewTitle title="Job types" iconUrl={tasksSvg} fontSize={45} />
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
          <ListItemButton onClick={() => setFilter(JobTypeFilter.All)}>
            <Typography variant="body1" color="primary" fontWeight={500}>
              {JobTypeFilter.All}
            </Typography>
          </ListItemButton>
          {FilterData.map(({ filterKey, values, labelMap }) => (
            <JobTypeList
              key={filterKey}
              label={filterKey}
              values={values}
              labelMap={labelMap}
              open={filter === filterKey || filter === JobTypeFilter.All}
              onClick={() => setFilter(filterKey)}
            />
          ))}
        </List>
        <Grid container spacing={4}>
          {filteredMapData
            .flatMap((d) => Object.values(d))
            .map(({ label, description, image }, i) => (
              <Grid key={i} item xs={12} md={6} lg={4}>
                <JobTypeCard
                  label={label}
                  description={description}
                  image={image}
                />
              </Grid>
            ))}
        </Grid>
      </Box>
    </Box>
  );
};
