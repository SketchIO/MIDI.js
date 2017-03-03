export default function dump() {
	(console.table ? console.table : console.log).bind(console)(arguments)
}