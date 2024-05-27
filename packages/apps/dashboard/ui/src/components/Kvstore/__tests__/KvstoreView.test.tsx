import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { KvstoreView } from '../KvstoreView';
import { Providers } from 'tests/utils';

describe('when rendered KvstoreView component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<KvstoreView />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers>{children}</Providers>
        ),
      });
    });
    expect(
      screen.getByText(
        /Store your public key in the blockchain, use your public key to encrypt or decrypt data./
      )
    ).toBeInTheDocument();
  });
});

it('KvstoreView component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <Providers>
      <KvstoreView />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
