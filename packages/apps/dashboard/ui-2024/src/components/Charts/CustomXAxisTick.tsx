import { colorPalette } from '@assets/styles/color-palette';
// @ts-expect-error -- is this a bug? Because this type work property
import { ContentRenderer } from 'recharts';

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
				{payload.value}
			</text>
		</g>
	);
};

export default CustomXAxisTick;
