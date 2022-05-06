import * as vscode from 'vscode';

const INSERT_COMMAND = 'quick-console.insertConsoleLog';
const REMOVE_COMMAND = 'quick-console.removeConsoleLog';

const INTERNAL_INSERT_AFTERLINE = 'editor.action.insertLineAfter';

const LOG_STATEMENT_REGEX =
  /console.(log|debug|info|warn|error|dir|trace|group|groupEnd|time|timeEnd|count)\((.*)\);?/g;

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

  const removeHandler = vscode.commands.registerCommand(REMOVE_COMMAND, () => {
    const currentEditor = vscode.window.activeTextEditor;

    if (!currentEditor) {
      noActiveEditorTip();
      return;
    }

    const currentDocument = currentEditor.document;
    const currentDocumentContent = currentEditor.document.getText();

    const workspaceEditor = new vscode.WorkspaceEdit();

    const statementsRange: vscode.Range[] = [];

    let match;
    while ((match = LOG_STATEMENT_REGEX.exec(currentDocumentContent))) {
      const matchRange = new vscode.Range(
        currentDocument.positionAt(match.index),
        currentDocument.positionAt(match.index + match[0].length)
      );
      if (matchRange.isEmpty) {
        return;
      }

      statementsRange.push(matchRange);
    }

    for (const statement of statementsRange) {
      workspaceEditor.delete(currentDocument.uri, statement);
    }

    vscode.workspace.applyEdit(workspaceEditor).then(() => {
      vscode.window.showInformationMessage(
        `${statementsRange.length} statement(s) removed from current document.`
      );
    });
  });

  context.subscriptions.push(removeHandler);
}

export function deactivate() {}
