import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TableRow, { TableRowProps } from '@mui/material/TableRow';
import * as React from 'react';

export const TableRowWithCustomContextMenu = ({
	children,
	componentProps,
	newTabLink,
}: {
	children: JSX.Element | (JSX.Element | null)[];
	newTabLink: string;
	componentProps?: TableRowProps;
}) => {
	const [contextMenu, setContextMenu] = React.useState<null | {
		mouseX: number;
		mouseY: number;
	}>(null);

	const handleContextMenu = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		setContextMenu(
			contextMenu === null
				? {
						mouseX: event.clientX + 2,
						mouseY: event.clientY - 6,
					}
				: null
		);
	};

	const handleMouseDown = (event: React.MouseEvent) => {
		if (event.button === 1) {
			const newWindow = window.open(
				newTabLink,
				'_blank',
				'noopener,noreferrer'
			);
			if (newWindow) newWindow.opener = null;
		}
	};
	const onMenuItemClick = () => {
		setContextMenu(null);
		const newWindow = window.open(newTabLink, '_blank', 'noopener,noreferrer');
		if (newWindow) newWindow.opener = null;
	};

	return (
		<>
			<TableRow
				aria-controls={contextMenu ? 'basic-menu' : undefined}
				aria-haspopup="true"
				aria-expanded={contextMenu ? 'true' : undefined}
				onContextMenu={handleContextMenu}
				onMouseDown={handleMouseDown}
				{...componentProps}
			>
				{children}
			</TableRow>
			<Menu
				open={contextMenu != null}
				onClose={() => setContextMenu(null)}
				anchorReference="anchorPosition"
				sx={{
					textDecoration: 'none',
					visited: {
						textDecoration: 'none',
					},
				}}
				anchorPosition={
					contextMenu != null
						? { top: contextMenu.mouseY, left: contextMenu.mouseX }
						: undefined
				}
			>
				<MenuItem onClick={onMenuItemClick}>Open in new tab</MenuItem>
			</Menu>
		</>
	);
};
