const abbreviateValue = (value: string | null) => {
	if (value) {
		const first3Letters = value.slice(0, 3);
		const last5Letters = value.slice(-5);

		return `${first3Letters}...${last5Letters}`;
	}

	return null;
};

export default abbreviateValue;
