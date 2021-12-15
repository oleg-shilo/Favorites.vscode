import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, commands } from "vscode";
import { default_list_file_name } from './extension'
// import { utils } from 'mocha';

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

        this._onDidChangeTreeData.fire(null);
    }

    noteNodeStates(): void {

        // not ready yet. 
        // VSCode API does not allow exploring `vscode.TreeItem` state, parent nor children :o(
        if (this.rootItem != null) {
            try {

                let config_file = path.join(FavoritesTreeProvider.user_dir, 'nodes_states.json');

                let openNodes = [];

                this.rootItem.children.forEach(node => {
                    // var collapsed = node.collapsibleState;

                });

                let config = { "current": default_list_file_name };
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
                if (element.contextValue == 'list') {
                    this.list_root_state = vscode.TreeItemCollapsibleState.Expanded; // to prevent collapsing on refresh
                    resolve(this.getFavoriteSubLists(element.children));
                }
                else {
                    let dir = element.context;
                    if (dir)
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
                command: 'favorites.open',
                title: '',
                tooltip: path.basename(dir),
                arguments: [dir],
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

    public getFavoriteItems(): FavoriteItem[] {

        let nodes = [];

        let items = this.aggregateItems();

        let singleListMode = vscode.workspace.getConfiguration("favorites").get('singleListMode', false);
        if (!singleListMode) {
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

            let showSeparator = vscode.workspace.getConfiguration("favorites").get('showListSeparator', true);
            if (showSeparator) {
                let separator = new FavoriteItem(
                    '¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: '',
                        title: '',
                        tooltip: "Items above are available lists. Items below are the items of the active/selected list",
                        arguments: null,
                    },
                    null,
                    null
                );
                separator.iconPath = null;
                nodes.push(separator);
            }

        }

        items?.forEach(item => {
            if (item != '') {

                let file = item;
                let displayName = path.basename(file);

                let tokens = item.split('|');
                if (tokens.length > 1) {
                    file = tokens[0];
                    displayName = tokens[1];
                }

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
                    displayName,
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

    private getFavoriteSubLists(files: string[]): FavoriteItem[] {

        let nodes = [];

        files.forEach(file => {
            let short_name = path.basename(file).replace(".list.txt", "");
            let collapsableState = vscode.TreeItemCollapsibleState.None;
            let commandValue = 'favorites.load';
            let iconName = '';

            if (short_name == this.currentListName())
                iconName = 'tick.svg';

            let group_name = short_name.split(".", 2)[0];
            short_name = short_name.substring(group_name.length + 1);

            let node = new FavoriteItem(
                short_name,
                collapsableState,
                {
                    command: commandValue,
                    title: '',
                    tooltip: file,
                    arguments: [file],
                },
                [],
                file);

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
        });

        return nodes;
    }

    private getFavoriteLists(): FavoriteItem[] {

        let nodes: FavoriteItem[] = [];

        let items = this.aggregateLists();
        items.sort();

        var short_names = [];
        items.forEach(file => {
            if (file != '') {
                let short_name = path.basename(file).replace(".list.txt", "");
                short_names.push(short_name);
            }
        });


        items.forEach(file => {
            if (file != '') {

                let short_name = path.basename(file).replace(".list.txt", "");

                let group_name = short_name.split(".", 2)[0];

                if (short_name != group_name) {

                    let alreadyInserted = nodes.filter(i => i.label == group_name).length != 0;

                    if (!alreadyInserted) {

                        let children = short_names
                            .filter(i => i.startsWith(group_name + '.'))
                            .map(i => path.join(path.dirname(file), i + ".list.txt"));

                        let collapsableState = vscode.TreeItemCollapsibleState.Expanded;

                        let node = new FavoriteItem(
                            group_name,
                            collapsableState,
                            {
                                command: '',
                                title: '',
                                tooltip: file,
                                arguments: [file],
                            },
                            children,
                            null
                        );

                        node.iconPath = null;
                        node.contextValue = "list";
                        nodes.push(node);
                    }
                }
                else {

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
                        [],
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
            }
        });

        return nodes;
    }
}

export class FavoriteItem extends vscode.TreeItem {

    constructor(
        public readonly label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public command?: vscode.Command,
        public readonly children?: string[],
        public readonly context?: string
    ) {
        super(label, collapsibleState);
    }

    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'document.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'document.svg')
    };

    // this is the value that is holding to be evaluated in the "view/item/context" from the package.json
    // possible values are:
    // - file
    // - list
    // - list_root
    contextValue = 'file';
}