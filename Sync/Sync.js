/*
 * 指定された2つのフォルダの同期を取ります。
 * srcFolderの内容をdestFolderにミラーリングします。
 *
 * ファイルのコピーには「xcopy /D /S /E /C /I /H /R /K /Y」を使用しています。
 * 除外ファイルが指定できます。
 *
 *  usage: cscript Sync.js 送り側 受け側
 *         [/EXCLUDE:ファイル1[+ファイル2][+ファイル3]...]
 *
 * @author Jomora ( kazuhiko@jomura.net http://jomura.net )
 * @version 2016.04.17 指定したフォルダ名もログ出力するように変更
 *          2010.02.09 xcopyの標準エラーを出力するように変更
 *          2009.01.27 空のフォルダもコピーするように変更
 *          2009.01.08 xcopyオプションをコマンドラインの後ろに変更
 *          2007.05.01 フォルダ指定をダブルクォートで囲むように変更
 *          2006.05.13 「ごみ箱へ移動」から「ファイル削除」に変更
 *          2006.01.23 ログ出力方式を変更
 *          2005.09.30 ファイルを削除せず、ごみ箱へ移動するよう変更
 *          2005.09.20 ログを標準出力するよう変更
 *          2005.09.19 作成
 */

//**Start Encode**

var fso = new ActiveXObject("Scripting.FileSystemObject");

//引数を取得
var argsNamed = WScript.Arguments.Named;
var argsUnnamed = WScript.Arguments.Unnamed;
if (argsUnnamed.length < 2) {
	usage("引数が足りません。");
}
var srcFolderPath = argsUnnamed.Item(0);
var destFolderPath = argsUnnamed.Item(1);
var excludeFileName = argsNamed.Item("EXCLUDE");
if (!fso.FolderExists(srcFolderPath)) {
	usage("指定されたフォルダ(" + srcFolderPath + ")が見つかりません。");
}
if (!fso.FolderExists(destFolderPath)) {
	fso.CreateFolder(destFolderPath);
}

var srcFolder = fso.GetFolder(srcFolderPath);
var destFolder = fso.GetFolder(destFolderPath);
srcFolderPath = srcFolder.Path;
destFolderPath = destFolder.Path;
srcParentFolderPath = fso.GetParentFolderName(srcFolderPath);
destParentFolderPath = fso.GetParentFolderName(destFolderPath);

// メイン
copy();
deleteFiles(destFolder);

WScript.Quit();


function deleteFiles(destFolder) {
	var fc = new Enumerator(destFolder.Files);
	for(; !fc.atEnd(); fc.moveNext()) {
		var srcFilePath = fc.item().Path.replace(destFolderPath, srcFolderPath);
		if (!fso.FileExists(srcFilePath)) {
			log("[delete] " + fc.item().Path.replace(destParentFolderPath, ""));
			fc.item().Delete(true);
			//remove(fc.item().Path);
		}
	}
	var subFolders = new Enumerator(destFolder.SubFolders);
	for(; !subFolders.atEnd(); subFolders.moveNext()) {
		deleteFiles(subFolders.item());
		deleteFolder(subFolders.item());
	}
}

function deleteFolder(folder) {
	var folderItemPath = folder.Path.replace(destFolderPath, srcFolderPath);
	if (!fso.FolderExists(folderItemPath)) {
		log("[delete folder] " + folder.Path.replace(destParentFolderPath, ""));
		folder.Delete(true);
	}
/*
	if (folder.Files.Count == 0 && folder.SubFolders.Count == 0) {
		log("[delete folder] " + folder.Path.replace(destFolderPath + "\\", ""));
		folder.Delete(true);
	}
*/
}

function copy() {
	var WshShell = new ActiveXObject("WScript.Shell");
	var exOpt = "";
	if (excludeFileName) {
		exOpt = " /EXCLUDE:" + excludeFileName + " ";
	}
	var commandStr = "xcopy \"" + srcFolderPath + "\" \"" + destFolderPath + "\" /D /S /E /C /I /H /R /K /Y" + exOpt;
//	WScript.Echo(commandStr);
	var oExec = WshShell.Exec(commandStr);

	var errStr;
	var quit = false;
	while(true) {
		while (!oExec.StdOut.AtEndOfStream) {
			line = oExec.StdOut.ReadLine();
			path = line.replace(srcParentFolderPath, "");
			if (line != path) {
				log("[create] " + path);
			}
		}
		while(!oExec.StdErr.AtEndOfStream) {
			errStr = oExec.StdErr.ReadAll();
			WScript.StdErr.WriteLine(errStr);
		}
		if(quit) {
			break;
		}
		quit = (oExec.Status == 1);
	}
	
	if (errStr) {
		//エラー終了
		WScript.Quit(1);
	}
}

function usage(message) {
	WScript.Echo(message + "\n\n usage: cscript //nologo Sync.js 送り側 受け側\n        [/EXCLUDE:ファイル1[+ファイル2][+ファイル3]...]");
	WScript.Quit(1);
}

function log(message) {
	var now = new Date();
	year = now.getYear();
	month = now.getMonth() + 1;
	date = now.getDate();
	hour = now.getHours();
	minute = now.getMinutes();
	second = now.getSeconds();
	dateStr = year + "/" + TwoDigits(month) + "/" + TwoDigits(date) + " " + TwoDigits(hour) + ":" + TwoDigits(minute) + ":" + TwoDigits(second);

	WScript.StdOut.WriteLine(dateStr + " " + message);
}

function TwoDigits(number) {
	if (number < 10) {
		number = "0" + number;
	}
	return number;
}

function remove(filepath) {
	var shell = new ActiveXObject("Shell.Application");
	filepath = fso.GetAbsolutePathName(filepath);
	var folder = shell.NameSpace(fso.GetParentFolderName(filepath));
	if (folder != null) {
		var folderItem = folder.ParseName(fso.GetFileName(filepath));
		if (folderItem != null) {
			folderItem.InvokeVerb("削除(&D)");
			folderItem = null;
		}
		folder = null;
	}
}
