import * as vscode from 'vscode';

const INSERT_COMMAND = 'quick-console.insertConsoleLog';
const REMOVE_COMMAND = 'quick-console.removeConsoleLog';

const INTERNAL_INSERT_AFTERLINE = 'editor.action.insertLineAfter';

const logger = (...msg: unknown[]) => {
  console.log('QuickConsole', ...msg);
};

const noActiveEditorTip = () => {
  logger('No active TextEditor.');
  vscode.window.showErrorMessage('No active TextEditor opened.');
};

const insertTexInSelection = (input: string) => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    noActiveEditorTip();
    return;
  }

  const selection = editor.selection;

  const range = new vscode.Range(selection.start, selection.end);

  editor?.edit((editBuilder) => {
    editBuilder.replace(range, input);
  });
};

export function activate(context: vscode.ExtensionContext) {
  const insertHandler = vscode.commands.registerCommand(INSERT_COMMAND, () => {
    const currentEditor = vscode.window.activeTextEditor;

    if (!currentEditor) {
      noActiveEditorTip();
      return;
    }

    const { selection } = currentEditor;

    const selectionContent = currentEditor.document.getText(selection);

    selectionContent
      ? vscode.commands.executeCommand(INTERNAL_INSERT_AFTERLINE).then(() => {
          const statement = `console.log('${selectionContent}: ', ${selectionContent});`;
          insertTexInSelection(statement);
        })
      : insertTexInSelection('console.log();');
  });

  context.subscriptions.push(insertHandler);
}

export function deactivate() {}
