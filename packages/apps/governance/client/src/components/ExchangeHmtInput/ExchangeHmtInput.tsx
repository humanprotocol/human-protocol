import { Trans } from '@lingui/macro'
import { ChangeEvent, useCallback } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { flexColumnNoWrap } from 'theme/styles'

import { AutoColumn } from '../Column'

const InputPanel = styled.div`
  ${flexColumnNoWrap};
  position: relative;
  border-radius: 4px;
  z-index: 1;
  width: 100%;
  margin-bottom: 24px;
`

const ContainerRow = styled.div<{ error: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  border: 2px solid ${({ error, theme }) => (error ? theme.accentFailure : theme.textPrimary)};
  transition: border-color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')},
    color 500ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  background-color: ${({ theme }) => theme.white};
`

const InputContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
`

const Input = styled.input<{ error?: boolean }>`
  font-size: 1.25rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: ${({ theme }) => theme.white};
  transition: color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  color: ${({ error, theme }) => (error ? theme.accentFailure : theme.textPrimary)};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  width: 100%;
  ::placeholder {
    color: ${({ theme }) => theme.deprecated_text4};
  }
  padding: 0px;
  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.deprecated_text4};
  }
`

const ErrorLabel = styled.div`
  position: absolute;
  bottom: -40%;
  left: 1%;
`

const TextButton = styled(ThemedText.DeprecatedMain)`
  color: ${({ theme }) => theme.accentAction};
  :hover {
    cursor: pointer;
    text-decoration: underline;
  }
`

const StyledAutoColumn = styled(AutoColumn)`
  width: 85%;
  padding-right: 6px;
`

export default function ExchangeHmtInput({
  className = 'recipient-address-input',
  placeholder = 'Enter amount',
  value,
  maxValue,
  onChange,
  onMaxChange,
  error,
}: {
  className?: string
  placeholder?: string
  value: string
  maxValue?: string
  onChange: (value: string) => void
  onMaxChange: (maxValue: string | undefined) => void
  error: string
}) {
  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value
      const withoutSpaces = input.replace(/\s+/g, '')
      onChange(withoutSpaces)
    },
    [onChange]
  )

  return (
    <InputPanel>
      <>
        <ContainerRow error={!!error}>
          <InputContainer>
            <StyledAutoColumn gap="md">
              <Input
                className={className}
                type="number"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                placeholder={placeholder ? placeholder : ``}
                error={!!error}
                pattern="^(0x[a-fA-F0-9]{40})$"
                onChange={handleInput}
                value={value}
              />
            </StyledAutoColumn>
            <TextButton onClick={() => onMaxChange(maxValue)}>
              <Trans>Max</Trans>
            </TextButton>
          </InputContainer>
        </ContainerRow>
        <ErrorLabel>
          <ThemedText.DeprecatedError error={!!error}>{error}</ThemedText.DeprecatedError>
        </ErrorLabel>
      </>
    </InputPanel>
  )
}
