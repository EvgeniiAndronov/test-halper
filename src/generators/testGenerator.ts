import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class TestGenerator {
    async generateTest(functionInfo: any, language: string): Promise<string> {
        // Получаем кастомные шаблоны из конфигурации
        const config = vscode.workspace.getConfiguration('testHelper');
        
        console.log('🔧 Loading templates for language:', language);
        
        let template: string;
        
        switch (language) {
            case 'python':
                template = config.get('pythonTemplate') as string;
                console.log('🐍 Python template loaded:', template ? 'CUSTOM' : 'DEFAULT');
                break;
            case 'cpp':
                template = config.get('cppTemplate') as string;
                console.log('⚡ C++ template loaded:', template ? 'CUSTOM' : 'DEFAULT');
                break;
            default:
                template = this.getDefaultTemplate(language);
                console.log('🔧 Default template for:', language);
        }
        
        // Если кастомного шаблона нет, используем стандартный
        if (!template) {
            template = this.getDefaultTemplate(language);
            console.log('📝 Using default template');
        }
        
        console.log('📋 Template content:', template.substring(0, 100) + '...');
        
        // Заменяем переменные в шаблоне
        const result = this.replaceTemplateVariables(template, functionInfo);
        console.log('✅ Generated test');
        
        return result;
    }
    
    private getDefaultTemplate(language: string): string {
        switch (language) {
            case 'python':
                return `import pytest

def test_{function_name}():
    """Test for {function_name} function"""
    # TODO: Add test implementation
    # result = {function_name}({parameters})
    # assert result == expected_value
    pass`;
            case 'cpp':
                return `// Test for {function_name} function
// TODO: Implement Google Test or Catch2 test
TEST({function_name}Test, BasicTest) {
    // Add test implementation
}`;
            default:
                throw new Error(`Unsupported language: ${language}`);
        }
    }
    
    private replaceTemplateVariables(template: string, functionInfo: any): string {
        return template
            .replace(/{function_name}/g, functionInfo.name)
            .replace(/{parameters}/g, functionInfo.parameters.join(', '));
    }
    
    async createTestFile(originalFile: vscode.Uri, functionInfo: any, testCode: string): Promise<vscode.Uri> {
        const config = vscode.workspace.getConfiguration('testHelper');
        const testLocation = config.get<'sameDir' | 'testsDir' | 'custom'>('testLocation', 'testsDir');
        
        const originalPath = originalFile.fsPath;
        const originalDir = path.dirname(originalPath);
        const originalName = path.basename(originalPath, path.extname(originalPath));
        
        let testDir: string;
        let testFileName: string;
        
        switch (testLocation) {
            case 'sameDir':
                testDir = originalDir;
                testFileName = `${originalName}_test.py`;
                break;
            case 'testsDir':
                testDir = path.join(originalDir, 'tests');
                testFileName = `test_${originalName}.py`;
                break;
            default:
                testDir = originalDir;
                testFileName = `test_${originalName}.py`;
        }
        
        // Создаем директорию если нужно
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        
        const testFilePath = path.join(testDir, testFileName);
        
        // Читаем существующий файл или создаем новый
        let existingContent = '';
        if (fs.existsSync(testFilePath)) {
            existingContent = fs.readFileSync(testFilePath, 'utf8');
        }
        
        // Добавляем новый тест если его еще нет
        if (!existingContent.includes(`test_${functionInfo.name}`)) {
            const newContent = existingContent + (existingContent ? '\n\n' : '') + testCode;
            fs.writeFileSync(testFilePath, newContent, 'utf8');
            
            // Показываем созданный файл
            const doc = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
            
            return vscode.Uri.file(testFilePath);
        } else {
            vscode.window.showInformationMessage(`Test for ${functionInfo.name} already exists`);
            return vscode.Uri.file(testFilePath);
        }
    }

    // Метод для проверки текущих шаблонов
    async debugTemplates(): Promise<void> {
        const config = vscode.workspace.getConfiguration('testHelper');
        const pythonTemplate = config.get('pythonTemplate');
        const cppTemplate = config.get('cppTemplate');
        
        console.log('🔍 DEBUG TEMPLATES:');
        console.log('🐍 Python:', pythonTemplate ? 'CUSTOM' : 'DEFAULT');
        console.log('⚡ C++:', cppTemplate ? 'CUSTOM' : 'DEFAULT');
        
        if (pythonTemplate) {
            console.log('🐍 Python template content:', pythonTemplate);
        }
        if (cppTemplate) {
            console.log('⚡ C++ template content:', cppTemplate);
        }
    }
}