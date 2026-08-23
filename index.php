<?php
// Beget compatibility entry point. Some existing hosting setups may prefer index.php
// over index.html; always serve the generated current storefront instead of a stale legacy file.
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, must-revalidate');
readfile(__DIR__ . '/index.html');
