var HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
	entry: {
		MIDI: './src/index.js',
		basicExample: './examples/basic.js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader'
				}
			}
		]
	},
	plugins: [new HtmlWebpackPlugin()],
	devServer: {
		port: 3000
	},
	output: {
		library: 'MIDI',
		libraryTarget: 'var'
	}
}
