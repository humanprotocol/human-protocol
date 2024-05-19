import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { Empower, EmpowerProps } from '../Empower';
import { Providers } from 'tests/utils';

describe('when rendered Empower component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<Empower {...({} as EmpowerProps)} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Continue/)).toBeInTheDocument();
  });
});

it('Empower component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <Providers>
      <Empower {...({} as EmpowerProps)} />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
