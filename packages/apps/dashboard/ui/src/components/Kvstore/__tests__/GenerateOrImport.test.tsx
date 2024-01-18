import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';
import { MockConnector } from 'wagmi/connectors/mock';

import { GenerateOrImport, GenerateOrImportProps } from '../GenerateOrImport';
import { Providers, setupClient, getSigners } from 'tests/utils';

describe('when rendered GenerateOrImport component', () => {
  it('should render `text` prop', async () => {
    const client = setupClient({
      connectors: [
        new MockConnector({
          options: {
            signer: getSigners()[0]!,
            // Turn on `failConnect` flag to simulate connect failure
          },
        }),
      ],
    });
    await act(async () => {
      render(<GenerateOrImport {...({} as GenerateOrImportProps)} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Import/)).toBeInTheDocument();
  });
});

it('GenerateOrImport component renders correctly, corresponds to the snapshot', () => {
  const client = setupClient({
    connectors: [
      new MockConnector({
        options: {
          signer: getSigners()[0]!,
          // Turn on `failConnect` flag to simulate connect failure
        },
      }),
    ],
  });
  const tree = create(
    <Providers client={client}>
      <GenerateOrImport {...({} as GenerateOrImportProps)} />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
