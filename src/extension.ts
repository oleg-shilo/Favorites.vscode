'use strict';

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { FavoritesTreeProvider, FavoriteItem, uriToLocalPath } from './tree_view';
import { Uri, commands } from 'vscode';
import { ExecSyncOptionsWithBufferEncoding } from 'child_process';
import { env } from 'process';
import { Console } from 'console';
let expandenv = require('expandenv');

export let default_list_file_name = 'Default.list.txt';

let outputChannel = vscode.window.createOutputChannel("CS-Script3");

function get_list_items() {
    if (fs.existsSync(Utils.fav_file)) {
        let defaultItems = Utils.read_all_lines(Utils.fav_file).filter(x => x != '' && !x.startsWith("#")).map(x => expandenv(x));

        let localDir = GetCurrentWorkspaceFolder();
        if (localDir) {

            function read_list(file: string) {
                if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
                    var localListItems = Utils
                        .read_all_lines(file)
                        .filter(x => x != '' && !x.startsWith("#"))
                        .map(x => expandenv(x))
                        .map(x => {
                            if (path.isAbsolute(x))
                                return x;
                            else
                                return path.join(localDir, x);
                        });

                    defaultItems = defaultItems.concat(localListItems);
                }
            }

            read_list(path.join(localDir, ".fav", "local.list.txt"));
            read_list(path.join(localDir, ".vscode", "fav.local.list.txt"));
        }

        return defaultItems;
    }
    else {
        vscode.window.showErrorMessage(`The list ${path.basename(Utils.fav_file)} is not found. Loading the default Favorites list instead.`);
        Utils.setCurrentFavFile(Utils.fav_default_file);
        commands.executeCommand('favorites.refresh');
    }
}

function get_current_list_name() {
    return path.basename(Utils.fav_file).replace(".list.txt", "");
}

function get_favorites_lists() {
    return Utils.fav_lists;
}

function add_workspace(element: FavoriteItem) {
    if (vscode.workspace.workspaceFolders)
        _add(vscode.workspace.workspaceFolders[0].uri.fsPath);
}

function alt_cmd(element: FavoriteItem) {
    vscode.window.showErrorMessage('alt_cmd');
}

function add_file(fileUri: vscode.Uri, list: any[]) {
    add(fileUri?.fsPath);
}

function add(fileName: string) {

    let obj: any = fileName;
    if (obj && (obj instanceof String || typeof obj === 'string')) {

        // There are the reports that sometimes `fileName` is FavoriteItem but it is not clear how it can happen 
        // (maybe it has something to do with the focus management)
        // but it started from VSCode v1.93.1
        // https://github.com/oleg-shilo/Favorites.vscode/issues/49

        _add(fileName);
    }
    else {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showErrorMessage(
                'The path of the active document is not available. If you are trying to add the document that is being ' +
                'viewed in a custom editor (e.g. pdf, epub) then you need to add the file via context menu of the active document tab');
        }
        else {
            let document = vscode.window.activeTextEditor.document.fileName;
            let isLocalPath = false;

            if (vscode.window.activeTextEditor?.document) {
                isLocalPath = fs.existsSync(uriToLocalPath(vscode.window.activeTextEditor?.document?.uri));
            }

            if (!isLocalPath) {
                document = decodeURI(vscode.window.activeTextEditor.document.uri.toString())
            }
            _add(document);
        }
    }
}

function _add(document: string) {

    let lines: string[] = Utils.read_all_lines(Utils.fav_file);

    if (lines.find(x => x == document) != null) {
        vscode.window.showErrorMessage('The active document is already in the Favorites.');
    }
    else {
        lines.push(document);

        Utils.write_all_lines(Utils.fav_file, lines.filter(x => x != ''));

        commands.executeCommand('favorites.refresh');
    }
}

function up(element: FavoriteItem) {

    let lines = Utils.read_all_lines(Utils.fav_file).filter(x => x != '');

    let index = lines.indexOf(element.context);
    if (index != -1 && index != 0) {
        lines.splice(index, 1);
        lines.splice(index - 1, 0, element.context);
    }

    Utils.write_all_lines(Utils.fav_file, lines);

    commands.executeCommand('favorites.refresh');
}

