import * as vscode from 'vscode';

export class TestCodeLensProvider implements vscode.CodeLensProvider {
    private analyzers: Map<string, any>;
    
    constructor(analyzers: Map<string, any>) {
        this.analyzers = analyzers;
    }
    
    async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];
        const language = document.languageId;
        const analyzer = this.analyzers.get(language);
        
        if (!analyzer) {
            return codeLenses;
        }
        
        try {
            const functions = await analyzer.analyzeFile(document);
            
            functions.forEach((func: any) => {  // Добавьте тип any
                const range = new vscode.Range(
                    func.lineNumber, 0,
                    func.lineNumber, 0
                );
                
                const codeLens = new vscode.CodeLens(range, {
                    title: `🧪 Generate Test`,
                    command: 'testhelper.generateTest',
                    arguments: [func.name, func.lineNumber]
                });
                
                codeLenses.push(codeLens);
            });
        } catch (error) {
            console.error('Error analyzing file:', error);
        }
        
        return codeLenses;
    }
}