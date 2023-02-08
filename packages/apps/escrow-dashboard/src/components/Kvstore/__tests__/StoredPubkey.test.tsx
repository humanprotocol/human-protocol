import React from "react";
import { render, screen } from "@testing-library/react";
import renderer from "react-test-renderer";
import { act } from "react-dom/test-utils";
import {StoredPubkey} from "src/components/Kvstore/StoredPubkey";

import {
    RainbowKitProvider
} from "@rainbow-me/rainbowkit";
import { Providers, setupClient, getSigners, testChains } from "../../../../tests/utils";
import { MockConnector } from "@wagmi/core/connectors/mock";

describe("when rendered StoredPubkey component", () => {


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
            render(<StoredPubkey />, {
                wrapper: ({ children }: { children: React.ReactNode }) => (
                        <Providers client={client}><RainbowKitProvider
            chains={testChains}
                modalSize="compact"

          >{children}</RainbowKitProvider></Providers>

          )
            });
        });
        expect(screen.getByText(/Generate New Key/)).toBeInTheDocument();
    });
});

it("StoredPubkey component renders correctly, corresponds to the snapshot", () => {
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
    const tree = renderer.create(<Providers client={client}><RainbowKitProvider
        chains={testChains}
        modalSize="compact"

        ><StoredPubkey /></RainbowKitProvider></Providers>).toJSON();
    expect(tree).toMatchSnapshot();
});
