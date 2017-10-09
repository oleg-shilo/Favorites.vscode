import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, commands } from "vscode";

export class FavoritesTreeProvider implements vscode.TreeDataProvider<Dependency> {

	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined> = new vscode.EventEmitter<Dependency | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined> = this._onDidChangeTreeData.event;

	constructor(private aggregateItems: () => string[]) {
		vscode.window.onDidChangeActiveTextEditor(editor => {
			// no need to do it so often
			// this._onDidChangeTreeData.fire();
		});
		vscode.workspace.onDidChangeTextDocument(e => {
		})
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Dependency): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Dependency): Thenable<Dependency[]> {
		return new Promise(resolve => {
			if (element) {
				resolve([]);
			} else {
				resolve(this.getScriptItems());
			}
		});
	}

	private getScriptItems(): Dependency[] {

		let nodes = [];

		let items = this.aggregateItems();
		items.forEach(file => {
			if (file != '') {

				let commandValue = 'vscode.open';
				let iconName = 'document.svg'

				try {
					if (fs.lstatSync(file).isDirectory()) {
						commandValue = 'vscode.openFolder';
						iconName='folder.svg'
					}
				} catch (error) {
				}

				let node = new Dependency(
					path.basename(file),
					vscode.TreeItemCollapsibleState.None,
					{
						command: commandValue,
						title: '',
						tooltip: file,
						arguments: [Uri.file(file)],
					},
					null,
					file
				);

				if (!path.isAbsolute(file))
					node.command = null;

				if (fs.existsSync(file)) {
					node.iconPath = {
						light: path.join(__filename, '..', '..', '..', 'resources', 'light', iconName),
						dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', iconName)
					};
				}
				else
					node.iconPath = null;

				nodes.push(node);
			}
		});

		return nodes;
	}
}

export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command,
		public readonly children?: string[],
		public readonly context?: string,
	) {
		super(label, collapsibleState);
	}

	iconPath = {
		light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'document.svg'),
		dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'document.svg')
	};

	contextValue = 'file';
}