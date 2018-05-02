'use strict';

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { FavoritesTreeProvider, FavoriteItem } from './tree_view';
import { Uri, commands } from 'vscode';
let expandenv = require('expandenv');

function get_favorites_items() {
    return Utils.read_all_lines(Utils.fav_file).filter(x => x != '').map(x => expandenv(x));
}

function get_current_list_name() {
    return '< ' + path.basename(Utils.fav_file).replace(".list.txt", "") + ' >';
}

function get_favorites_lists() {
    return Utils.fav_lists;
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

function edit_list(element: FavoriteItem) {
    vscode.workspace
        .openTextDocument(Uri.file(element.context))
        .then(vscode.window.showTextDocument);
}

function remove_list(element: FavoriteItem) {
    if (element.context == Utils.fav_file) {
        vscode.window.showErrorMessage("Error: you cannot  delete the list that is currently loaded.");
    }
    else if (element.context.endsWith("Default.list.txt")) {
        vscode.window.showErrorMessage("Error: you can only delete non default favorites list.");
    }
    else {
        fs.unlinkSync(element.context);
        commands.executeCommand('favorites.refresh');
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

function new_list() {
    let options: vscode.InputBoxOptions = {
        prompt: "Enter the name of the new Favorites list",
        placeHolder: "ex.: Test scripts",
    };

    vscode.window.showInputBox(options)
        .then(value => {
            if (value) {
                Utils.createNewList(value);
                commands.executeCommand('favorites.refresh');
            }
        });
}



export function activate(context: vscode.ExtensionContext) {

    const treeViewProvider = new FavoritesTreeProvider(get_favorites_items, get_favorites_lists, get_current_list_name);

    vscode.window.registerTreeDataProvider('favorites', treeViewProvider);

    vscode.commands.registerCommand('favorites.load', load);
    vscode.commands.registerCommand('favorites.new_list', new_list);
    vscode.commands.registerCommand('favorites.refresh', () => treeViewProvider.refresh());
    vscode.commands.registerCommand('favorites.edit', edit);
    vscode.commands.registerCommand('favorites.edit_list', edit_list);
    vscode.commands.registerCommand('favorites.add_workspace', add_workspace);
    vscode.commands.registerCommand('favorites.add', add);
    vscode.commands.registerCommand('favorites.remove', remove);
    vscode.commands.registerCommand('favorites.remove_list', remove_list);
    vscode.commands.registerCommand('favorites.move_up', up);
    vscode.commands.registerCommand('favorites.move_down', down);
}

class Utils {
    private static _fav_file: string = null;
    static user_dir: string;

    static get fav_lists(): string[] {
        let files: string[] = [];
        fs.readdirSync(Utils.user_dir)
            .forEach(fileName => {
                let file = path.join(Utils.user_dir, fileName);
                if (fs.lstatSync(file).isFile() && file.endsWith(".list.txt")) {
                    files.push(file);
                }
            });

        return files;
    }

    static get fav_file(): string {
        if (Utils._fav_file == null)
            Utils.setCurrentFavFile(Utils.ensure_fav_file());
        return Utils._fav_file;
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
        fs.writeFileSync(file, { encoding: 'utf8' });
    }

    public static create_dir(dir: string): void {
        let mkdirp = require('mkdirp');
        // fs.mkdirSync can only create the top level dir but mkdirp creates all child sub-dirs that do not exist  
        const allRWEPermissions = parseInt("0777", 8);
        mkdirp.sync(dir, allRWEPermissions);
    }

    // ----------------------------------------
    static migrate_old_version_to(): void {
        let old_user_dir = Utils.user_dir.replace('favorites.user', 'cs-script.user');

        let file = path.join(Utils.user_dir, 'default.list.txt');
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
        Utils.write_all_lines(file, [file]);
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

        Utils._fav_file = file;;
    }

    static ensure_fav_file(): string {
        // ext_context.storagePath cannot be used as it is undefined if no workspace loaded

        // vscode:
        // Windows %appdata%\Code\User\settings.json
        // Mac $HOME/Library/Application Support/Code/User/settings.json
        // Linux $HOME/.config/Code/User/settings.json

        if (os.platform() == 'win32')
            Utils.user_dir = path.join(process.env.APPDATA, 'Code', 'User', 'favorites.user');
        else if (os.platform() == 'darwin')
            Utils.user_dir = path.join(process.env.HOME, 'Library', 'Application Support', 'Code', 'User', 'favorites.user');
        else
            Utils.user_dir = path.join(process.env.HOME, '.config', 'Code', 'User', 'favorites.user');


        Utils.create_dir(Utils.user_dir);

        Utils.migrate_old_version_to();

        let default_list = path.join(Utils.user_dir, 'Default.list.txt');
        if (!fs.existsSync(default_list))
            Utils.write_all_lines(default_list, []);

        let config_file = path.join(Utils.user_dir, 'config.json');
        if (!fs.existsSync(config_file)) {
            let config = { "current": 'Default.list.txt' };
            Utils.write_all_text(config_file, JSON.stringify(config));
        }

        try {
            let config = JSON.parse(Utils.read_all_text(config_file));
            return path.join(Utils.user_dir, config.current);
        } catch (error) {
            return default_list;
        }
    }
}