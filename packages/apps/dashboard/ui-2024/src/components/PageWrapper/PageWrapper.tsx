import { FC, PropsWithChildren } from 'react';
import clsx from 'clsx';
import Header from '@components/Header';
import Footer from '@components/Footer';

const PageWrapper: FC<
	PropsWithChildren<{ violetHeader?: boolean; displaySearchBar?: boolean }>
> = ({ children, violetHeader, displaySearchBar }) => {
	return (
		<div className="page-wrapper">
			<Header displaySearchBar={displaySearchBar} />
			<div
				className={clsx('', {
					'violet-header': violetHeader,
					'search-white-header': displaySearchBar,
				})}
			>
				<div className="container">{children}</div>
			</div>
			<Footer />
		</div>
	);
};

export default PageWrapper;
