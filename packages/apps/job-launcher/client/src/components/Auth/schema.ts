import * as Yup from 'yup';
import { ERROR_MESSAGES } from '../../constants';

export const LoginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email(ERROR_MESSAGES.invalidEmail)
    .required(ERROR_MESSAGES.requireEmail),
  password: Yup.string().required(ERROR_MESSAGES.requirePassword),
  token: Yup.string().required(ERROR_MESSAGES.captchaPassRequired),
});

export const RegisterValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email(ERROR_MESSAGES.invalidEmail)
    .required(ERROR_MESSAGES.requireEmail),
  password: Yup.string()
    .required(ERROR_MESSAGES.requirePassword)
    .matches(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!*]).*$/,
      ERROR_MESSAGES.weakPassword
    )
    .min(8, ERROR_MESSAGES.invalidPasswordLength)
    .max(255, ERROR_MESSAGES.invalidPasswordMaxLength),
  confirm: Yup.string()
    .required(ERROR_MESSAGES.requirePassword)
    .oneOf([Yup.ref('password'), ''], ERROR_MESSAGES.notConfirmedPassword),
  hcaptchaToken: Yup.string().required(ERROR_MESSAGES.captchaPassRequired),
});

export const ForgotPasswordValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email(ERROR_MESSAGES.invalidEmail)
    .required(ERROR_MESSAGES.requireEmail),
  hcaptchaToken: Yup.string().required(ERROR_MESSAGES.captchaPassRequired),
});

export const ResetPasswordValidationSchema = Yup.object().shape({
  password: Yup.string()
    .required(ERROR_MESSAGES.requirePassword)
    .matches(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!*]).*$/,
      ERROR_MESSAGES.weakPassword
    )
    .min(8, ERROR_MESSAGES.invalidPasswordLength)
    .max(255, ERROR_MESSAGES.invalidPasswordMaxLength),
  repeatPassword: Yup.string()
    .required(ERROR_MESSAGES.requirePassword)
    .oneOf([Yup.ref('password'), ''], ERROR_MESSAGES.notConfirmedPassword),
  hcaptchaToken: Yup.string().required(ERROR_MESSAGES.captchaPassRequired),
});

export const ResendEmailVerificationSchema = Yup.object().shape({
  email: Yup.string()
    .email(ERROR_MESSAGES.invalidEmail)
    .required(ERROR_MESSAGES.requireEmail),
});
