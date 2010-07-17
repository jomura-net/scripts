<?php
//
// Apache error.log Viewer
//
// @author Jomora ( kazuhiko@jomura.net http://jomura.net/ )
// @version 2008.03.15 Jomura Add <link> tag
//          2005.08.05 Jomora if (count($logs) > $maxLineSize) 条件追加
//          2005.03.21 Jomora created


// ログファイルの指定
$logFile = "C:/Server/Apache/logs/error.log";

// 表示を省略するログ
$omittedLogs = array(
  "(20024)The given path is misformatted or contained invalid characters: Cannot map GET /" => 0,
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

// 最新のログから最大表示行数分だけ表示する
if (count($logs) > $maxLineSize) {
	$logs = array_slice($logs, count($logs) - $maxLineSize);
}
// 新しいものから表示
$logs = array_reverse($logs);


// 以下、応答部

if (isset($_GET["format"]) && "rss" === $_GET["format"]) {
	// RSS
	header('Content-type: text/xml; charset=UTF-8');
?>
<?xml version="1.0"?>
<rss version="2.0">
   <channel>
      <title>Apache error.log</title>
      <link>http://jomura.net/wiki/?Apache%2Ferror.log%E3%82%92%E3%83%AA%E3%83%A2%E3%83%BC%E3%83%88%E3%81%8B%E3%82%89%E9%96%B2%E8%A6%A7</link>
      <description>
<?php 
	// 表示を省略したログのカウント
	foreach($omittedLogs as  $key => $value) {
		print(sprintf('% 5d', $value) . ' ' . $key . "<br />\n");
	}
?>
      </description>
<?php
	foreach ($logs as $log) {
		$title = NULL;
		$pubDate = NULL;
		$guid = NULL;
		$canDate = "[" == substr($log,0,1);
		if ($canDate) {
			$title = htmlspecialchars(substr($log,27));
			$pubDate = date(DATE_RSS, strtotime(substr($log,1,24)));
			$guid = date(DATE_ATOM, strtotime(substr($log,1,24)));
		} else {
			$title = htmlspecialchars($log);
		}
		//$query = urlencode(trim(ereg_replace("\[[^\[\]]+\]", "", $title)));
		//$linkUrl = "http://www.google.co.jp/search?q=" . $query;
		$linkUrl = "http://jomura.net/errorlog.php";
?>
      <item>
         <title><?php echo $title; ?></title>
         <link><?php echo $linkUrl; ?></link>
<?php
	if ($canDate) {
?>
         <pubDate><?php echo $pubDate; ?></pubDate>
         <guid isPermaLink="false"><?php echo $guid; ?></guid>
<?php
	}
?>
      </item>
<?php
}
?>
   </channel>
</rss>
<?php
} else {
	// TEXT
	@header("Content-Type: text/plain; charset=UTF-8");

	// 表示を省略したログのカウント
	foreach($omittedLogs as  $key => $value) {
		print(sprintf('% 5d', $value) . ' ' . $key . "\n");
	}
	print("\n");

	foreach ($logs as $log) {
	    print htmlspecialchars($log);
	}
}
?>
