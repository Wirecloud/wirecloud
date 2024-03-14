import * as monaco from 'monaco-editor';

if (!window.MonacoEnvironment || !window.MonacoEnvironment.basePath) {
	throw new Error('MonacoEnvironment.basePath is not defined. Please define it to use the Monaco Editor.');
}

window.MonacoEnvironment.getWorkerUrl = function (moduleId, label) {
	let baseURL = new URL(window.MonacoEnvironment.basePath, window.location.href).href || './';
	if (!baseURL.endsWith('/')) baseURL += '/';
	if (label === 'json') {
		return new URL('monaco-json.worker.bundle.js', baseURL).href;
	}
	if (label === 'css' || label === 'scss' || label === 'less') {
		return new URL('monaco-css.worker.bundle.js', baseURL).href;
	}
	if (label === 'html' || label === 'handlebars' || label === 'razor') {
		return new URL('monaco-html.worker.bundle.js', baseURL).href;;
	}
	if (label === 'typescript' || label === 'javascript') {
		return new URL('monaco-ts.worker.bundle.js', baseURL).href;
	}
	return new URL('monaco-editor.worker.bundle.js', baseURL).href;
}

window.monaco = monaco;