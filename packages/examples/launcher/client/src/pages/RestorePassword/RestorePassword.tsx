import * as React from 'react';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRestorePasswordMutation } from 'services/redux/api/authApi';
import { IRestoreSchema, RestorePasswordView } from './RestorePasswordView';

export const RestorePassword = () => {
  const [restore, { isLoading, isError, error, isSuccess }] =
    useRestorePasswordMutation();

  const onSubmitHandler: SubmitHandler<IRestoreSchema> = (
    values: IRestoreSchema
  ) => {
    restore(values);
  };

  const navigate = useNavigate();
  const location: any = useLocation();
  const from = location.state?.from.pathname || '/profile';

  React.useEffect(() => {
    const errorMessage: any = error || {};
    if (isSuccess) {
      toast.success('Successfully Restore Password');
      navigate(from);
    }
    if (isError) {
      toast.error(errorMessage?.data?.message, {
        position: 'top-right',
      });
    } else {
      toast.error(errorMessage?.data?.message, {
        position: 'top-right',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);
  return <RestorePasswordView onSubmitHandler={onSubmitHandler} />;
};
