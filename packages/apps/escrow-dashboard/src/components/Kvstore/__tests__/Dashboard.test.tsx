import React from "react";
import { render, screen } from "@testing-library/react";
import renderer from "react-test-renderer";
import { act } from "react-dom/test-utils";
import {Dashboard} from "src/components/Kvstore/Dashboard";
import {
    RainbowKitProvider
} from "@rainbow-me/rainbowkit";
import { Providers, setupClient, getSigners, testChains } from "../../../../tests/utils";

import { MockConnector } from "@wagmi/core/connectors/mock";

describe("when rendered Dashboard component", () => {


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
            render(<Dashboard publicKey=""/>);
        });
        expect(screen.getByText(/ETH KV Store/)).toBeInTheDocument();
    });
});

it("Dashboard component renders correctly, corresponds to the snapshot", () => {
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
    const tree = renderer.create(<Dashboard publicKey=""/>).toJSON();
    expect(tree).toMatchSnapshot();
});
