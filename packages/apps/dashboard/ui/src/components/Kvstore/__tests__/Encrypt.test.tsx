import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { Encrypt } from '../Encrypt';
import { Providers } from 'tests/utils';

describe('when rendered Encrypt component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<Encrypt publicKey="" />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Store/)).toBeInTheDocument();
  });
});

it('Encrypt component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <Providers>
      <Encrypt publicKey="" />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
