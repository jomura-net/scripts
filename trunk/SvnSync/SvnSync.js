//
// �قȂ�subversion repository�𓯊�����B
//   synsync���g���Ȃ��󋵂Ŋ��p����B
//   �蓮�ŃR�~�b�g����ꍇ�́A"src"�����"dest"�t�H���_���蓮�폜���邱�ƁB
//
// usage: cscript //nologo SvnSync.js [/c:] ������URL ������URL [������CheckOut�t�H���_]
//     <options> /c: �c �����R�~�b�g����B
//
// (1) ��������export ->srcFolder
// (2) �������CheckOut ->destFolder, CheckOut�ςȂ�svn update
// (3) (1)srcFolder��(2)destFolder�ɏ㏑��
// (4) svn add --force
// (5) ������t�@�C���ꗗ�Ń��[�v�A�������ɂȂ��t�@�C����svn delete
// (6) svn commit
// (7) destFolder, srcFolder���폜
//
// [�O��1] svn�R�}���h��PATH���ʂ��Ă��邱�ƁB
// [�O��2] �J�����g�t�H���_�ɏ��������Ə\���ȗe�ʂ����邱�ƁB
// [�O��3] �J�����g�t�H���_��"src","dest"�Ƃ����t�H���_�𗘗p���Ă��Ȃ����ƁB
// [�O��4] CheckOut�t�H���_��non-versioned-file������ꍇ�ACommit����Ă��܂��܂��B
//
// @author Jomora ( kazuhiko@jomura.net http://jomura.net/ )
// @version 2010.02.09 �W���G���[�o�͕\���B
//          2010.02.09 �R�~�b�g���Ȃ��ꍇ��src�t�H���_�͍폜����B
//          2010.01.25 ���ō쐬

//**Start Encode**

var fso = new ActiveXObject("Scripting.FileSystemObject");
var shell = WScript.CreateObject("WScript.Shell");

//�������`�F�b�N
var argsUnnamed = WScript.Arguments.Unnamed;
if (argsUnnamed.length < 2) {
	usage("����������܂���B");
}
// ������subversion���|�W�g��URL
var srcUrl = argsUnnamed.Item(0);
// ������subversion���|�W�g��URL
var destUrl = argsUnnamed.Item(1);
// ������subversion���|�W�g����CheckOut�p�X
var checkOutFolderPath = null;
if (argsUnnamed.length > 2 
		&& fso.FolderExists(argsUnnamed.Item(2) + "/.svn")) {
	checkOutFolderPath = argsUnnamed.Item(2);
}

var isCommit = WScript.Arguments.Named.Item("c") != null 
	|| WScript.Arguments.Named.Item("commit") != null;

WScript.Echo("������ : " + srcUrl);
WScript.Echo("������ : " + destUrl);
WScript.Echo("CheckOut Path : " + checkOutFolderPath);
WScript.Echo("����commit���邩�H : " + isCommit);

//main

// (0)�ꎞ�t�H���_���폜
deleteWorkFolders(isCommit);

// (1) ��������export ->srcFolder
var exportFolderPath = "src";
svnExport(srcUrl, exportFolderPath);

// (2) �������CheckOut ->destFolder, CheckOut�ςȂ�svn update
if (null == checkOutFolderPath) {
	checkOutFolderPath = "dest";
	svnCheckOut(destUrl, checkOutFolderPath);
} else {
	svnUpdate(checkOutFolderPath);
}

// (3) (1)srcFolder��(2)destFolder�ɏ㏑��
fso.CopyFolder(exportFolderPath, checkOutFolderPath, true);

// (4) svn add --force
svnAdd(checkOutFolderPath);

// (5) ������t�@�C���ꗗ�Ń��[�v�A�������ɂȂ��t�@�C����svn delete
var srcFolder = fso.GetFolder(exportFolderPath);
var destFolder = fso.GetFolder(checkOutFolderPath);
srcFolderPath = srcFolder.Path;
destFolderPath = destFolder.Path;
deleteFiles(destFolder);

if (isCommit) {
	// (6) svn commit
	svnCommit(checkOutFolderPath);
}

// (7) destFolder, srcFolder���폜
WScript.Sleep(3000);
deleteWorkFolders(isCommit);

WScript.Quit();


// functions

function usage(message) {
	WScript.Echo(message + "\n\n usage: cscript //nologo SvnSync.js"
		+ " [/c:] ������URL ������URL [������CheckOut�t�H���_]\n"
		+ "    <options> /c: �c �����R�~�b�g����B");
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
		//�G���[�I��
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
