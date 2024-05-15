import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { Success, SuccessProps } from '../Success';
import { Providers } from 'tests/utils';

describe('when rendered Success component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(
        <Success
          {...({ keys: { publicKey: '', privateKey: '' } } as SuccessProps)}
        />,
        {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <Providers>{children}</Providers>
          ),
        }
      );
    });
    expect(screen.getByText(/Success!/)).toBeInTheDocument();
  });
});

it('Success component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <Providers>
      <Success
        {...({ keys: { publicKey: '', privateKey: '' } } as SuccessProps)}
      />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
