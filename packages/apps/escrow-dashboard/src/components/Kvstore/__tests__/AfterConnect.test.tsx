import React from "react";
import { render, screen } from "@testing-library/react";
import renderer from "react-test-renderer";
import { act } from "react-dom/test-utils";
import {AfterConnect} from "src/components/Kvstore/AfterConnect";

import {
    RainbowKitProvider
} from "@rainbow-me/rainbowkit";
import { Providers, setupClient, getSigners, testChains } from "../../../../tests/utils";
import { MockConnector } from "@wagmi/core/connectors/mock";

describe("when rendered AfterConnect component", () => {


    it("should render `text` prop", async () => {
        const client = setupClient({
            connectors: [
                new MockConnector({
                    options: {
                        signer: getSigners()[0]!
                        // Turn on `failConnect` flag to simulate connect failure

                    }
                })
            ]
        });
        await act(async () => {
            render(<AfterConnect />);
        });
        expect(screen.getByText(/ETH KV Store/)).toBeInTheDocument();
    });
});

it("AfterConnect component renders correctly, corresponds to the snapshot", () => {
    const tree = renderer.create(<AfterConnect />).toJSON();
    expect(tree).toMatchSnapshot();
});
