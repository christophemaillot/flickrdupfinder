<?php
    require "flickr.inc.php";
    require "apikey.inc.php";
    
    $flickr = new Flickr($flickr_apikey, $flickr_secret);
    
    $auth_url = $flickr->getAuthURL();

    $status = "";

    $frob = $_GET["frob"];
    if ($frob == "") {
        $status  = "fatal";
        $message = "";
        $token   = "";
    } else {
        $ret = $flickr->send("flickr.auth.getToken", array("frob"=>"$frob"));
        if ($ret["stat"] == "ok") {
            $status = "ok";
            $message = "";
            $token = $ret["auth"]["token"]["_content"];
        } else {
            $status  = "failed";
            $message = $ret["message"];
            $token   = "";
        }
    }

    session_start();
    $_SESSION['flickr_status'] = $status;
    $_SESSION['flickr_token']  = $token;
    $_SESSION['flickr_message']  = $message;
    
    header("Location: http://www.christophemaillot.fr/flickrdupfinder/");

?>