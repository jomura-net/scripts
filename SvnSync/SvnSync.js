//
// 異なるsubversion repositoryを同期する。
//   synsyncが使えない状況で活用する。
//   手動でコミットする場合は、"src"および"dest"フォルダを手動削除すること。
//
// usage: cscript //nologo SvnSync.js [/c:] 同期元URL 同期先URL [同期先CheckOutフォルダ]
//     <options> /c: … 自動コミットする。
//
// (1) 同期元をexport ->srcFolder
// (2) 同期先をCheckOut ->destFolder, CheckOut済ならsvn update
// (3) (1)srcFolderを(2)destFolderに上書き
// (4) svn add --force
// (5) 同期先ファイル一覧でループ、同期元にないファイルをsvn delete
// (6) svn commit
// (7) destFolder, srcFolderを削除
//
// [前提1] svnコマンドにPATHが通っていること。
// [前提2] カレントフォルダに書込権限と十分な容量があること。
// [前提3] カレントフォルダの"src","dest"というフォルダを利用していないこと。
// [前提4] CheckOutフォルダにnon-versioned-fileがある場合、Commitされてしまいます。
//
// @author Jomora ( kazuhiko@jomura.net http://jomura.net/ )
// @version 2010.02.09 標準エラー出力表示。
//          2010.02.09 コミットしない場合もsrcフォルダは削除する。
//          2010.01.25 初版作成

//**Start Encode**

var fso = new ActiveXObject("Scripting.FileSystemObject");
var shell = WScript.CreateObject("WScript.Shell");

//引数をチェック
var argsUnnamed = WScript.Arguments.Unnamed;
if (argsUnnamed.length < 2) {
	usage("引数が足りません。");
}
// 同期元subversionリポジトリURL
var srcUrl = argsUnnamed.Item(0);
// 同期先subversionリポジトリURL
var destUrl = argsUnnamed.Item(1);
// 同期先subversionリポジトリのCheckOutパス
var checkOutFolderPath = null;
if (argsUnnamed.length > 2 
		&& fso.FolderExists(argsUnnamed.Item(2) + "/.svn")) {
	checkOutFolderPath = argsUnnamed.Item(2);
}

var isCommit = WScript.Arguments.Named.Item("c") != null 
	|| WScript.Arguments.Named.Item("commit") != null;

WScript.Echo("同期元 : " + srcUrl);
WScript.Echo("同期先 : " + destUrl);
WScript.Echo("CheckOut Path : " + checkOutFolderPath);
WScript.Echo("自動commitするか？ : " + isCommit);

//main

// (0)一時フォルダを削除
deleteWorkFolders(isCommit);

// (1) 同期元をexport ->srcFolder
var exportFolderPath = "src";
svnExport(srcUrl, exportFolderPath);

// (2) 同期先をCheckOut ->destFolder, CheckOut済ならsvn update
if (null == checkOutFolderPath) {
	checkOutFolderPath = "dest";
	svnCheckOut(destUrl, checkOutFolderPath);
} else {
	svnUpdate(checkOutFolderPath);
}

// (3) (1)srcFolderを(2)destFolderに上書き
fso.CopyFolder(exportFolderPath, checkOutFolderPath, true);

// (4) svn add --force
svnAdd(checkOutFolderPath);

// (5) 同期先ファイル一覧でループ、同期元にないファイルをsvn delete
var srcFolder = fso.GetFolder(exportFolderPath);
var destFolder = fso.GetFolder(checkOutFolderPath);
srcFolderPath = srcFolder.Path;
destFolderPath = destFolder.Path;
deleteFiles(destFolder);

if (isCommit) {
	// (6) svn commit
	svnCommit(checkOutFolderPath);
}

// (7) destFolder, srcFolderを削除
WScript.Sleep(3000);
deleteWorkFolders(isCommit);

WScript.Quit();


// functions

function usage(message) {
	WScript.Echo(message + "\n\n usage: cscript //nologo SvnSync.js"
		+ " [/c:] 同期元URL 同期先URL [同期先CheckOutフォルダ]\n"
		+ "    <options> /c: … 自動コミットする。");
	WScript.Quit(1);
}

function deleteWorkFolders(isCommit) {
	if (fso.FolderExists("src")) {
		fso.DeleteFolder("src", true);
	}
	if (isCommit && fso.FolderExists("dest")) {
		fso.DeleteFolder("dest", true);
		WScript.Sleep(3000);
	}
}

function exec(command, display) {
	if (display) {
		WScript.StdOut.WriteLine(command);
	}
	var oExec = shell.Exec(command);

	var outStr;
	var errStr;
	var quit = false;
	while(true) {
		while(!oExec.StdOut.AtEndOfStream) {
			outStr = oExec.StdOut.ReadLine();
			if (display) {
				WScript.StdOut.WriteLine(outStr);
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
		WScript.Sleep(100);
	}
	
	if (errStr) {
		//エラー終了
		WScript.Quit(1);
	}
}

function svnExport(src_url, dest_path) {
	command = "svn export " + src_url + " " + dest_path + " --force --non-interactive";
	exec(command, false);
}

function svnCheckOut(destUrl, checkOutFolderPath) {
	command = "svn checkout " + destUrl + " " + checkOutFolderPath + " --non-interactive";
	exec(command, false);
}

function svnUpdate(checkOutFolderPath) {
	command = "svn update " + checkOutFolderPath + " --non-interactive --force";
	exec(command, false);
}

function deleteFiles(destFolder) {
	var fc = new Enumerator(destFolder.Files);
	for(; !fc.atEnd(); fc.moveNext()) {
		var destFilePath = fc.item().Path;
		var srcFilePath = destFilePath.replace(destFolderPath, srcFolderPath);
		if (!fso.FileExists(srcFilePath)) {
//			if (fso.FileExists(destFilePath)) {
//				fso.DeleteFile(destFilePath, true);
//			}
			svnDelete(destFilePath);
		}
	}
	var subFolders = new Enumerator(destFolder.SubFolders);
	for(; !subFolders.atEnd(); subFolders.moveNext()) {
		if (".svn" == subFolders.item().Name) {
			continue;
		}
		var destSubFolderPath = subFolders.item().Path;
		var srcSubFolderPath = destSubFolderPath.replace(destFolderPath, srcFolderPath);
		if (!fso.FolderExists(srcSubFolderPath)) {
//			if (fso.FolderExists(destFolderPath)) {
//				fso.DeleteFolder(destFolderPath, true);
//			}
			svnDelete(destSubFolderPath);
		} else {
			deleteFiles(subFolders.item());
		}
	}
}

function svnDelete(path) {
	command = "svn delete " + path + " --force";
	exec(command, false);
}

function svnAdd(path) {
	command = "svn add " + path + " --force";
	exec(command, false);
}

function svnCommit(path) {
	var now = new Date();
	year = now.getYear();
	month = now.getMonth() + 1;
	date = now.getDate();
	hour = now.getHours();
	minute = now.getMinutes();
	second = now.getSeconds();
	dateStr = year + "/" + TwoDigits(month) + "/" + TwoDigits(date)
		+ " " + TwoDigits(hour) + ":" + TwoDigits(minute) + ":" + TwoDigits(second);

	command = "svn commit " + path + " -m \"" + dateStr + "\" --non-interactive";
	exec(command, true);
}

function TwoDigits(number) {
	if (number < 10) {
		number = "0" + number;
	}
	return number;
}
