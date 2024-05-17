import { render, screen } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { StoredPubkey, StoredPubkeyProps } from '../StoredPubkey';
import { Providers } from 'tests/utils';

describe('when rendered StoredPubkey component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<StoredPubkey {...({} as StoredPubkeyProps)} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Generate New Key/)).toBeInTheDocument();
  });
});

it('StoredPubkey component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <Providers>
      <StoredPubkey {...({} as StoredPubkeyProps)} />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