function down(element: FavoriteItem) {

    let lines = Utils.read_all_lines(Utils.fav_file).filter(x => x != '');

    let index = lines.indexOf(element.context);
    if (index != -1 && index <= lines.length) {
        lines.splice(index, 1);
        lines.splice(index + 1, 0, element.context);
    }

    Utils.write_all_lines(Utils.fav_file, lines);

    commands.executeCommand('favorites.refresh');
}

function remove(element: FavoriteItem) {
    let lines: string[] = [];

    Utils.read_all_lines(Utils.fav_file)
        .filter(x => x != '')
        .forEach(x => {
            if (x != element.context)
                lines.push(x);
        });

    Utils.write_all_lines(Utils.fav_file, lines);

    commands.executeCommand('favorites.refresh');
}

async function set_alias(element: FavoriteItem) {
    let lines: string[] = [];

    let current_item_spec = '';
    let current_alias = '';

    if (element.context.endsWith(element.label)) {
        current_item_spec = element.context;
        current_alias = null;
    } else {
        current_item_spec = `${element.context}|${element.label}`;
        current_alias = element.label;
    }

    let item_uri = vscode.Uri.parse(element.context);
    let current_item_local_path = uriToLocalPath(item_uri);

    if (element.contextValue != 'file' ||
        element.context == null ||
        !fs.existsSync(current_item_local_path)) {
        vscode.window.showInformationMessage(`You can set alias only to the existing local file or folder.`);
        return;
    }

    let input = await vscode.window.showInputBox({
        prompt: 'Enter a new alias or an empty string to remove the existing alias.',
        value: current_alias
    });

    if (input != null) {

        let lines: string[] = [];

        var currentItems = Utils.read_all_lines(Utils.fav_file).filter(x => x != '');
        let currentPath = element.context;

        if (input == "") { // removing 
            currentItems.forEach(item_spec => {
                if (item_spec == current_item_spec)
                    lines.push(currentPath);
                else
                    lines.push(item_spec);
            });
        }
        else { // adding
            currentItems.forEach(item_spec => {

                if (uriToLocalPath(vscode.Uri.parse(item_spec)) == current_item_local_path)
                    lines.push(`${currentPath}|${input}`);
                else
                    lines.push(item_spec);
            });
        }

        Utils.write_all_lines(Utils.fav_file, lines);

        commands.executeCommand('favorites.refresh');
    }
}

function edit_list(element: FavoriteItem) {
    vscode.workspace
        .openTextDocument(Uri.file(element.context))
        .then(vscode.window.showTextDocument);
}

function remove_list(element: FavoriteItem) {
    if (!element.context.endsWith(".list.txt")) {
        vscode.window.showErrorMessage(
            "Error: you can only perform this operation on the list itself.\n" +
            "It looks like you are trying to do it for the list item instead.");
    }
    else {
        if (element.context.endsWith("Default.list.txt")) {
            vscode.window.showErrorMessage("Error: you can only delete non default favorites list.");
        }
        else {

            if (element.context == Utils.fav_file) {
                Utils.setCurrentFavFile("Default.list.txt");
                fs.unlinkSync(element.context);
            }
            else {
                fs.unlinkSync(element.context);
                commands.executeCommand('favorites.refresh');
            }
        }
    }
}

function open_all_files(element: FavoriteItem) {

    try {
        let lines: string[] = Utils.read_all_lines(Utils.fav_file);

        lines.forEach(file => {
            if (fs.existsSync(file) && Utils.is_file(file)) {
                commands.executeCommand('vscode.open', Uri.file(file));
            }
        });
    } catch (error) {

    }
}

