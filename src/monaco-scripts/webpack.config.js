const path = require('path');

module.exports = {
	mode: 'production',
	entry: {
		'main': path.resolve(__dirname, 'monaco-load.js'),
		'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
		'json.worker': 'monaco-editor/esm/vs/language/json/json.worker',
		'css.worker': 'monaco-editor/esm/vs/language/css/css.worker',
		'html.worker': 'monaco-editor/esm/vs/language/html/html.worker',
		'ts.worker': 'monaco-editor/esm/vs/language/typescript/ts.worker'
	},
	output: {
		filename: 'monaco-[name].bundle.js',
		path: path.resolve(__dirname, '../wirecloud/commons/static/js/lib/monaco-editor'),
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			},
			{
				test: /\.ttf$/,
				use: ['file-loader']
			}
		]
	},
	performance: {
		maxEntrypointSize: 5 * 1024 * 1024, // 5 MiB
    	maxAssetSize: 5 * 1024 * 1024 // 5 MiB
	}
};
