// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 
 */

let terminal;
function activate(context) {

	let disposable = vscode.commands.registerCommand('extension.runCodeSmart', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active file.");
            return;
        }

        const filePath = editor.document.fileName;
        const fileExt = filePath.split('.').pop();

        let runCommand = "";

        switch (fileExt) {
            case "cpp":
                const outputBinary = filePath.replace(/\.cpp$/, '');
                runCommand = `g++ "${filePath}" -o "${outputBinary}" && "${outputBinary}"`;
                break;
            case "js":
                runCommand = `node "${filePath}"`;
                break;
            case "py":
                runCommand = `python "${filePath}"`;
                break;
            case "ts":
                runCommand = `ts-node "${filePath}"`;
                break;
            case "java":
                const className = filePath.replace(/^.*[\\/]/, '').replace('.java', '');
                runCommand = `javac "${filePath}" && java "${className}"`;
                break;
            default:
                vscode.window.showErrorMessage(`Unsupported file type: .${fileExt}`);
                return;
        }

        if (!terminal || terminal.exitStatus) {
            terminal = vscode.window.createTerminal("SmartRun Terminal");
        }

        terminal.show();
        terminal.sendText(runCommand);
    });

    context.subscriptions.push(disposable);
	console.log("hi");
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
