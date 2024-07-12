import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { ImportPubkey, ImportPubkeyProps } from '../ImportPubkey';
import { Providers } from 'tests/utils';

describe('when rendered ImportPubkey component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<ImportPubkey {...({} as ImportPubkeyProps)} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Import your public key/)).toBeInTheDocument();
  });
});

it('ImportPubkey component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <Providers>
      <ImportPubkey {...({} as ImportPubkeyProps)} />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
