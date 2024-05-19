import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { GeneratePubkey, GeneratePubkeyProps } from '../GeneratePubkey';
import { Providers } from 'tests/utils';

describe('when rendered GeneratePubkey component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<GeneratePubkey {...({} as GeneratePubkeyProps)} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Generate Public Key/)).toBeInTheDocument();
  });
});

it('GeneratePubkey component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <Providers>
      <GeneratePubkey {...({} as GeneratePubkeyProps)} />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
