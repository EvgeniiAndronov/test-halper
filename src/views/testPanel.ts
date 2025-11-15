import * as vscode from 'vscode';
import { PythonAnalyzer } from '../analyzers/pythonAnalyzer';

export class TestPanel {
    public static currentPanel: TestPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'generateTest':
                        await vscode.commands.executeCommand('testhelper.generateTest', message.functionName, message.lineNumber);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri): TestPanel {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (TestPanel.currentPanel) {
            TestPanel.currentPanel._panel.reveal(column);
            return TestPanel.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            'testHelper',
            'Test Helper',
            column || vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        TestPanel.currentPanel = new TestPanel(panel, extensionUri);
        return TestPanel.currentPanel;
    }

    public createOrShow() {
        TestPanel.createOrShow(this._extensionUri);
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
        await this.analyzeCurrentFile();
    }

    private async analyzeCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { 
            this._panel.webview.postMessage({
                command: 'updateFunctions',
                functions: [],
                fileName: 'No active file'
            });
            return; 
        }
        
        const document = editor.document;
        if (document.languageId !== 'python') {
            this._panel.webview.postMessage({
                command: 'updateFunctions',
                functions: [],
                fileName: 'Open a Python file to see functions'
            });
            return;
        }
        
        const analyzer = new PythonAnalyzer();
        
        try {
            const functions = await analyzer.analyzeFile(document);
            
            this._panel.webview.postMessage({
                command: 'updateFunctions',
                functions: functions,
                fileName: document.fileName
            });
        } catch (error) {
            console.error('Error analyzing file:', error);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Test Helper</title>
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background: var(--vscode-editor-background);
                    }
                    .header {
                        margin-bottom: 20px;
                    }
                    .function-list {
                        margin-top: 20px;
                    }
                    .function-item {
                        padding: 10px;
                        margin: 5px 0;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 4px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .generate-btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 5px 10px;
                        border-radius: 3px;
                        cursor: pointer;
                    }
                    .generate-btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .file-info {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>🧪 Test Helper</h2>
                    <div class="file-info" id="currentFile">Open a Python file to see functions</div>
                </div>
                <div class="function-list" id="functionList">
                    <!-- Functions will be populated here -->
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateFunctions':
                                updateFunctionList(message.functions, message.fileName);
                                break;
                        }
                    });
                    
                    function updateFunctionList(functions, fileName) {
                        const fileElement = document.getElementById('currentFile');
                        const listElement = document.getElementById('functionList');
                        
                        fileElement.textContent = 'File: ' + fileName;
                        
                        if (functions.length === 0) {
                            listElement.innerHTML = '<p>No functions found</p>';
                            return;
                        }
                        
                        listElement.innerHTML = '';
                        
                        functions.forEach(func => {
                            const item = document.createElement('div');
                            item.className = 'function-item';
                            item.innerHTML = \`
                                <div>
                                    <strong>\${func.name}</strong>
                                    <div style="font-size: 12px; color: #888;">
                                        Line \${func.lineNumber + 1} • \${func.parameters.length} params
                                    </div>
                                </div>
                                <button class="generate-btn" onclick="generateTest('\${func.name}', \${func.lineNumber})">
                                    Generate Test
                                </button>
                            \`;
                            listElement.appendChild(item);
                        });
                    }
                    
                    function generateTest(functionName, lineNumber) {
                        vscode.postMessage({
                            command: 'generateTest',
                            functionName: functionName,
                            lineNumber: lineNumber
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }

    public dispose() {
        TestPanel.currentPanel = undefined;
        this._panel.dispose();
        
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}