import { Elements } from '@stripe/react-stripe-js';
import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';
import { vi } from 'vitest';
import { JobRequest } from '../components/FiatJobRequest';

const mockElement = () => ({
  mount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  update: vi.fn(),
});

const mockElements = () => {
  const elements = {};
  return {
    create: vi.fn((type) => {
      elements[type] = mockElement();
      return elements[type];
    }),
    getElement: vi.fn((type) => {
      return elements[type] || null;
    }),
    update: vi.fn(),
  };
};

const mockStripe = () => ({
  elements: vi.fn(() => mockElements()),
  createToken: vi.fn(),
  createSource: vi.fn(),
  createPaymentMethod: vi.fn(),
  confirmCardPayment: vi.fn(),
  confirmCardSetup: vi.fn(),
  paymentRequest: vi.fn(),
  registerAppInfo: vi.fn(),
  _registerWrapper: vi.fn(),
});

describe('when rendered FiatJobRequest component', () => {
  const mockstripe = mockStripe() as any;
  it('should render buttons', async () => {
    await act(async () => {
      render(
        <JobRequest
          fundingMethod="crypto"
          onBack={() => 1}
          onLaunch={() => 1}
          onSuccess={() => 1}
          onFail={() => 1}
        />,
        {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <Elements stripe={mockstripe}>{children}</Elements>
          ),
        }
      );
    });
    expect(screen.getByText('Fund and Request Job')).toBeTruthy();
    expect(screen.getByText('Back')).toBeTruthy();
  });
});

it('FiatJobRequest component renders correctly, corresponds to the snapshot', () => {
  const mockstripe = mockStripe() as any;
  const tree = create(
    <Elements stripe={mockstripe}>
      <JobRequest
        fundingMethod="fiat"
        onBack={() => 1}
        onLaunch={() => 1}
        onSuccess={() => 1}
        onFail={() => 1}
      />
    </Elements>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
