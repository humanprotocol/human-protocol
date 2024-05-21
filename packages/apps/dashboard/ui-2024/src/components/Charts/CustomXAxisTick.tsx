import { colorPalette } from '@assets/styles/color-palette';

const CustomXAxisTick = ({ x, y, payload }: any) => {
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
