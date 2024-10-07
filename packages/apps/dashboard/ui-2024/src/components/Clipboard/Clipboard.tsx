import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { colorPalette } from '@assets/styles/color-palette';
import CustomTooltip from '@components/CustomTooltip';
import { useState } from 'react';

interface ClipboardProps {
	value: string;
}

const Clipboard = ({ value }: ClipboardProps) => {
	const [tooltipOpen, setTooltipOpen] = useState(false);

	return (
		<Card
			sx={{
				paddingX: 3,
				paddingY: 2,
				borderRadius: 16,
			}}
		>
			<Stack
				gap={2}
				direction="row"
				alignItems="center"
				justifyContent="space-between"
			>
				<Typography
					fontWeight={600}
					sx={{
						textOverflow: 'ellipsis',
						overflow: 'hidden',
						wordBreak: 'normal',
					}}
				>
					{value}
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
					<CustomTooltip title="Copied!" arrow open={tooltipOpen}>
						<ContentCopyIcon
							sx={{
								color: colorPalette.fog.main,
							}}
						/>
					</CustomTooltip>
				</IconButton>
			</Stack>
		</Card>
	);
};

export default Clipboard;
