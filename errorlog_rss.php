<?php
//
// Apache error.log RSS
//
// 2005.03.21 Jomora created
// 2005.08.05 Jomora if (count($logs) > $maxLineSize) 条件追加
// 2008.03.15 jomura Add <link> tag
header('Content-type: text/xml; charset=UTF-8');

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
        $logs[] = mb_convert_encoding($buffer, "UTF-8", "SJIS-win");
    }
}
fclose ($handle);
?>
<?xml version="1.0"?>
<rss version="2.0">
   <channel>
      <title>Apache error.log</title>
      <link>http://jomora.net/wiki/?Apache%2Ferror.log%E3%82%92%E3%83%AA%E3%83%A2%E3%83%BC%E3%83%88%E3%81%8B%E3%82%89%E9%96%B2%E8%A6%A7</link>
      <description>
<?php 
// 表示を省略したログのカウント
foreach($omittedLogs as  $key => $value) {
	print($key . ' ' . $value . "<br />\n");
}
?>
</description>
<?php
// 最新のログから最大表示行数分だけ表示する
if (count($logs) > $maxLineSize) {
	$logs = array_slice($logs, count($logs) - $maxLineSize);
}
// RSSでは、新しいものから表示
$logs = array_reverse($logs);
foreach ($logs as $log) {
	$title = NULL;
	$pubDate = NULL;
	if ("[" == substr($log,0,1)) {
		$title = htmlspecialchars(substr($log,27));
		$pubDate = date(DATE_RSS, strtotime(substr($log,1,24)));
	} else {
		$title = htmlspecialchars($log);
	}
	$query = urlencode(trim(ereg_replace("\[[^\[\]]+\]", "", $title)));
	$linkUrl = "http://www.google.co.jp/search?q=" . $query;
?>
      <item>
         <title><?php echo $title; ?></title>
         <link><?php echo $linkUrl; ?></link>
         <pubDate><?php echo $pubDate; ?></pubDate>
      </item>
<?php
}
?>
   </channel>
</rss>
