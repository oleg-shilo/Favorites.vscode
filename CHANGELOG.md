# Change Log

## 1.1.3
- Fixed problem with opening folder on "<Open folder>" node double-click.

## 1.1.2
- Implemented extending envars in the path of the item definition (Issue #2).
- Implemented 'command-node' for opening parent folder node. To address usability problems caused by VSCode TreeView item defect (Microsoft/vscode/issues/34130 and patrys/vscode-code-outline/issues/24)

## 1.1.1
- Fixed problem with settings section being hidden in VSCode contributions tab.
- Added option to show favorite's folder item sub-folders content. Controlled by `favorites.folderFilesTopLevelOnly` setting.

## 1.1.0
- Added option to show Favorite folder content (top level files). It is the response to the feature request #1.
This feature is not a substitution of the Workspace explorer view, which does by far superior job. It's just a convenience measure for a quick access of the top level folder files.  The feature can be enabled/disabled with `favorites.showFolderFiles` setting.

Note, the feature overall experience is subject to the limitations/defects of the VSCode tree view. These defects are officially reported and being dealt with by the VSCode team:
https://github.com/Microsoft/vscode/issues/34130
https://github.com/patrys/vscode-code-outline/issues/24

## 1.0.2
- Added support for folders
- Items icons reflect if file/folder exist or not
- Added context menu for moving items up/down in the list 

## 1.0.1
- Updated images

## 1.0.0
- Initial release
