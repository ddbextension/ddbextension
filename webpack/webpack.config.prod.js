const baseConfig = require("./webpack.config.base");
const glob = require("glob");
const { paths, rules, plugins, webaccessible } = baseConfig.config(true);

module.exports = [{
    entry: './src/background/extensionbackground.js',
    output: {
        filename: 'extensionbackground.js',
        path: paths.buildDir
    },
    module: {
        rules: [rules.lint, rules.js]
    },
    plugins: [plugins.uglify, plugins.merge]
}, {
    entry: './src/contentscript/extensioncontentscript.js',
    output: {
        filename: 'extensioncontentscript.js',
        path: paths.buildDir
    },
    module: {
        rules: [rules.lint, rules.js, rules.separateCss]
    },
    plugins: [plugins.react, plugins.uglify, plugins.merge, plugins.separateCss("extensioncontentstyle.css")]
}, {
    entry: './src/popuppage/extensionpopup.js',
    output: {
        filename: 'extensionpopup.js',
        path: paths.buildDir
    },
    module: {
        rules: [rules.lint, {
            oneOf: [rules.static, rules.js, rules.css, rules.file]
        }]
    },
    plugins: [plugins.html("extensionpopup.html"), plugins.provideJquery, plugins.react, plugins.uglify, plugins.merge]
}, {
    entry: './src/optionspage/optionspage.js',
    output: {
        filename: 'optionspage.js',
        path: paths.buildDir
    },
    module: {
        rules: [rules.lint, {
            oneOf: [rules.static, rules.js, rules.css, rules.file]
        }]
    },
    plugins: [plugins.html("optionspage.html"), plugins.provideJquery, plugins.react, plugins.uglify, plugins.merge]
}, {
    entry: './src/contentscript/tinymce/tinymceddbxdialog.js',
    output: {
        filename: 'tinymceddbxdialog.js',
        path: paths.buildDir + "/webaccessible"
    },
    module: {
        rules: [rules.lint, {
            oneOf: [rules.static, rules.js, rules.css, rules.file]
        }]
    },
    plugins: [plugins.html("tinymceddbxdialog.html"), plugins.provideJquery, plugins.react, plugins.uglify, plugins.merge]
}];

// builds webaccessible scripts separately
webaccessible(module.exports);