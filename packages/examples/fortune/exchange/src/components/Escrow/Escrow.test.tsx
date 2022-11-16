import renderer from 'react-test-renderer';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Escrow } from './Escrow';
import sendFortune from '../../services/RecordingOracle/RecordingClient'

describe('When rendered Escrow component', () => {

    it('renders landing page', async () => {
        render(<Escrow />);
        expect(screen.getByTestId("escrowAddress")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Send Fortune" })).toBeInTheDocument();
    });


    it('should match snapshot', () => {
        const component = renderer.create(
            <Escrow />
        );
        let tree = component.toJSON();
        expect(tree).toMatchSnapshot();
        return;
    });
});