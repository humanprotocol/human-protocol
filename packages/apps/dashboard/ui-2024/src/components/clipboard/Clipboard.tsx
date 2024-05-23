import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface ClipboardProps {
	value: string;
}

const Clipboard = ({ value }: ClipboardProps) => {
	return (
		<Card
			sx={{
				paddingX: 3,
				paddingY: 2,
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
					}}
				>
					{value}
				</Typography>
				<IconButton
					onClick={() => {
						navigator.clipboard.writeText(value);
					}}
					sx={{
						p: 0,
					}}
				>
					<ContentCopyIcon />
				</IconButton>
			</Stack>
		</Card>
	);
};

export default Clipboard;
