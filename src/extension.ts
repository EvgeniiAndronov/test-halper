import * as vscode from 'vscode';
import { PythonAnalyzer } from './analyzers/pythonAnalyzer';
import { TestCodeLensProvider } from './providers/codelensProvider';
import { TestGenerator } from './generators/testGenerator';
import { TestPanel } from './views/testPanel';
import { TemplatePanel } from './views/templatePanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('🎉 Test Helper is now active!');
    vscode.window.showInformationMessage('Test Helper activated!');
    
    // Инициализируем анализаторы и генераторы
    const analyzers = new Map<string, any>([
        ['python', new PythonAnalyzer()],
    ]);
    
    const testGenerator = new TestGenerator();
    let testPanel: TestPanel;
    let templatePanel: TemplatePanel;

    // 1. CodeLens Provider
    const codelensProvider = new TestCodeLensProvider(analyzers);
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            [
                { scheme: 'file', language: 'python' },
            ],
            codelensProvider
        )
    );

    const debugTemplatesCommand = vscode.commands.registerCommand(
    'testhelper.debugTemplates',
    async () => {
        await testGenerator.debugTemplates();
        vscode.window.showInformationMessage('Check console for template debug info');
    }
);
    
    // 2. Команда генерации теста
    const generateTestCommand = vscode.commands.registerCommand(
        'testhelper.generateTest', 
        async (functionName: string, lineNumber: number) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            
            try {
                const document = editor.document;
                const language = document.languageId;
                const analyzer = analyzers.get(language);
                
                if (!analyzer) {
                    vscode.window.showErrorMessage(`Language ${language} not supported yet`);
                    return;
                }
                
                // Анализируем функцию
                const functionInfo = await analyzer.analyzeFunction(document, functionName, lineNumber);
                
                // Генерируем тест
                const testCode = await testGenerator.generateTest(functionInfo, language);
                
                // Создаем тестовый файл
                await testGenerator.createTestFile(document.uri, functionInfo, testCode);
                
                vscode.window.showInformationMessage(`✅ Test generated for ${functionName}`);
                
            } catch (error) {
                vscode.window.showErrorMessage(`❌ Failed to generate test: ${error}`);
            }
        }
    );
    
    // 3. Команда показа панели тестов
    const showPanelCommand = vscode.commands.registerCommand(
        'testhelper.showPanel',
        () => {
            testPanel = TestPanel.createOrShow(context.extensionUri);
        }
    );

    // 4. Команда показа панели шаблонов
    const showTemplatesCommand = vscode.commands.registerCommand(
        'testhelper.showTemplates',
        () => {
            templatePanel = TemplatePanel.createOrShow(context.extensionUri);
        }
    );
    
    // 5. Тестовая команда
    const helloCommand = vscode.commands.registerCommand('testhelper.hello', () => {
        vscode.window.showInformationMessage('Hello from Test Helper!');
    });

    context.subscriptions.push(
        generateTestCommand,
        showPanelCommand,
        showTemplatesCommand,
        helloCommand,
        debugTemplatesCommand
    );
}

export function deactivate() {}