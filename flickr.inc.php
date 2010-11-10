<?php

class Flickr {

    var $api_key;
    var $secret;

    function Flickr ($api_key, $secret) {
        $this->api_key = $api_key;
		$this->secret = $secret;
    }
    
    function getAuthURL() {
        $args = array();
        $args["perms"]  = "read";
        $url = "http://flickr.com/services/auth/?" . $this->getSignedParams($args);
        return $url;
    }
    
    function send($command, $args) {
        $args = array_merge(array("method" => $command, "format" => "php_serial", "api_key" => $this->api_key), $args);
        $url = "http://api.flickr.com/services/rest/?" . $this->getSignedParams($args);
        $rsp = file_get_contents($url);
        $obj = unserialize($rsp);
        return $obj;
    }
    
    function getSignedParams($args) {
        $args["api_key"] = $this->api_key;
        ksort($args);
        $auth_sig = "";
        foreach ($args as $key => $value) {
            $auth_sig .= $key . $value;
        }
        $api_sig = md5($this->secret . $auth_sig);
        $args["api_sig"] = $api_sig;
        $sep = "";
        $url = "";
        foreach ($args as $key => $value) {
            $auth_sig .= $key . $value;
            $url = $url . $sep . $key . "=" . $value;
            $sep = "&";
        }
        return $url;
    }
}

?>