function file_name_sanatize(text: string): string {
    return text.replace(/[\/\?<>\\:\*\|":]/g, "_");
}

function rename_list(element: FavoriteItem) {

    if (!element.context.endsWith(".list.txt")) {
        vscode.window.showErrorMessage(
            "Error: you can only perform this operation on the list itself.\n" +
            "It looks like you are trying to do it for the list item instead.");
    }
    else {
        if (element.context.endsWith("Default.list.txt")) {
            vscode.window.showErrorMessage("Error: you can only rename non default favorites list.");
        }
        else {

            let options: vscode.InputBoxOptions = {
                prompt: "Enter the new file name for the selected Favorites list",
                placeHolder: "ex.: Test scripts",
            };

            vscode.window.showInputBox(options)
                .then(value => {
                    if (value) {
                        value = file_name_sanatize(value);
                        let new_file = path.join(Utils.user_dir, value + ".list.txt");

                        try {
                            fs.renameSync(element.context, new_file);
                            commands.executeCommand('favorites.refresh');
                        } catch (error) {
                            vscode.window.showErrorMessage(error.message);
                        }
                    }
                });
        }
    }
}

function edit() {
    vscode.workspace
        .openTextDocument(Uri.file(Utils.fav_file))
        .then(vscode.window.showTextDocument);
}

function load(list: string) {
    Utils.setCurrentFavFile(list);
    commands.executeCommand('favorites.refresh');
}
function clickOnGroup() {
    vscode.window.showInformationMessage("Expand the node before selecting the list.");
}

function open(path: string) {
    // VSCode opens documents clicked in the Favorites tree in the preview mode if 
    // workbench.editor.enablePreview enabled (VSCode default)
    // interestingly enough opening documents from QuickPick does not have this issue

    const configuration = vscode.workspace.getConfiguration();

    let previewEnabled = vscode.workspace.getConfiguration("workbench").get('editor.enablePreview', true);
    let disableWarning = vscode.workspace.getConfiguration("favorites").get('disablePreviewWarning', false);


    let disablePreview = "Disable 'enablePreview' setting";
    let doNotShowAgain = "Do not show this warning again";

    let saveSetting = (name, value) => {
        try {
            configuration.update(name, value, vscode.ConfigurationTarget.Global); // Save to global settings
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to update setting: ${error.message}`);
        }
    };

    if (previewEnabled && !disableWarning) {
        vscode.window.showWarningMessage(
            `VSCode opens Favorites documents in the 'preview mode'. If you want to open Favorites files normally then you need to disable the 'workbench.editor.enablePreview' setting.
            Read more: https://github.com/oleg-shilo/Favorites.vscode?tab=readme-ov-file#hintstips`,
            disablePreview, doNotShowAgain)
            .then((selection) => {
                if (selection === doNotShowAgain) {
                    saveSetting('favorites.disablePreviewWarning', true);

                } else if (selection === disablePreview) {
                    saveSetting('workbench.editor.enablePreview', false);
                }
            });
    }
    open_path(path, false);
}

function open_path(path: string, newWindow: boolean) {

    // vscode.window.showErrorMessage("About to open :" + path);

    let uri = Uri.parse(path);

    if (!uri.scheme || uri.scheme.length <= 1) {
        // if required it's possible to use `vscode.env.remoteName` to check if remote channel is open 
        uri = Uri.file(path);
    }

    // as for VSCode v1.63.2 these are anomalies/peculiarities of `vscode.openFolder` and `vscode.open`
    // `vscode.open` opens files OK but throws the exception on attempt to open folder
    // `vscode.openFolder` opens files and folders OK
    // `vscode.open` does not have option to open file in a new window `vscode.openFolder` does
    // `vscode.openFolder` ignores the call if the folder (or workspace) is already open either in teh current window or a new one
    // workspace file needs to be opened `vscode.openFolder`
    // Amazing API :o(

    if (fs.existsSync(uri.fsPath) && fs.lstatSync(uri.fsPath).isDirectory()) {

        let workspace = Utils.get_workspace_file(uri.fsPath);

        if (workspace) { // opening workspace file
            if (!newWindow && workspace == vscode.workspace?.workspaceFile?.fsPath)
                commands.executeCommand('revealInExplorer', Uri.file(vscode.workspace.workspaceFolders[0].uri.fsPath));
            else
                commands.executeCommand('vscode.openFolder', Uri.file(workspace), newWindow);

        }
        else { // opening folder

            if (!newWindow && vscode.workspace?.workspaceFolders) {
                if (uri.fsPath.includes(vscode.workspace.workspaceFolders[0].uri.fsPath)) {

                    if (uri.fsPath == vscode.workspace.workspaceFolders[0].uri.fsPath) {
                        // is already opened folder
                        commands.executeCommand('revealInExplorer', uri);
                        return;

                    } else {
                        // child of already opened folder

                        let disableOpeningSubfolderOfLoadedFolder = vscode.workspace
                            .getConfiguration("favorites")
                            .get('disableOpeningSubfolderOfLoadedFolder', false);

                        if (disableOpeningSubfolderOfLoadedFolder) {
                            vscode.window.showErrorMessage("The parent folder is already opened in VSCode.");
                            return;
                        }
                    }
                }
            }

            if (newWindow)
                commands.executeCommand('vscode.openFolder', uri, true);
            else
                commands.executeCommand('vscode.openFolder', uri);
        }
    }
    else { // opening file or invalid path (let VSCode report the error)

        // vscode.window.showInformationMessage("Opening: " + uri);

        if (newWindow)
            commands.executeCommand('vscode.openFolder', uri, true);
        else
            commands.executeCommand('vscode.open', uri);
    }
}

function open_in_new_window(item: FavoriteItem) {
    open_path(item.context, true);
}

function new_list() {
    let options: vscode.InputBoxOptions = {
        prompt: "Enter the file name of the new Favorites list",
        placeHolder: "ex.: Test scripts",
    };

    vscode.window.showInputBox(options)
        .then(value => {
            if (value) {
                value = file_name_sanatize(value);
                Utils.createNewList(value);
                commands.executeCommand('favorites.refresh');
            }
        });
}

function associate_list_with_workspace(element: FavoriteItem, associate: boolean): void {

    if (element && element.contextValue == 'list' && fs.existsSync(element.context)) {
        if (associate) {
            let folder = GetCurrentWorkspaceFolder();
            if (folder) {
                let lines = Utils.read_all_lines(element.context);
                lines = lines.filter(x => !x.startsWith("# workspace:"));
                lines.splice(0, 0, "# workspace:" + folder);
                Utils.write_all_lines(element.context, lines.filter(x => x != ''));
                commands.executeCommand('favorites.refresh');
            }
            else {
                // show error message
                vscode.window.showErrorMessage("You can only associate the Favorites list with the open workspace/folder and currently none is opened.");
            }
        }
        else {
            let lines = Utils.read_all_lines(element.context);
            Utils.write_all_lines(element.context, lines.filter(x => !x.startsWith("# workspace:")).filter(x => x != ''));
            commands.executeCommand('favorites.refresh');
        }
    }
}

function get_user_dir(): string {

    // ext_context.storagePath cannot be used as it is undefined if no workspace loaded

    // vscode:
    // Windows %appdata%\Code\User\settings.json
    // Mac $HOME/Library/Application Support/Code/User/settings.json
    // Linux $HOME/.config/Code/User/settings.json

    let dataLocation = vscode.workspace.getConfiguration("favorites").get('dataLocation', '<default>');

    if (dataLocation == '')
        dataLocation = '<default>';
    else
        dataLocation = dataLocation.replace("${execPath}", process.execPath);


    if (dataLocation != '<default>') {

        try {
            fs.mkdirSync(dataLocation);
        } catch (error) {
            if (error.code != 'EEXIST') {
                vscode.window.showErrorMessage("Custom data directory ('" + dataLocation + "') cannot be accessed/created. Falling back to the default data location.");
            }
        }

        return dataLocation;
    }


    ///////////////////////////////////////
    let dataRoot = path.join(path.dirname(process.execPath), "data");
    let isPortable = (fs.existsSync(dataRoot) && fs.lstatSync(dataRoot).isDirectory());
    ///////////////////////////////////////

    if (isPortable) {
        return path.join(dataRoot, 'user-data', 'User', 'globalStorage', 'favorites.user');
    } else {
        if (os.platform() == 'win32')
            return path.join(process.env.APPDATA, 'Code', 'User', 'favorites.user');
        else if (os.platform() == 'darwin')
            return path.join(process.env.HOME, 'Library', 'Application Support', 'Code', 'User', 'favorites.user');
        else
            return path.join(process.env.HOME, '.config', 'Code', 'User', 'favorites.user');
    }
}

function quick_pick() {

    let map = new Map();
    try {
        let lines: string[] = Utils
            .read_all_lines(Utils.fav_file)
            .map(x => expandenv(x));

        lines.forEach(fileSpec => {
            let specParts = fileSpec.split('|');
            let file = specParts[0];
            let alias = specParts.length > 1 ? specParts[1] : file;

            // if (fs.existsSync(file) && Utils.is_file(file)) 
            {

                // unfortunately showQuickPick does not support icons, so we need to use markdown
                // https://code.visualstudio.com/api/references/icons-in-labels
                let icon = "$(symbol-file) ";

                if (!fs.existsSync(file)) {
                    if (file.startsWith("vscode-"))
                        icon = "$(remote) "; // we cannot know if it exists for sure
                    else
                        icon = "$(warning) ";
                }
                else if (fs.existsSync(file) && !Utils.is_file(file)) {
                    icon = "$(chevron-right) ";
                    // icon = "$(symbol-folder) ";
                }


                let key = alias;
                if (file.length > 55)
                    key = file.substring(0, 20) + "..." + file.substring(file.length - 30);

                map.set(icon + key, () => open(file));
            }
        });
    } catch (error) {

    }

    vscode.window
        .showQuickPick(Array.from(map.keys()))
        .then(selectedItem => map.get(selectedItem)());
}

export function activate(context: vscode.ExtensionContext) {

    FavoritesTreeProvider.user_dir = get_user_dir();

    const treeViewProvider = new FavoritesTreeProvider(get_list_items, get_favorites_lists, get_current_list_name);


    vscode.window.registerTreeDataProvider("favorites-explorer-view", treeViewProvider);

    vscode.commands.registerCommand('favorites.open_new_window', open_in_new_window);
    vscode.commands.registerCommand('favorites.open', open);
    vscode.commands.registerCommand('favorites.load', load);
    vscode.commands.registerCommand('favorites.clickOnGroup', clickOnGroup);
    vscode.commands.registerCommand('favorites.alt_cmd', alt_cmd);
    vscode.commands.registerCommand("favorites.quick_pick", quick_pick);
    vscode.commands.registerCommand('favorites.new_list', new_list);
    vscode.commands.registerCommand('favorites.refresh', () => treeViewProvider.refresh(false));
    vscode.commands.registerCommand('favorites.refresh_all', () => treeViewProvider.refresh(true));
    vscode.commands.registerCommand('favorites.edit', edit);
    vscode.commands.registerCommand('favorites.edit_list', edit_list);
    vscode.commands.registerCommand('favorites.add_workspace', add_workspace);
    vscode.commands.registerCommand('favorites.add', add);
    vscode.commands.registerCommand('favorites.add_file', add_file);
    vscode.commands.registerCommand('favorites.remove', remove);
    vscode.commands.registerCommand('favorites.set_alias', set_alias);
    vscode.commands.registerCommand('favorites.remove_list', remove_list);
    vscode.commands.registerCommand('favorites.rename_list', rename_list);
    vscode.commands.registerCommand('favorites.associate_list_with_workspace', e => associate_list_with_workspace(e, true));
    vscode.commands.registerCommand('favorites.disassociate_list_from_workspace', e => associate_list_with_workspace(e, false));
    vscode.commands.registerCommand('favorites.open_all_files', open_all_files);
    vscode.commands.registerCommand('favorites.move_up', up);
    vscode.commands.registerCommand('favorites.move_down', down);

    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration("favorites.singleListMode")) {
            treeViewProvider.refresh(false);
        }
    })
}


