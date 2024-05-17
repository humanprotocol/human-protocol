import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { GenerateOrImport, GenerateOrImportProps } from '../GenerateOrImport';
import { Providers } from 'tests/utils';

describe('when rendered GenerateOrImport component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<GenerateOrImport {...({} as GenerateOrImportProps)} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Import/)).toBeInTheDocument();
  });
});

it('GenerateOrImport component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <Providers>
      <GenerateOrImport {...({} as GenerateOrImportProps)} />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
