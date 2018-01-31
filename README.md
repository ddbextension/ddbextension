# ddbextension

## Setup for Developers

### Setup
With [Node.js](https://nodejs.org/) installed, from the base directory of this repository run:
```bash
npm install
```
Then run:
```bash
npm run build
```
After the build task just open a chrome window and go to `chrome://extensions/` from address bar, check the `Developer mode` on the top right. Finally click on `Load unpacked extension...` and select the `build` folder generated from the build task.

### Watch
Another option to avoid build the project after every change is to run:
```bash
npm run watch
```

This will rebuild the core files of the extension if they or any of their dependencies are changed or a new dependency is added. Those files are configured on the webpack files and includes:
- extensionbackground.js (extension background script);
- extensioncontentscript.js (extension content script);
- extensionpopup.js (extension popup page script);
- optionspage.js (extension options page script);
- tinymceddbxdialog.js (script of DDBX tinyMCE dialog window);
- Every script inside the "webaccessible" folder.

In other words if the watch is running and a file that is an import (directly or transitive) of one of those files it will rebuild build the depending files. If an image or other resource that is not a dependency of those files is added/changed a manual rebuild is required.

### Add Code
To add your code to the content or background script there are two options:

- If your code is not a ES6 class just import as a script:
```js
import "./path/to/my/file.js";
```
- If it is a ES6 class with an export (see an existing class as base):
```js
import MyClass "./path/to/my/MyClass.js";
```

Style files can be added as the first option:
```js
import "./path/to/my/style.css";
import "./path/to/my/fancy/style.scss";
```

