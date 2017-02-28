module.exports = function dump() {
	const doDump = (console.table ? console.table : console.log).bind(console)
	doDump.call(null, ...arguments)
}