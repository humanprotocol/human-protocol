import * as React from 'react';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useLoginUserMutation } from 'services/redux/api/authApi';
import { ILoginSchema, LoginPageView } from './LoginPageView';
import { Backdrop } from '../../components/Backdrop';

export const Login = () => {
  const [loginUser, { isLoading, isError, error, isSuccess }] =
    useLoginUserMutation();

  const onSubmitHandler: SubmitHandler<ILoginSchema> = (
    values: ILoginSchema
  ) => {
    loginUser(values);
  };

  const navigate = useNavigate();
  const to = '/job-create';

  React.useEffect(() => {
    if (isSuccess) {
      toast.success('Successfully Login');
      navigate(to);
    }
    if (isError) {
      const errorMessage: any = error || {};
      toast.error(errorMessage?.data?.message, {
        position: 'top-right',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, isError, isSuccess, navigate]);

  return (
    <>
      <LoginPageView onSubmitHandler={onSubmitHandler} />
      <Backdrop open={isLoading} />
    </>
  );
};