function GetCurrentWorkspaceFolder(): string {
    let folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0)
        return folders[0].uri.fsPath;
    else
        return null;
}
class Utils {
    private static _fav_file: string = null;
    static user_dir: string;

    static get_workspace_file(folder: string): string {
        let result = null;
        fs.readdirSync(folder).forEach(fileName => {
            if (result == null && fileName.endsWith(".code-workspace"))
                result = path.join(folder, fileName);
        });
        return result;
    }

    public static get fav_lists(): string[] {
        let lists: string[] = [];
        let lists_for_workspace: string[] = [];
        let currentWorkspaceFolder = GetCurrentWorkspaceFolder();

        fs.readdirSync(Utils.user_dir)
            .forEach(fileName => {
                let file = path.join(Utils.user_dir, fileName);

                if (fs.lstatSync(file).isFile() && file.endsWith(".list.txt")) {
                    let specificToFolder = Utils.read_all_lines(file).filter(x => x.startsWith("# workspace:"));

                    if (specificToFolder.length == 0) {
                        lists.push(file);
                    }
                    else if (specificToFolder[0].replace("# workspace:", "") == currentWorkspaceFolder)
                        lists_for_workspace.push(file);
                }
            });

        if (lists_for_workspace.length > 0)
            return lists_for_workspace;
        else
            return lists;
    }

