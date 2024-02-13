/* eslint-disable prettier/prettier */

// import { Trans } from "@lingui/macro";
import { ChangeEvent, useCallback } from "react";
import styled from "styled-components/macro";
// import { ThemedText } from "theme";

// import { AutoColumn } from "../Column";

const ContainerRow = styled.div`
  
  align-items: center;
  border-radius: 4px;

  transition: border-color 300ms step-start
  background-color: #fff;
`;
const InputContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0.5rem 1rem;
`;

const Input = styled.input`
  // font-size: 1.25rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: #fff;
  transition: color 300ms step-start;
  color: ${({ theme }) => theme.textPrimary};
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

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.md}px`}) {
    font-size: 16px;
  }

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.sm}px`}) {
    font-size: 14px;
    width: 50%;
  }
`;

export default function TransferAddressInput({
  className = "recipient-address-input",
  placeholder = "Enter address",
  value,
  onChange,
}: {
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value;
      const withoutSpaces = input.replace(/\s+/g, "");
      onChange(withoutSpaces);
    },
    [onChange]
  );

  return (
    <ContainerRow>
      <InputContainer>
        <Input
          className={className}
          type="string"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder={placeholder ? placeholder : ``}
          pattern="^(0x[a-fA-F0-9]{40})$"
          onChange={handleInput}
          value={value}
        />
      </InputContainer>
    </ContainerRow>
  );
}
