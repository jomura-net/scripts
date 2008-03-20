<?php
//
// Apache error.log Viewer
//
// 2005.03.21 Jomora created
// 2005.08.05 Jomora if (count($logs) > $maxLineSize) �����ǉ�

@header("Content-Type: text/plain;");

// ���O�t�@�C���̎w��
$logFile = "C:/Apache/logs/error.log";

// �\�����ȗ����郍�O
$omittedLogs = array(
  "client denied by server configuration:" => 0,
  "File does not exist:" => 0,
  "not found or unable to stat" => 0
);

// �ő�s��
$maxLineSize = 50;
// 1�s�̍ő啶����
$maxLength = 4096;

$logs = array();

// �\�����郍�O�t�@�C���̎w��
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

// �\�����ȗ��������O�̃J�E���g
foreach($omittedLogs as  $key => $value) {
	print($key . ' ' . $value . "\n");
}
print("\n");
// �ŐV�̃��O����ő�\���s���������\������
if (count($logs) > $maxLineSize) {
	$logs = array_slice($logs, count($logs) - $maxLineSize);
}
// �V�������̂��珇�ɕ\������B
$logs = array_reverse($logs);
foreach ($logs as $log) {
    print htmlspecialchars($log);
}
?>
