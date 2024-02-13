import { darken } from 'polished'
import { Button as RebassButton, ButtonProps as ButtonPropsOriginal } from 'rebass/styled-components'
import styled from 'styled-components/macro'

type ButtonProps = Omit<ButtonPropsOriginal, 'css'>

const ButtonOverlay = styled.div`
  background-color: transparent;
  bottom: 0;
  border-radius: inherit;
  height: 100%;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  transition: 150ms ease background-color;
  width: 100%;
`

type BaseButtonProps = {
  padding?: string
  width?: string
  $borderRadius?: string
  altDisabledStyle?: boolean
} & ButtonProps

const BaseButton = styled(RebassButton)<BaseButtonProps>`
  padding: ${({ padding }) => padding ?? '16px'};
  width: ${({ width }) => width ?? '100%'};
  font-weight: 500;
  text-align: center;
  border-radius: ${({ $borderRadius }) => $borderRadius ?? '4px'};
  outline: none;
  border: 1px solid transparent;
  color: ${({ theme }) => theme.textPrimary};
  text-decoration: none;
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  align-items: center;
  cursor: pointer;
  position: relative;
  z-index: 1;
  &:disabled {
    cursor: auto;
    pointer-events: none;
  }

  will-change: transform;
  transition: transform 450ms ease;
  transform: perspective(1px) translateZ(0);

  > * {
    user-select: none;
  }

  > a {
    text-decoration: none;
  }
`

export const ButtonPrimary = styled(BaseButton)`
  background-color: ${({ theme }) => theme.accentAction};
  font-size: 15px;
  font-weight: 600;
  padding: 16px;
  color: ${({ theme }) => theme.accentTextLightPrimary};
  box-shadow: 0px 1px 5px 0px rgba(233, 235, 250, 0.2), 0px 2px 2px 0px rgba(233, 235, 250, 0.5),
    0px 3px 1px -2px #e9ebfa;

  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.accentAction)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.accentActive)};
    background-color: ${({ theme }) => darken(0.1, theme.accentActive)};
  }
  &:disabled {
    background-color: ${({ theme, altDisabledStyle, disabled }) =>
      altDisabledStyle ? (disabled ? theme.accentAction : theme.backgroundInteractive) : theme.accentDarkGray};
    color: ${({ altDisabledStyle, disabled, theme }) =>
      altDisabledStyle ? (disabled ? theme.white : theme.textSecondary) : theme.accentGray};
    cursor: auto;
    box-shadow: none;
    border: 1px solid transparent;
    outline: none;
  }
`

export const SmallButtonPrimary = styled(ButtonPrimary)`
  width: auto;
  font-size: 16px;
  padding: ${({ padding }) => padding ?? '8px 12px'};

  border-radius: 4px;
`

export const ButtonSecondary = styled(BaseButton)`
  border: 1px solid ${({ theme }) => theme.deprecated_primary4};
  color: ${({ theme }) => theme.accentAction};
  background-color: transparent;
  font-size: 16px;
  border-radius: 4px;
  padding: ${({ padding }) => (padding ? padding : '10px')};

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => theme.deprecated_primary4};
    border: 1px solid ${({ theme }) => theme.deprecated_primary3};
  }
  &:hover {
    border: 1px solid ${({ theme }) => theme.deprecated_primary3};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => theme.deprecated_primary4};
    border: 1px solid ${({ theme }) => theme.deprecated_primary3};
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
  a:hover {
    text-decoration: none;
  }
`

export const ButtonEmpty = styled(BaseButton)`
  background-color: transparent;
  color: ${({ theme }) => theme.accentAction};
  display: flex;
  justify-content: center;
  align-items: center;

  &:focus {
    text-decoration: underline;
  }
  &:hover {
    text-decoration: none;
  }
  &:active {
    text-decoration: none;
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
`

const BaseButtonLight = styled(BaseButton)`
  background-color: ${({ theme }) => theme.accentActionSoft};
  color: ${({ theme }) => theme.accentAction};
  font-size: 20px;
  font-weight: 600;

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme, disabled }) => !disabled && theme.accentActionSoft};
    background-color: ${({ theme, disabled }) => !disabled && theme.accentActionSoft};
  }
  &:hover {
    background-color: ${({ theme, disabled }) => !disabled && theme.accentActionSoft};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme, disabled }) => !disabled && theme.accentActionSoft};
    background-color: ${({ theme, disabled }) => !disabled && theme.accentActionSoft};
  }

  :hover {
    ${ButtonOverlay} {
      background-color: ${({ theme }) => theme.stateOverlayHover};
    }
  }

  :active {
    ${ButtonOverlay} {
      background-color: ${({ theme }) => theme.stateOverlayPressed};
    }
  }

  :disabled {
    opacity: 0.4;
    :hover {
      cursor: auto;
      background-color: transparent;
      box-shadow: none;
      border: 1px solid transparent;
      outline: none;
    }
  }
`

export const ButtonLight = ({ children, ...rest }: BaseButtonProps) => {
  return (
    <BaseButtonLight {...rest}>
      <ButtonOverlay />
      {children}
    </BaseButtonLight>
  )
}