    static get fav_file(): string {
        if (Utils._fav_file == null)
            Utils.setCurrentFavFile(Utils.ensure_fav_file());
        return Utils._fav_file;
    }
    static get fav_default_file(): string {
        let default_list = path.join(Utils.user_dir, default_list_file_name);
        if (!fs.existsSync(default_list)) {
            if (Utils.fav_lists.length == 0) {
                Utils.write_all_lines(default_list, []);
            }
            else {
                default_list = Utils.fav_lists[0];
            }
        }
        return default_list;
    }

    public static read_all_lines(file: string): string[] {
        let text = fs.readFileSync(file, 'utf8');
        return text.split(/\r?\n/g);
    }

    public static read_all_text(file: string): string {
        let text = fs.readFileSync(file, 'utf8');
        return text;
    }

    public static write_all_lines(file: string, lines: string[]): void {
        fs.writeFileSync(file, lines.join('\n'), { encoding: 'utf8' });
    }

    public static write_all_text(file: string, text: string): void {
        fs.writeFileSync(file, text, { encoding: 'utf8' });
    }

    public static create_dir(dir: string): void {
        let mkdirp = require('mkdirp');
        // fs.mkdirSync can only create the top level dir but mkdirp creates all child sub-dirs that do not exist 
        if (!fs.existsSync(dir)) {
            const allRWEPermissions = parseInt("0777", 8);
            mkdirp.sync(dir, allRWEPermissions);
        }
    }

