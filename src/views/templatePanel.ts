import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class TemplatePanel {
    public static currentPanel: TemplatePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri): TemplatePanel {
        const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

        if (TemplatePanel.currentPanel) {
            TemplatePanel.currentPanel._panel.reveal(column);
            return TemplatePanel.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            'templateSettings',
            'Test Templates',
            column,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        TemplatePanel.currentPanel = new TemplatePanel(panel, extensionUri);
        return TemplatePanel.currentPanel;
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._update();
        
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'saveTemplates':
                        await this.saveTemplates(message.templates);
                        return;
                    case 'loadTemplates':
                        await this.loadTemplates();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private async _update() {
        this._panel.webview.html = this._getHtmlForWebview();
        // Загружаем текущие шаблоны при открытии
        await this.loadTemplates();
    }

    private async saveTemplates(templates: any) {
        try {
            const config = vscode.workspace.getConfiguration('testHelper');
            
            // Сохраняем каждый шаблон отдельно
            await config.update('pythonTemplate', templates.python, vscode.ConfigurationTarget.Global);
            await config.update('cppTemplate', templates.cpp, vscode.ConfigurationTarget.Global);
            
            this._panel.webview.postMessage({
                command: 'templatesSaved',
                success: true
            });
            
            vscode.window.showInformationMessage('✅ Templates saved successfully!');
        } catch (error) {
            console.error('Error saving templates:', error);
            
            // Правильно типизируем ошибку
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            this._panel.webview.postMessage({
                command: 'templatesSaved', 
                success: false,
                error: errorMessage
            });
            vscode.window.showErrorMessage(`❌ Failed to save templates: ${errorMessage}`);
        }
    }

    // Сделайте этот метод public или оставьте private, но обработайте вызов извне
    public async loadTemplates() {
        try {
            const config = vscode.workspace.getConfiguration('testHelper');
            const pythonTemplate = config.get('pythonTemplate') || this.getDefaultTemplates().python;
            const cppTemplate = config.get('cppTemplate') || this.getDefaultTemplates().cpp;
            
            const templates = {
                python: pythonTemplate,
                cpp: cppTemplate
            };
            
            this._panel.webview.postMessage({
                command: 'templatesLoaded',
                templates: templates
            });
        } catch (error) {
            console.error('Error loading templates:', error);
            // Загружаем шаблоны по умолчанию при ошибке
            this._panel.webview.postMessage({
                command: 'templatesLoaded',
                templates: this.getDefaultTemplates()
            });
        }
    }

    private getDefaultTemplates() {
        return {
            python: `import pytest

def test_{function_name}():
    """Test for {function_name} function"""
    # TODO: Add test implementation
    # result = {function_name}({parameters})
    # assert result == expected_value
    pass`,
            cpp: `// Test for {function_name} function
// TODO: Implement Google Test or Catch2 test
TEST({function_name}Test, BasicTest) {
    // Add test implementation
}`
        };
    }

    private _getHtmlForWebview(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Test Templates</title>
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background: var(--vscode-editor-background);
                    }
                    .template-item {
                        margin: 15px 0;
                        padding: 15px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        background: var(--vscode-input-background);
                    }
                    textarea {
                        width: 100%;
                        height: 150px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        padding: 8px;
                        font-family: 'Courier New', monospace;
                        resize: vertical;
                        font-size: 12px;
                    }
                    button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 5px;
                        font-size: 13px;
                    }
                    button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    button.reset {
                        background: var(--vscode-input-background);
                        border: 1px solid var(--vscode-input-border);
                    }
                    .button-group {
                        margin-top: 15px;
                        display: flex;
                        gap: 10px;
                    }
                    .status {
                        margin-top: 10px;
                        padding: 8px;
                        border-radius: 4px;
                        display: none;
                    }
                    .status.success {
                        background: var(--vscode-inputValidation-infoBackground);
                        border: 1px solid var(--vscode-inputValidation-infoBorder);
                        display: block;
                    }
                    .status.error {
                        background: var(--vscode-inputValidation-errorBackground);
                        border: 1px solid var(--vscode-inputValidation-errorBorder);
                        display: block;
                    }
                    .variables {
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                        margin-top: 5px;
                    }
                </style>
            </head>
            <body>
                <h2>🧪 Test Templates Configuration</h2>
                <p>Customize your test templates. Available variables: <code>{function_name}</code>, <code>{parameters}</code></p>
                
                <div class="template-item">
                    <h3>🐍 Python pytest Template</h3>
                    <textarea id="pythonTemplate" placeholder="Enter Python test template..."></textarea>
                    <div class="variables">Available variables: {function_name}, {parameters}</div>
                </div>

                <div class="template-item">
                    <h3>⚡ C++ Google Test Template</h3>
                    <textarea id="cppTemplate" placeholder="Enter C++ test template..."></textarea>
                    <div class="variables">Available variables: {function_name}</div>
                </div>

                <div class="button-group">
                    <button onclick="saveTemplates()">💾 Save Templates</button>
                    <button class="reset" onclick="resetTemplates()">🔄 Reset to Default</button>
                </div>

                <div id="statusMessage" class="status"></div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Загрузка шаблонов при открытии
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'templatesLoaded':
                                loadTemplatesIntoForm(message.templates);
                                break;
                            case 'templatesSaved':
                                showStatus(message.success ? 'Templates saved successfully!' : 'Failed to save templates', message.success);
                                break;
                        }
                    });

                    function loadTemplatesIntoForm(templates) {
                        document.getElementById('pythonTemplate').value = templates.python || '';
                        document.getElementById('cppTemplate').value = templates.cpp || '';
                    }

                    function saveTemplates() {
                        const templates = {
                            python: document.getElementById('pythonTemplate').value,
                            cpp: document.getElementById('cppTemplate').value
                        };
                        
                        vscode.postMessage({
                            command: 'saveTemplates',
                            templates: templates
                        });
                    }

                    function resetTemplates() {
                        if (confirm('Reset all templates to default?')) {
                            // Вместо вызова loadTemplates, просто сбрасываем к значениям по умолчанию
                            const defaultTemplates = {
                                python: \`import pytest\n\ndef test_{function_name}():\n    \"\"\"Test for {function_name} function\"\"\"\n    # TODO: Add test implementation\n    # result = {function_name}({parameters})\n    # assert result == expected_value\n    pass\`,
                                cpp: \`// Test for {function_name} function\n// TODO: Implement Google Test or Catch2 test\nTEST({function_name}Test, BasicTest) {\n    // Add test implementation\n}\`
                            };
                            loadTemplatesIntoForm(defaultTemplates);
                            saveTemplates(); // Сохраняем сброшенные шаблоны
                        }
                    }

                    function showStatus(message, isSuccess) {
                        const statusElement = document.getElementById('statusMessage');
                        statusElement.textContent = message;
                        statusElement.className = 'status ' + (isSuccess ? 'success' : 'error');
                        
                        setTimeout(() => {
                            statusElement.style.display = 'none';
                        }, 3000);
                    }

                    // Автосохранение при изменении
                    let saveTimeout;
                    function setupAutoSave() {
                        const textareas = document.querySelectorAll('textarea');
                        textareas.forEach(textarea => {
                            textarea.addEventListener('input', () => {
                                clearTimeout(saveTimeout);
                                saveTimeout = setTimeout(saveTemplates, 2000);
                            });
                        });
                    }

                    // Инициализация
                    setupAutoSave();
                    // Запрашиваем текущие шаблоны при загрузке
                    vscode.postMessage({ command: 'loadTemplates' });
                </script>
            </body>
            </html>
        `;
    }

    public dispose() {
        TemplatePanel.currentPanel = undefined;
        this._panel.dispose();
        
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}