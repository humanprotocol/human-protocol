import * as React from 'react';
import { SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ISignUpSchema, SignUpView } from './SignUpView';
import { useSignUpUserMutation } from '../../services/redux/api/authApi';
import { Backdrop } from '../../components/Backdrop';

export const SignUp: React.FC = () => {
  const [signUp, { isLoading, isError, error, isSuccess }] =
    useSignUpUserMutation();

  const onSubmitHandler: SubmitHandler<ISignUpSchema> = (
    values: ISignUpSchema
  ) => {
    signUp(values);
  };

  const navigate = useNavigate();

  React.useEffect(() => {
    if (isSuccess) {
      toast.success('Successfully Sign Up');
      navigate('/job-create');
    }
    if (isError) {
      const errorMessage: any = error;
      toast.error(errorMessage?.data?.message, {
        position: 'top-right',
      });
    } else {
      const errorMessage: any = error;
      toast.error(errorMessage?.data?.message, {
        position: 'top-right',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isError, error]);

  return (
    <>
      <SignUpView onSubmitHandler={onSubmitHandler} />
      <Backdrop open={isLoading} />
    </>
  );
};
