<?php
//
// Apache error.log Viewer
//
// 2005.03.21 Jomora created
// 2005.08.05 Jomora if (count($logs) > $maxLineSize) 条件追加

@header("Content-Type: text/plain;");

// ログファイルの指定
$logFile = "C:/Apache/logs/error.log";

// 表示を省略するログ
$omittedLogs = array(
  "client denied by server configuration:" => 0,
  "File does not exist:" => 0,
  "not found or unable to stat" => 0
);

// 最大行数
$maxLineSize = 50;
// 1行の最大文字数
$maxLength = 4096;

$logs = array();

// 表示するログファイルの指定
$handle = fopen ($logFile, "rt");
while (!feof ($handle)) {
    $buffer = fgets($handle, $maxLength);
    $canView = true;

	if ("" == $buffer) continue;

	foreach($omittedLogs as  $key => $value) {
	    if ($canView) {
	        $index = strpos($buffer, $key);
	        if ($index) {
	            $omittedLogs[$key]++;
	            $canView = false;
	        }
	    }
	}

    if ($canView) {
        $logs[] = $buffer;
    }
}
fclose ($handle);

// 表示を省略したログのカウント
foreach($omittedLogs as  $key => $value) {
	print($key . ' ' . $value . "\n");
}
print("\n");
// 最新のログから最大表示行数分だけ表示する
if (count($logs) > $maxLineSize) {
	$logs = array_slice($logs, count($logs) - $maxLineSize);
}
// 新しいものから順に表示する。
$logs = array_reverse($logs);
foreach ($logs as $log) {
    print htmlspecialchars($log);
}
?>
