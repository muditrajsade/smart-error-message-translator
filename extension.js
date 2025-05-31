const vscode = require('vscode');
const { exec } = require('child_process');

function activate(context) {
    const outputChannel = vscode.window.createOutputChannel("SmartRun Output");

    let disposable = vscode.commands.registerCommand('extension.runCodeSmart', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active file.");
            return;
        }

        const document = editor.document;
        const filePath = document.fileName;
        const fileExt = filePath.split('.').pop();
        const code = document.getText();  // ✅ Get the entire code of the file

        let runCommand = "";

        switch (fileExt) {
            case "cpp": {
                const outputBinary = filePath.replace(/\.cpp$/, '');
                runCommand = `g++ "${filePath}" -o "${outputBinary}" && "${outputBinary}"`;
                break;
            }
            case "js":
                runCommand = `node "${filePath}"`;
                break;
            case "py":
                runCommand = `python "${filePath}"`;
                break;
            case "ts":
                runCommand = `ts-node "${filePath}"`;
                break;
            case "java": {
                const className = filePath.replace(/^.*[\\/]/, '').replace('.java', '');
                runCommand = `javac "${filePath}" && java "${className}"`;
                break;
            }
            default:
                vscode.window.showErrorMessage(`Unsupported file type: .${fileExt}`);
                return;
        }

        outputChannel.clear();
        outputChannel.appendLine(`> ${runCommand}`);
        outputChannel.show(true);

        exec(runCommand, { cwd: vscode.workspace.rootPath }, async (error, stdout, stderr) => {
            const combinedOutput = (stdout + stderr).trim();
            outputChannel.appendLine(combinedOutput || "(No output)");

            const outputLines = [];
            outputLines.push(`> ${runCommand}`);
            outputLines.push(combinedOutput || "(No output)");

            if (stderr.trim()) {
                const errorMessage = stderr.trim(); // ✅ Store the error
                console.log("Captured stderr error message:\n", errorMessage);
                console.log("Source code that caused the error:\n", code); // ✅ Log the source code

                outputChannel.appendLine("⏳ Fetching AI analysis...");


                let r = await fetch('http://localhost:8000/analyze-error', {
                                     method: 'POST',
                                        headers: {
                                                'Content-Type': 'application/json',
                                        },
                                    body: JSON.stringify({
                                         errorMessage: errorMessage,
                                            code: code
                                    })
                                });

                let k = await r.json();
                console.log(k);

                
               outputChannel.clear();
            for (const line of outputLines) {
                outputChannel.appendLine(line);
            }

// Clear the spinner line manually by overwriting it with spaces

                outputChannel.appendLine('\n────────────── AI Error Analysis ──────────────');

// Display the main explanation with proper line breaks


// Append the AI's explanation and suggestions
outputChannel.appendLine(k.fullResponse);

// Append extracted links (if any), one per line
/*if (k.extractedLinks && k.extractedLinks.length > 0) {
    outputChannel.appendLine('\nRelevant Web Links:\n');
    k.extractedLinks.forEach((link, index) => {
        outputChannel.appendLine(`LINK ${index + 1}: ${link}`);
    });
}*/


outputChannel.appendLine('───────────────────────────────────────────────\n');


                




                
            }
        });
    });

    context.subscriptions.push(disposable);
    console.log("SmartRun extension activated");
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
