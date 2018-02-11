import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, commands } from "vscode";

export class FavoritesTreeProvider implements vscode.TreeDataProvider<FavoriteItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<FavoriteItem | undefined> = new vscode.EventEmitter<FavoriteItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FavoriteItem | undefined> = this._onDidChangeTreeData.event;

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

	getTreeItem(element: FavoriteItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: FavoriteItem): Thenable<FavoriteItem[]> {
		return new Promise(resolve => {
			if (element) {
				let nodes = [];
				let dir = element.context;
				fs.readdirSync(dir).forEach(fileName => {
					var file = path.join(dir, fileName);
					if (fs.lstatSync(file).isFile()) {
						let node = new FavoriteItem(
							fileName,
							vscode.TreeItemCollapsibleState.None,
							{
								command: 'vscode.open',
								title: '',
								tooltip: file,
								arguments: [Uri.file(file)],
							},
							null,
							file
						);
						nodes.push(node);
					}
				})
				resolve(nodes);
			} else {
				resolve(this.getScriptItems());
			}
		});
	}

	private getScriptItems(): FavoriteItem[] {

		let nodes = [];

		let items = this.aggregateItems();
		items.forEach(file => {
			if (file != '') {

				let commandValue = 'vscode.open';
				let iconName = 'document.svg';
				let collapsableState = vscode.TreeItemCollapsibleState.None;
				let showFolderFiles = vscode.workspace.getConfiguration("favorites").get('showFolderFiles', true);

				try {
					if (path.isAbsolute(file) && fs.lstatSync(file).isDirectory()) {
						commandValue = 'vscode.openFolder';
						iconName = 'folder.svg';
						if (showFolderFiles)
							collapsableState = vscode.TreeItemCollapsibleState.Collapsed;
					}
				} catch (error) {
				}

				let node = new FavoriteItem(
					path.basename(file),
					collapsableState,
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

export class FavoriteItem extends vscode.TreeItem {

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