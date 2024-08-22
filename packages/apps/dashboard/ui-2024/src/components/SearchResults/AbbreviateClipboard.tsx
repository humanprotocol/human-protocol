import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import abbreviateValue from '@helpers/abbreviateValue';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { colorPalette } from '@assets/styles/color-palette';

interface AbbreviateClipboardProps {
	value: string;
}
const AbbreviateClipboard = ({ value }: AbbreviateClipboardProps) => (
	<Stack direction="row" gap={1}>
		<Typography sx={{ whiteSpace: 'nowrap' }}>
			{abbreviateValue(value)}
		</Typography>
		<IconButton
			onClick={() => {
				navigator.clipboard.writeText(value);
			}}
			sx={{
				p: 0,
			}}
		>
			<ContentCopyIcon
				fontSize="small"
				sx={{
					color: colorPalette.fog.main,
				}}
			/>
		</IconButton>
	</Stack>
);

export default AbbreviateClipboard;
