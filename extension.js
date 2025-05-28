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

        exec(runCommand, { cwd: vscode.workspace.rootPath }, (error, stdout, stderr) => {
            const combinedOutput = (stdout + stderr).trim();
            outputChannel.appendLine(combinedOutput || "(No output)");

            if (stderr.trim()) {
                const errorMessage = stderr.trim(); // ✅ Store the error
                console.log("Captured stderr error message:\n", errorMessage);
                console.log("Source code that caused the error:\n", code); // ✅ Log the source code

                const payload = {
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: "You are a helpful programming assistant that debugs code."
            },
            {
                role: "user",
                content: `Here is a piece of code:\n\n${code}\n\nIt produces the following error:\n\n${errorMessage}\n\nPlease explain the error and suggest a fix.`
            }
        ]
    };

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_OPENAI_API_KEY`
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content;
        vscode.window.showInformationMessage("AI Suggestion: " + aiResponse);
        outputChannel.appendLine("\n--- AI Suggestion ---\n" + aiResponse);
    } catch (err) {
        console.error("Failed to call OpenAI API:", err.message);
        vscode.window.showErrorMessage("Failed to get AI suggestion.");
    }
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
