import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import Link from '@mui/material/Link';
import { colorPalette } from '@/styles/color-palette';

interface BreadcrumbsProps {
	onClick: () => void;
}

export function Breadcrumbs({ onClick }: BreadcrumbsProps) {
	const { t } = useTranslation();
	return (
		<Link
			component="button"
			data-testid="breadcrumb-button"
			onClick={onClick}
			sx={{
				display: 'flex',
				color: colorPalette.pale.light,
				flexDirection: 'row',
				alignItems: 'center',
				gap: 0.5,
			}}
			underline="none"
		>
			<ArrowBackIcon />
			<Typography>{t('components.breadcrumb.back')}</Typography>
		</Link>
	);
}