    public static is_file(path: string): boolean {
        var fs = require('fs');
        var stats = fs.statSync(path);
        return stats.isFile();
    }

    // ----------------------------------------
    static migrate_old_version_to(): void {
        let old_user_dir = Utils.user_dir.replace('favorites.user', 'cs-script.user');

        let file = path.join(Utils.user_dir, default_list_file_name);
        let old_file = path.join(old_user_dir, 'favorites.txt');

        if (fs.existsSync(old_file)) {
            if (!fs.existsSync(file)) {
                fs.renameSync(old_file, file);
            }
        }
    }

    static current_list: string;

    static createNewList(list_name: string): void {
        let file = path.join(Utils.user_dir, list_name + ".list.txt");
        Utils.write_all_lines(file, ["# The content below is just a Favorites list sample", "--- Section A ---", file]);
        Utils.setCurrentFavFile(file);
    }

    static setCurrentFavFile(list_name: string): void {

        let file = list_name;

        if (!path.isAbsolute(file))
            file = path.join(Utils.user_dir, list_name);

        if (Utils._fav_file && Utils._fav_file != file)
            fs.unwatchFile(file, (curr: any, prev: any) =>
                commands.executeCommand('favorites.refresh'));

        fs.watchFile(file, (curr: any, prev: any) =>
            commands.executeCommand('favorites.refresh'));

        Utils._fav_file = file;

        let list_short_name = list_name.replace(Utils.user_dir + path.sep, "");
        let config = JSON.stringify({ "current": list_short_name });

        Utils.write_all_text(path.join(Utils.user_dir, 'config.json'), config);
    }

    static ensure_fav_file(): string {

        Utils.user_dir = get_user_dir();

        Utils.create_dir(Utils.user_dir);

        Utils.migrate_old_version_to();

        let default_list = Utils.fav_default_file; // 'Default.list.txt'

        let config_file = path.join(Utils.user_dir, 'config.json');
        if (!fs.existsSync(config_file)) {
            let config = { "current": default_list_file_name };
            Utils.write_all_text(config_file, JSON.stringify(config));
        }

        try {
            let config = JSON.parse(Utils.read_all_text(config_file));
            if (path.isAbsolute(config.current))
                return config.current;
            else
                return path.join(Utils.user_dir, config.current);

        } catch (error) {
            return default_list;
        }
    }
}


