const baseConfig = require("./webpack.config.base");
const { paths, rules, plugins, webaccessible } = baseConfig.config();

module.exports = [{
    entry: './src/background/extensionbackground.js',
    output: {
        filename: 'extensionbackground.js',
        path: paths.buildDir
    },
    devtool: "cheap-module-eval-source-map",
    module: {
        rules: [rules.lint, rules.js]
    }
}, {
    entry: './src/contentscript/extensioncontentscript.js',
    output: {
        filename: 'extensioncontentscript.js',
        path: paths.buildDir
    },
    devtool: "cheap-module-eval-source-map",
    module: {
        rules: [rules.lint, rules.js, rules.separateCss]
    },
    plugins: [plugins.separateCss("extensioncontentstyle.css")]
}, {
    entry: './src/popuppage/extensionpopup.js',
    output: {
        filename: 'extensionpopup.js',
        path: paths.buildDir
    },
    devtool: "cheap-module-eval-source-map",
    module: {
        rules: [rules.lint, {
            oneOf: [rules.static, rules.js, rules.css, rules.file]
        }]
    },
    plugins: [plugins.html("extensionpopup.html"), plugins.provideJquery]
}, {
    entry: './src/optionspage/optionspage.js',
    output: {
        filename: 'optionspage.js',
        path: paths.buildDir
    },
    devtool: "cheap-module-eval-source-map",
    module: {
        rules: [rules.lint, {
            oneOf: [rules.static, rules.js, rules.css, rules.file]
        }]
    },
    plugins: [plugins.html("optionspage.html"), plugins.provideJquery]
}, {
    entry: './src/contentscript/tinymce/tinymceddbxdialog.js',
    output: {
        filename: 'tinymceddbxdialog.js',
        path: paths.buildDir + "/webaccessible"
    },
    devtool: "cheap-module-eval-source-map",
    module: {
        rules: [rules.lint, {
            oneOf: [rules.static, rules.js, rules.css, rules.file]
        }]
    },
    plugins: [plugins.html("tinymceddbxdialog.html"), plugins.provideJquery]
}];

// builds webaccessible scripts separately
webaccessible(module.exports);