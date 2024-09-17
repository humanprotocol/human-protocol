import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import abbreviateValue from '@helpers/abbreviateValue';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { colorPalette } from '@assets/styles/color-palette';
import { Link, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface AbbreviateClipboardProps {
	value: string;
	link?: string;
}
const AbbreviateClipboard = ({ value, link }: AbbreviateClipboardProps) => {
	const [tooltipOpen, setTooltipOpen] = useState(false);
	const navigate = useNavigate();
	return (
		<Stack direction="row" gap={1}>
			<Typography sx={{ whiteSpace: 'nowrap', textDecoration: 'inherit' }}>
				{link ? (
					<span
						onClick={(e) => {
							e.stopPropagation();
							e.preventDefault();
							navigate(link, {
								preventScrollReset: false,
							});
						}}
					>
						<Link href={link} target="_blank" underline="none">
							{abbreviateValue(value)}
						</Link>
					</span>
				) : (
					<>{abbreviateValue(value)}</>
				)}
			</Typography>
			<IconButton
				onClick={() => {
					navigator.clipboard.writeText(value);
					setTooltipOpen(true);
					setTimeout(() => {
						setTooltipOpen(false);
					}, 1500);
				}}
				sx={{
					p: 0,
				}}
			>
				<Tooltip title="Copied!" arrow open={tooltipOpen}>
					<ContentCopyIcon
						fontSize="small"
						sx={{
							color: colorPalette.fog.main,
						}}
					/>
				</Tooltip>
			</IconButton>
		</Stack>
	);
};

export default AbbreviateClipboard;
