import { Grid, Box, Typography } from '@mui/material';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import LoadingButton from '@mui/lab/LoadingButton';
import { config } from 'config';
import FormInput from '../../../../components/FormInput/FormInput';
import { BoxContainer } from '../../../../components/Grid';
import {
  defaultValues,
  IJobCreatorFormSchema,
  jobCreationSchema,
} from './schema';
import { Title } from './tooltipHints';
import MultiFormInput from '../../../../components/FormInput/MultiFormInput';

interface IJobCreatorForm {
  onSubmitHandler: (values: IJobCreatorFormSchema) => void;
  nextStep?: () => void;
}

export const JobCreatorFormView: React.FC<IJobCreatorForm> = ({
  onSubmitHandler,
}) => {
  const methods = useForm<IJobCreatorFormSchema>({
    resolver: zodResolver(jobCreationSchema),
    defaultValues,
  });
  const { handleSubmit } = methods;

  return (
    <BoxContainer>
      <FormProvider {...methods}>
        <Box sx={{ margin: '0 auto' }}>
          <Typography
            variant="h5"
            component="div"
            sx={{
              textAlign: 'center',
              pb: { sm: '1rem' },
              color: '#616161',
            }}
          >
            Job launcher address:
          </Typography>
          <Typography
            component="div"
            sx={{
              textAlign: 'center',
              pb: { sm: '1rem' },
              color: '#616161',
              mb: '20px',
            }}
          >
            {config.jobLauncherAddress}
          </Typography>
          <Box
            sx={{
              mx: '80px',
            }}
          >
            <Grid>
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                component="form"
                autoComplete="on"
                onSubmit={handleSubmit(onSubmitHandler)}
              >
                <Box>
                  <MultiFormInput
                    name="labels"
                    label="labels"
                    tooltipTitle={Title.Labels}
                  />

                  <FormInput
                    label="data url"
                    type="text"
                    name="dataUrl"
                    autoComplete="dataUrl"
                    tooltipTitle={Title.DataUrl}
                  />
                  <FormInput
                    type="string"
                    label="requester description"
                    name="requesterDescription"
                    autoComplete="requesterDescription"
                    tooltipTitle={Title.RequesterDescription}
                  />
                  <FormInput
                    type="string"
                    label="annotations per image"
                    name="annotationsPerImage"
                    autoComplete="annotationsPerImage"
                    tooltipTitle={Title.AnnotationsPerImage}
                  />
                  <FormInput
                    type="number"
                    label="requester accuracy target"
                    name="requesterAccuracyTarget"
                    autoComplete="requesterAccuracyTarget"
                    tooltipTitle={Title.RequesterAccuracyTarget}
                  />
                  <FormInput
                    type="number"
                    label="price"
                    name="price"
                    tooltipTitle={Title.Price}
                  />
                </Box>
                <LoadingButton
                  loading={false}
                  type="submit"
                  variant="contained"
                  sx={{
                    py: '0.8rem',
                    mt: 2,
                    width: '100%',
                    marginInline: 'auto',
                    backgroundColor: '#fff',
                    color: '#6309ff',
                    border: '1px solid #6309ff',
                    '&:hover': {
                      backgroundColor: '#6309ff',
                      color: '#fff',
                    },
                  }}
                >
                  Pay and Confirm
                </LoadingButton>
              </Box>
            </Grid>
          </Box>
        </Box>
      </FormProvider>
    </BoxContainer>
  );
};
//  <AutocompleteFormInput
//                     name="labels"
//                     label="labels"
//                     tooltipTitle={Title.Labels}
//                   />
//  <FormInput
//                     type="string"
//                     label="requester question example"
//                     name="requesterQuestionExample"
//                     autoComplete="requesterQuestionExample"
//                     tooltipTitle={Title.RequesterQuestionExample}
//                   />
//                    <FormInput
//                       type="number"
//                       label="network id"
//                       name="networkId"
//                       autoComplete="networkId"
//                     />
//                     <FormInput
//                       type="string"
//                       label="request type"
//                       name="requestType"
//                       autoComplete="requestType"
//                     />
//                   <FormInput
//                       type="string"
//                       label="dataset length"
//                       name="datasetLength"
//                       autoComplete="datasetLength"
//                     />
//                    <FormInput
//                     type="string"
//                     label="transaction hash"
//                     name="transactionHash"
//                     autoComplete="transactionHash"
//                     tooltipTitle={Title.TransactionHash}
//                   />
//                    <FormInput
//                     type="string"
//                     label="requester question"
//                     name="requesterQuestion"
//                     autoComplete="requesterQuestion"
//                     tooltipTitle={Title.RequesterQuestion}
//                   />
