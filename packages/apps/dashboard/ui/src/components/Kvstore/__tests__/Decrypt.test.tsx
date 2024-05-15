import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { Decrypt } from '../Decrypt';
import { Providers } from 'tests/utils';

describe('when rendered Decrypt component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<Decrypt />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers>{children}</Providers>
        ),
      });
    });
    expect(
      screen.getByText(/Decrypt using your public key and private key/)
    ).toBeInTheDocument();
  });
});

it('Decrypt component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <Providers>
      <Decrypt />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
