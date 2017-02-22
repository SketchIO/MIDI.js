function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = [
	{
		property: 'volume',
		comparator: isNumber,
		defaultValue: 100
	},
	{
		property: 'mute',
		comparator(b) {
			return !!b
		},
		defaultValue: false
	},
	{
		property: 'detune',
		comparator(n) {
			return isNumber(n) && n >= -1200 && n <= 1200
		},
		defaultValue: 0.0
	}
]