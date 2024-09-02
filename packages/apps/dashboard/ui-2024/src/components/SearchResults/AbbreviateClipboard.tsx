import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import abbreviateValue from '@helpers/abbreviateValue';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { colorPalette } from '@assets/styles/color-palette';
import { Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface AbbreviateClipboardProps {
	value: string;
	link?: string;
}
const AbbreviateClipboard = ({ value, link }: AbbreviateClipboardProps) => {
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
};

export default AbbreviateClipboard;
