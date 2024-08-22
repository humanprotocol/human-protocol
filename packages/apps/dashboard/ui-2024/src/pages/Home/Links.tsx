import { env } from '@helpers/env';
import SimpleBar from 'simplebar-react';
import bitfinex from '@assets/bitfinex.png';
import probitGlobal from '@assets/probitGlobal.png';
import gate from '@assets/gate.png';
import bing from '@assets/bing.png';
import coinlist from '@assets/coinlist.png';
import lbank from '@assets/lbank.png';

export const Links = () => {
	const bitfinexLink = env.VITE_BITFINEX_LINK;
	const probitGlobalLink = env.VITE_PROBITGLOBAL_LINK;
	const gateIoLink = env.VITE_GATEIO_LINK;
	const bingxLink = env.VITE_BINGX_LINK;
	const coinListPro = env.VITE_COINLISTPRO_LINK;
	const lbankLink = env.VITE_LBANK_LINK;

	const displayLinksSection =
		bitfinexLink ||
		probitGlobalLink ||
		gateIoLink ||
		bingxLink ||
		coinListPro ||
		lbankLink;

	if (!displayLinksSection) {
		return null;
	}

	return (
		<>
			<span className="home-page-find-title-mobile">Find HMT at</span>
			<SimpleBar>
				<div className="home-page-find">
					<span>Find HMT at</span>

					{bitfinexLink ? (
						<a href={bitfinexLink} target="_blank">
							<span>
								<img src={bitfinex} alt="logo" />
								Bitfinex
							</span>
						</a>
					) : null}

					{probitGlobalLink ? (
						<a href={probitGlobalLink} target="_blank">
							<span>
								<img src={probitGlobal} alt="logo" />
								Probit Global
							</span>
						</a>
					) : null}

					{gateIoLink ? (
						<a href={gateIoLink} target="_blank">
							<span>
								<img src={gate} alt="logo" />
								Gate.io
							</span>
						</a>
					) : null}

					{bingxLink ? (
						<a href={bingxLink} target="_blank">
							<span>
								<img src={bing} alt="logo" />
								BingX
							</span>
						</a>
					) : null}

					{coinListPro ? (
						<a href={coinListPro} target="_blank">
							<span>
								<img src={coinlist} alt="logo" />
								Coinlist Pro
							</span>
						</a>
					) : null}
					{lbankLink ? (
						<a href={lbankLink} target="_blank">
							<span>
								<img src={lbank} alt="logo" />
								LBank
							</span>
						</a>
					) : null}
				</div>
			</SimpleBar>
		</>
	);
};
