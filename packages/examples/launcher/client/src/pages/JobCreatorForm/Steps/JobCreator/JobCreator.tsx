import * as React from 'react';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { makeTxHashSelector } from 'services/redux/selectors/jobs';
import {
  useJobApprovalMutation,
  useJobCreationFromDashMutation,
} from 'services/redux/api/jobApi';
import { Backdrop } from 'components/Backdrop';
import { transferERC20 } from 'components/Eth/useEth';
import { setTx } from 'services/redux/slices/jobSlice';
import { IJobCreatorFormSchema } from './schema';

import { JobCreatorFormView } from './JobCreatorView';

interface IJobCreatorFormStepOne {
  nextStep: () => void;
}
export const JobCreatorFormStepOne: React.FC<IJobCreatorFormStepOne> = ({
  nextStep,
}) => {
  const dispatch = useDispatch();
  const [jobId, setJobId] = React.useState<number>();
  const [open, setOpen] = React.useState(false);

  const [createJob] = useJobCreationFromDashMutation();
  const [approveJob, { isLoading, isError, error, isSuccess }] =
    useJobApprovalMutation();

  const handleClose = (value: boolean) => {
    setOpen(value);
  };

  const onSubmitHandler: SubmitHandler<IJobCreatorFormSchema> = async (
    values: IJobCreatorFormSchema
  ) => {
    setOpen(true);
    try {
      const job = await createJob(values).unwrap();
      const { id, escrowAddress, data, price, annotationsPerImage } = job;

      setJobId(id);

      transferERC20({
        address: escrowAddress,
        fundAmount: data.length * price * annotationsPerImage,
        backdropCallback: handleClose,
      });
    } catch (err) {
      toast.error('oops something went wrong please try again', {
        position: 'top-right',
      });
    }
  };

  const getTxHash = useSelector(makeTxHashSelector);
  React.useEffect(() => {
    if (getTxHash) {
      approveJob({ id: jobId, transactionHash: getTxHash });
    }
    dispatch(setTx({ hash: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTxHash]);

  React.useEffect(() => {
    if (isLoading) {
      handleClose(true);
    } else {
      handleClose(false);
    }
  }, [isLoading]);

  const navigate = useNavigate();
  React.useEffect(() => {
    if (isSuccess) {
      toast.success('Success');
      navigate('/job-created-success', { replace: true });
    }
    if (isError) {
      const errorData: any = error;
      toast.error(errorData.data.message, {
        position: 'top-right',
      });
    }
    if (error) {
      toast.error('oops something went wrong please try again', {
        position: 'top-right',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, isError, isLoading, isSuccess]);
  return (
    <>
      <JobCreatorFormView
        onSubmitHandler={onSubmitHandler}
        nextStep={nextStep}
      />
      <Backdrop open={open} handleClose={handleClose} />
    </>
  );
};
