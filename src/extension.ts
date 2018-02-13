'use strict';

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { FavoritesTreeProvider, FavoriteItem } from './tree_view';
import { Uri, commands } from 'vscode';
let expandenv = require('expandenv');

function get_favorites_items() {
    return Utils.read_all_lines(Utils.fav_file).filter(x => x != '').map(x=>expandenv(x));
}

function add_workspace(element: FavoriteItem) {
    if (vscode.workspace.rootPath) 
        _add(vscode.workspace.rootPath);
}

function add(element: FavoriteItem) {
    let document = vscode.window.activeTextEditor.document.fileName;
    _add(document);
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

function edit() {
    vscode.workspace
        .openTextDocument(Uri.file(Utils.fav_file))
        .then(vscode.window.showTextDocument);
}

export function activate(context: vscode.ExtensionContext) {

    const treeViewProvider = new FavoritesTreeProvider(get_favorites_items);

    vscode.window.registerTreeDataProvider('favorites', treeViewProvider);

    vscode.commands.registerCommand('favorites.refresh', () => treeViewProvider.refresh());
    vscode.commands.registerCommand('favorites.edit', edit);
    vscode.commands.registerCommand('favorites.add_workspace', add_workspace);
    vscode.commands.registerCommand('favorites.add', add);
    vscode.commands.registerCommand('favorites.remove', remove);
    vscode.commands.registerCommand('favorites.move_up', up);
    vscode.commands.registerCommand('favorites.move_down', down);
}

class Utils {
    private static _fav_file: string = null;

    static get fav_file(): string {
        if (Utils._fav_file == null)
            Utils._fav_file = Utils.ensure_fav_file();
        return Utils._fav_file;
    }
    
    public static read_all_lines(file: string): string[] {
        let text = fs.readFileSync(file, 'utf8');
        return text.split(/\r?\n/g);
    }

    public static write_all_lines(file: string, lines: string[]): void {
        fs.writeFileSync(file, lines.join('\n'), { encoding: 'utf8' });
    }

    public static create_dir(dir: string): void {
        let mkdirp = require('mkdirp');
        // fs.mkdirSync can only create the top level dir but mkdirp creates all child sub-dirs that do not exist  
        const allRWEPermissions = parseInt("0777", 8);
        mkdirp.sync(dir, allRWEPermissions);
    }

    // ----------------------------------------
    static ensure_fav_file(): string {
        // ext_context.storagePath cannot be used as it is undefined if no workspace loaded

        // vscode:
        // Windows %appdata%\Code\User\settings.json
        // Mac $HOME/Library/Application Support/Code/User/settings.json
        // Linux $HOME/.config/Code/User/settings.json

        let user_dir: string;

        if (os.platform() == 'win32')
            user_dir = path.join(process.env.APPDATA, 'Code', 'User', 'cs-script.user');
        else if (os.platform() == 'darwin')
            user_dir = path.join(process.env.HOME, 'Library', 'Application Support', 'Code', 'User', 'cs-script.user');
        else
            user_dir = path.join(process.env.HOME, '.config', 'Code', 'User', 'cs-script.user');

        Utils.create_dir(user_dir);

        let file = path.join(user_dir, 'favorites.txt');

        if (!fs.existsSync(file))
            Utils.write_all_lines(file, []);

        fs.watchFile(file, (curr: any, prev: any) =>
            commands.executeCommand('favorites.refresh'));

        return file;
    }
}