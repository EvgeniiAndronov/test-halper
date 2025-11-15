import * as vscode from 'vscode';

export interface FunctionInfo {
    name: string;
    lineNumber: number;
    parameters: string[];
    returnType?: string;
    code: string;
    filePath: string;
}

export class PythonAnalyzer {
    async analyzeFunction(document: vscode.TextDocument, functionName: string, lineNumber: number): Promise<FunctionInfo> {
        const text = document.getText();
        const lines = text.split('\n');
        
        // Находим функцию по имени и номеру строки
        const functionRegex = new RegExp(`^def\\s+${functionName}\\s*\\(([^)]*)\\)\\s*:`, 'm');
        const match = functionRegex.exec(text);
        
        if (!match) {
            throw new Error(`Function ${functionName} not found`);
        }
        
        // Извлекаем параметры
        const paramsString = match[1];
        const parameters = this.parseParameters(paramsString);
        
        // Получаем код функции
        const functionCode = this.extractFunctionCode(lines, lineNumber);
        
        return {
            name: functionName,
            lineNumber: lineNumber,
            parameters: parameters,
            code: functionCode,
            filePath: document.fileName
        };
    }
    
    async analyzeFile(document: vscode.TextDocument): Promise<FunctionInfo[]> {
        const text = document.getText();
        const functions: FunctionInfo[] = [];
        
        const functionRegex = /def\s+(\w+)\s*\(([^)]*)\)\s*:/g;
        let match;
        
        while ((match = functionRegex.exec(text)) !== null) {
            const functionName = match[1];
            const lineNumber = this.getLineNumber(text, match.index);
            const parameters = this.parseParameters(match[2]);
            
            functions.push({
                name: functionName,
                lineNumber: lineNumber,
                parameters: parameters,
                code: '',
                filePath: document.fileName
            });
        }
        
        return functions;
    }
    
    private parseParameters(paramsString: string): string[] {
        return paramsString.split(',')
            .map(param => param.trim())
            .filter(param => param.length > 0)
            .map(param => {
                return param.split('=')[0].trim();
            });
    }
    
    private extractFunctionCode(lines: string[], startLine: number): string {
        let code = [];
        let indentLevel = 0;
        let currentLine = startLine;
        
        code.push(lines[startLine]);
        
        const functionIndent = this.getIndentLevel(lines[startLine]);
        
        currentLine++;
        while (currentLine < lines.length) {
            const line = lines[currentLine];
            const currentIndent = this.getIndentLevel(line);
            
            if (currentIndent <= functionIndent && line.trim().length > 0) {
                break;
            }
            
            code.push(line);
            currentLine++;
        }
        
        return code.join('\n');
    }
    
    private getIndentLevel(line: string): number {
        return line.match(/^\s*/)?.[0].length || 0;
    }
    
    private getLineNumber(text: string, index: number): number {
        return text.substring(0, index).split('\n').length - 1;
    }
}