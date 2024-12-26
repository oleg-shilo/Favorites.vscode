import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, commands } from "vscode";
import { default_list_file_name } from './extension'
// import { utils } from 'mocha';

export function uriToLocalPath(uri: Uri): string {

    if (uri.scheme == "file" || uri.scheme == "vscode-local")
        return uri.fsPath;
    else
        return uri.scheme + ':' + uri.fsPath;
}

function expandListGroups(): boolean {
    return vscode.workspace.getConfiguration("favorites").get('expandListGroups', true);
}

function truncatePath(path: string, length?: number): string {
    let maxLength = length ?? vscode.workspace.getConfiguration("favorites").get('maxTooltipLength', 100);

    if (path && path.length > maxLength) {
        let prefixLength = 10;
        return path.substring(0, prefixLength) + "..." + path.substring(path.length - (maxLength - prefixLength - 3));
    }
    else
        return path;
}

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
                        resolve(this.getFolderItems(dir, element.rootFolder));
                }
            } else {
                resolve(this.getFavoriteItems());
            }
        });
    }

    private getFolderItems(dir: string, root: boolean): FavoriteItem[] {
        let fileNodes = [];
        let dirNodes = [];

        fs.readdirSync(dir).forEach(fileName => {
            var file = path.join(dir, fileName);

            if (fs.lstatSync(file).isFile()) {
                let node = new FavoriteItem(
                    fileName,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'favorites.open',
                        title: '',
                        tooltip: truncatePath(file),
                        arguments: [file],
                    },
                    null,
                    file
                );
                node.tooltip = truncatePath(file);
                node.resourceUri = vscode.Uri.parse(file);

                fileNodes.push(node);
            }
            else if (fs.lstatSync(file).isDirectory()) {
                let node = new FavoriteItem(
                    fileName,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    {
                        command: '',
                        title: '',
                        arguments: [],
                    },
                    null,
                    file
                );

                node.resourceUri = vscode.Uri.parse(file);
                node.tooltip = truncatePath(file);

                dirNodes.push(node);
            }
        });

        let nodes = [];

        if (root || !vscode.workspace.getConfiguration("favorites").get('disableOpeningSubfolder', false)) {

            let commandNode = new FavoriteItem(
                "<Open folder>",
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'favorites.open',
                    title: '',
                    tooltip: dir,
                    arguments: [dir],
                },
                null,
                dir);
            commandNode.iconPath = null;
            commandNode.tooltip = truncatePath(dir);

            nodes.push(commandNode);
        }

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
                    arguments: null,
                },
                null,
                null
            );

            active_list_node.contextValue = "list_root";
            active_list_node.tooltip = "Select Favorites predefined list";
            active_list_node.iconPath = new vscode.ThemeIcon("star-full");

            nodes.push(active_list_node);

            let showSeparator = vscode.workspace.getConfiguration("favorites").get('showListSeparator', true);
            if (showSeparator) {
                let separator = new FavoriteItem(
                    '¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: '',
                        title: '',
                        arguments: null,
                    },
                    null,
                    null
                );
                separator.iconPath = null;
                separator.tooltip = "Items above are available lists. Items below are the items of the active/selected list";
                nodes.push(separator);
            }

        }

        let showFolderFiles = vscode.workspace.getConfiguration("favorites").get('showFolderFiles', false);

        items?.forEach(item => {

            if (item != '') {

                // console.log("> getFavoriteItems " + (i++).toString() + " " + item);

                let item_path = item;
                let displayName = path.basename(item_path);

                let tokens = item.split('|'); // extract a possible item alias 
                if (tokens.length > 1) {
                    item_path = tokens[0];
                    displayName = tokens[1];

                    if (item_path == "") {
                        // a separator
                        let node = new FavoriteItem(item.substring(1), vscode.TreeItemCollapsibleState.None);
                        nodes.push(node);
                        return nodes;
                    }
                }

                let item_uri = vscode.Uri.parse(item_path);
                let item_local_path = uriToLocalPath(item_uri);

                let commandValue = 'favorites.open';
                let collapsableState = vscode.TreeItemCollapsibleState.None;
                let rootFolder = false;;

                try {
                    if (path.isAbsolute(item_local_path) && fs.lstatSync(item_local_path).isDirectory()) {
                        rootFolder = true;
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
                        tooltip: decodeURI(item_path),
                        arguments: [item_path],
                    },
                    null,
                    item_path,
                    rootFolder
                );

                node.tooltip = truncatePath(item_path);

                node.resourceUri = vscode.Uri.parse(item_path); // the icon is not shown without this line


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
            let iconPath: vscode.ThemeIcon;

            if (short_name == this.currentListName()) {
                iconPath = new vscode.ThemeIcon("check");
            }
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

            node.tooltip = truncatePath(file);

            if (fs.existsSync(file)) {
                node.resourceUri = vscode.Uri.parse(file);
            }

            node.contextValue = "list";
            nodes.push(node);
        });

        return nodes;
    }

    private theNode: FavoriteItem;

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

                        let collapsableState = vscode.TreeItemCollapsibleState.Collapsed;

                        if (expandListGroups()) {
                            collapsableState = vscode.TreeItemCollapsibleState.Expanded;
                        }

                        let node = new FavoriteItem(
                            group_name,
                            collapsableState,
                            {
                                command: 'favorites.clickOnGroup',
                                title: '',
                                tooltip: file,
                                arguments: [file],
                            },
                            children,
                            null
                        );

                        this.theNode = node;

                        node.tooltip = truncatePath(file);
                        node.iconPath = null;
                        node.contextValue = "list";
                        nodes.push(node);
                    }
                }
                else {

                    let commandValue = 'favorites.load';
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

                    node.tooltip = truncatePath(file);
                    node.contextValue = "list";
                    if (short_name == this.currentListName() && fs.existsSync(file))
                        node.iconPath = new vscode.ThemeIcon("check");

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
        public readonly context?: string,
        public rootFolder?: boolean
    ) {
        super(label, collapsibleState);
    }

    contextValue = 'file';
}