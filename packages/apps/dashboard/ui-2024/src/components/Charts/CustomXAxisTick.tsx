import { colorPalette } from '@assets/styles/color-palette';
// @ts-expect-error -- import error, but this type work property
import { ContentRenderer } from 'recharts';
import { formatDate } from '@helpers/formatDate';

const CustomXAxisTick = ({ x, y, payload }: ContentRenderer<string>) => {
	return (
		<g transform={`translate(${x},${y})`}>
			<text
				x={-30}
				y={0}
				fill={colorPalette.fog.main}
				transform="rotate(-35)"
				fontSize={10}
				fontWeight={500}
			>
				{formatDate(payload.value, 'D MMM')}
			</text>
		</g>
	);
};

export default CustomXAxisTick;
