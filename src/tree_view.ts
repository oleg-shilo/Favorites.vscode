import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, commands } from "vscode";

export class FavoritesTreeProvider implements vscode.TreeDataProvider<FavoriteItem> {

	public static user_dir: string;

	private _onDidChangeTreeData: vscode.EventEmitter<FavoriteItem | undefined> = new vscode.EventEmitter<FavoriteItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FavoriteItem | undefined> = this._onDidChangeTreeData.event;

	private rootItem: FavoriteItem;
	constructor(
		private aggregateItems: () => string[],
		private aggregateLists: () => string[],
		private currentListName: () => string) {

		vscode.window.onDidChangeActiveTextEditor(editor => {
			// no need to do it so often
			// this._onDidChangeTreeData.fire();
		});
		vscode.workspace.onDidChangeTextDocument(e => {
		})
	}

	refresh(collapseLists: boolean): void {
		if (collapseLists) {
			this.list_root_state = vscode.TreeItemCollapsibleState.Collapsed;
		}

		if (this.rootItem != null) {
			//this.noteNodeStates();
		}

		this._onDidChangeTreeData.fire();
	}

	noteNodeStates(): void {

		// not ready yet. 
		// VSCode API does not allow exploring vscode.TreeItem state, parent nor children :o(
		if (this.rootItem != null) {
			try {

				let config_file = path.join(FavoritesTreeProvider.user_dir, 'nodes_states.json');

				let openNodes = [];

				this.rootItem.children.forEach(node => {
					// var collapsed = node.collapsibleState;

				});

				let config = { "current": 'Default.list.txt' };
				fs.writeFileSync(config_file, JSON.stringify(config), { encoding: 'utf8' });
				// if (node.)
			} catch (error) {
				// do nothing; doesn't matter why we failed
			}
		}
	}

	getTreeItem(element: FavoriteItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: FavoriteItem): Thenable<FavoriteItem[]> {

		if (this.rootItem == null)
			this.rootItem = element;

		return new Promise(resolve => {
			if (element) {
				if (element.contextValue == 'list_root') {
					this.list_root_state = vscode.TreeItemCollapsibleState.Expanded; // to prevent collapsing on refresh
					resolve(this.getFavoriteLists());
				}
				else {
					let dir = element.context;
					resolve(this.getFolderItems(dir));
				}
			} else {
				resolve(this.getFavoriteItems());
			}
		});
	}

	private getFolderItems(dir: string): FavoriteItem[] {
		let fileNodes = [];
		let dirNodes = [];

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
				fileNodes.push(node);
			}
			else if (fs.lstatSync(file).isDirectory()) {
				let node = new FavoriteItem(
					fileName,
					vscode.TreeItemCollapsibleState.Collapsed,
					{
						command: '',
						title: '',
						tooltip: file,
						arguments: [],
					},
					null,
					file
				);
				node.iconPath = {
					light: path.join(__filename, '..', '..', '..', 'resources', 'light', "folder.svg"),
					dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', "folder.svg")
				};
				dirNodes.push(node);
			}
		});

		let nodes = [];

		let commandNode = new FavoriteItem(
			"<Open folder>",
			vscode.TreeItemCollapsibleState.None,
			{
				command: 'vscode.openFolder',
				title: '',
				tooltip: path.basename(dir),
				arguments: [Uri.file(dir)],
			},
			null,
			dir);
		commandNode.iconPath = null;

		nodes.push(commandNode);
		dirNodes.forEach(item => nodes.push(item));
		fileNodes.forEach(item => nodes.push(item));

		return nodes;
	}

	list_root_state = vscode.TreeItemCollapsibleState.Collapsed;

	private getFavoriteItems(): FavoriteItem[] {

		let nodes = [];

		let items = this.aggregateItems();
		let active_list_node = new FavoriteItem(
			'< ' + this.currentListName() + " >",
			this.list_root_state,
			{
				command: '',
				title: '',
				tooltip: "Select Favorites predefined list",
				arguments: null,
			},
			null,
			null
		);

		active_list_node.contextValue = "list_root";

		active_list_node.iconPath = {
			light: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'favorite.svg'),
			dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'favorite.svg')
		};

		nodes.push(active_list_node);

		items.forEach(file => {
			if (file != '') {

				let commandValue = 'vscode.open';
				let iconName = 'document.svg';
				let collapsableState = vscode.TreeItemCollapsibleState.None;
				let showFolderFiles = vscode.workspace.getConfiguration("favorites").get('showFolderFiles', false);

				try {
					if (path.isAbsolute(file) && fs.lstatSync(file).isDirectory()) {
						commandValue = 'vscode.openFolder';
						iconName = 'folder.svg';
						if (showFolderFiles) {
							collapsableState = vscode.TreeItemCollapsibleState.Collapsed;
							commandValue = '';
						}
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

	private getFavoriteLists(): FavoriteItem[] {

		let nodes = [];

		let items = this.aggregateLists();

		items.forEach(file => {
			if (file != '') {

				let short_name = path.basename(file).replace(".list.txt", "");

				let commandValue = 'favorites.load';
				let iconName = '';

				if (short_name == this.currentListName())
					iconName = 'tick.svg';

				let collapsableState = vscode.TreeItemCollapsibleState.None;

				let node = new FavoriteItem(
					short_name,
					collapsableState,
					{
						command: commandValue,
						title: '',
						tooltip: file,
						arguments: [file],
					},
					null,
					file
				);

				if (fs.existsSync(file)) {
					node.iconPath = {
						light: path.join(__filename, '..', '..', '..', 'resources', 'light', iconName),
						dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', iconName)
					};
				}
				else
					node.iconPath = null;

				node.contextValue = "list";
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

	// this is the value that is foing to be evaluated in the "view/item/context" from the packae.json
	// possible values are:
	// - file
	// - list
	// - list_root
	contextValue = 'file';
}