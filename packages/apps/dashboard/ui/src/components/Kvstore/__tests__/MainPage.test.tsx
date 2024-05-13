import { render, screen } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { MainPage } from '../MainPage';
import { Providers } from 'tests/utils';

describe('when rendered MainPage component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<MainPage />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Empower HUMAN Scan/)).toBeInTheDocument();
  });
});

it('MainPage component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <Providers>
      <MainPage />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
