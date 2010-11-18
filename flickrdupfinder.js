Function.prototype.args = function (arg) {  
    var func = this;  
    return function () {  
        var newargs = [arg];  
        for (var i = 0; i < arguments.length; i++)  
            newargs.push(arguments[i]);  
        return func.apply(this, newargs);  
    };  
}; 

// ================================================================
//     FDF namespace setup.
//         
// ================================================================

var FDF = {};

// ================================================================
//     FDF.boot
//         handles start up procedure.
// ================================================================

FDF.boot = function() {
    // click handlers
    $("#loginbtn").click(FDF.on_click_login);
    $("#findbtn").click(FDF.on_click_find);
    
    // hide dialogs
    $("#dlg_bg").hide();
    $(".dlg").hide();
    
    // bind all resize events
    $(window).bind("resize", FDF.on_resize);
    $(window).bind("scroll", FDF.on_resize);
    
    // issue status request
    $.getJSON("status.json", {}, success : FDF.on_json_status);
}

// ================================================================
//     FDF.on_click_login
//         user clicked on "login" button.
// ================================================================

FDF.on_click_login = function() {
    // show wait dialog
    FDF.dialog("dlg_login", 300, 100);
    
    // redirect to flickr
    window.location="http://flickr.com/services/auth/?api_key=9ee2032372b12730ea8b12e7d839ed5a&perms=write&api_sig=d3c9fbee2e20ed9da756491e095c58f3";
}

// ================================================================
//     FDF.on_resize
//         handles a resize event, either window size has changed,
//         or user has scrolled the window
// ================================================================

FDF.on_resize = function() {
    
    // center all dialogs
    var screen_x = $(window).width();
    var screen_y = $(window).height();

    var scroll_x = $(window).scrollLeft();
    var scroll_y = $(window).scrollTop();
    
    $("#dlg_bg").css("left", scroll_x);
    $("#dlg_bg").css("top", scroll_y);
    $("#dlg_bg").css("width", screen_x);
    $("#dlg_bg").css("height", screen_y);
    
    $(".dlg").each(function(i,elt) { 
        var elt_x = $(elt).width();
        var elt_y = $(elt).height();
        $(elt).css("left", scroll_x + (screen_x - elt_x) / 2);
        $(elt).css("top", scroll_y + (screen_y - elt_y) / 2);
    });
}

// ================================================================
//     FDF.dialog
//         show a dialog box
// ================================================================

FDF.dialog = function(id, size_x, size_y) {
    $("#dlg_bg").show();
    $("#dlg_bg").css("opacity", 0.5);
    
    $("#" + id).show();
    $("#" + id).css("width", size_x);
    $("#" + id).css("height", size_y);
    
    FDF.on_resize();
}

// ================================================================
//     FDF.dialog_hide
//         hide all visible dialogs
// ================================================================

FDF.dialog_hide = function() {
    $(".dlg").fadeOut(100);
    $("#dlg_bg").fadeOut(100);
}

// ================================================================
//     FDF.on_json_status
//         handle a status response from server
// ================================================================

FDF.on_json_status = function(data) {
    if (data.status == "auth") {
        // user is authenticated, show the next page
        $("#name").html(data.username);
        FDF.show_page("find");
    } else {
        // user is not authenticated, show the login page
        FDF.show_page("login");   
    }
}

// ================================================================
//     FDF.show_page
//         show the given page
// ================================================================

FDF.show_page = function(name) {
    $(".page").each(function(i,e) {
        if ("page_" + name == $(e).attr("id")) {
           $(e).fadeIn(100);    
        } else {
           $(e).fadeOut(100);
        }
    }); 
    $(".step").each(function(i,e) {
        if ("step_" + name == $(e).attr("id")) {
           $(e).css("color", "#000000");    
        } else {
           $(e).css("color", "#808080");
        }
    }); 
}

// ================================================================
//     FDF.on_click_find
//         user has clicked the "find duplicates" button
// ================================================================

FDF.on_click_find = function() {
    
    // show the "processing" dialog
    FDF.dialog("dlg_processing", 300, 200);  
    
    // initialize results
    FDF.map = {};
    FDF.dup = {};
    
    // start fetching data
    FDF.fetch(1);
}

// ================================================================
//     FDF.fetch
//         fetches on page of photo list
// ================================================================

FDF.fetch = function(page) {
    $.getJSON("list.json", {"p":page}, FDF.on_json_list);
}

// ================================================================ 
//     FDF.on_json_list
//         handles a page result from server
// ================================================================ 

FDF.on_json_list = function(data) {
    var page  = data.photos.page;
    var pages = data.photos.pages;
    
    // update UI
    $("#page").html(page);
    $("#pages").html(pages);
    
    var list = data.photos.photo;
    
    // fetch next page
    if (page < pages) {
        FDF.fetch(page + 1);        
    }

    // handles every photo of current page
    var photos = data.photos.photo;    
    for (var i = 0; i < photos.length; i++) {
        FDF.handle(photos[i]);   
    }
    
    // if last page, start analysis
    if (page == pages) {
        FDF.analyze();   
    }
}

// ================================================================ 
//     FDF.analyze
//         analyze the pages results
// ================================================================ 

FDF.analyze = function() {
    FDF.dialog_hide();
    FDF.show_page("remove");
    FDF.elements = [];         // array of duplicate photo element 
    FDF.status = {};           // associative array : id::string => duplicate::boolean
    
     for (k in FDF.map) {
        if (FDF.map[k].length != 1) {
            FDF.dup[k] = FDF.map[k];
        }
    }

    var count = 0;
    for (k in FDF.dup) {
        count++;
        
        var wrapper = $("<div class=\"wrapper\"></div>");
        $("#dup").append(wrapper);
        
        for (var i = 0; i < FDF.dup[k].length; i++) {
            var elt = FDF.map[k][i];

            var id = elt.id;
            var box = $("<div class=\"dupbox\" id=\"p_" + id + "\"> </div>");
            
            $("#dup").append(box);
            
            var src = "http://farm" + elt.farm + ".static.flickr.com/" + elt.server + "/" + elt.id + "_" + elt.secret + "_s.jpg";
            var fsrc = "http://www.flickr.com/photo.gne?id=" + elt.id;
            var image = $("<img src=\"" + src + "\" alt=\"\" class=\"dup_img\"/>");
            var title = $("<span class=\"dup_title\"> <b>title :</b> " + elt.title + "</span>");   
            var ident = $("<span class=\"dup_id\"> <b>identifier :</b> <a href=\"http://flickr.com/photo.gne?id=" + elt.id + "\" target=\"_blank\">"+ elt.id + "</a></span>");   
            var sets = $("<span class=\"dup_sets\"> <b>sets : </b> <img src=\"images/load_2.gif\" alt=\"\" /></span>");   
            var status = $("<div class=\"dup_status\" id=\"status_" + elt.id + "\"><div>Duplicate tag :</div><div class=\"switch_out\"><div class=\"switch_in\"></div></div>");   
            
            $(box).append(image);
            $(box).append(title);
            $(box).append(ident);
            $(box).append(sets);
            $(box).append(status);
            
            $(wrapper).append(box);
            
            FDF.elements.push(elt);
            FDF.status[id] = false;
            
            $(status).find(".switch_out").click(FDF.on_click_status.args(id));
        }
    }
    
    $("#dupcount").html("Found " + count + " duplicates !. Below is the list of duplicate candidates. You can now tag them with the 'duplicate' tag. Then <a href=\"http://www.flickr.com/photos/me/tags/duplicate\">click here</a> to go to Flickr and delete the tagged photos.");
    FDF.element_info(0);
    FDF.fetch_status();
}

// ================================================================ 
//     FDF.element_info
//         fetch photo info for the n-th found element
// ================================================================ 

FDF.element_info = function(num) {
    FDF.element_num = num;
    $.getJSON("info.json", {id:FDF.elements[num].id} ,FDF.on_json_info);
}

// ================================================================ 
//     FDF.on_json_info
//         handles element info
// ================================================================ 

FDF.on_json_info = function(data) {

    var id = data.id;
    
    var sets = data["set"];
    if (sets) {
        var html_sets = "<b>sets :</b> ";
        for (var i = 0; i < sets.length; i++) {
            html_sets = html_sets + "<a href=\"http://www.flickr.com/photos/me/sets/" + sets[i].id + "/\">" + sets[i].title + "</a> ";   
        }
        $("#p_" + id).find(".dup_sets").html(html_sets);
    } else {
        $("#p_" + id).find(".dup_sets").html("sets : none");
    }
    if (FDF.element_num + 1 < FDF.elements.length)
        FDF.element_info(FDF.element_num + 1);
}

// ================================================================ 
//     FDF.set_status
//         update the given photo's duplicate status
// ================================================================ 

FDF.set_status = function(id, status) {
    if (status == "dup") {
        $("#status_" + id).show();
        $("#status_" + id).css("background-position-x", "0px 0px");
    }   
    if (status == "not") {
        $("#status_" + id).show();
        $("#status_" + id).css("background-position-x", "-44px 0px");
    }   
}

// ================================================================ 
//     FDF.handle
//         handle a new photo
// ================================================================ 

FDF.handle = function(element) {
    var title = element["title"];
    var date  = element["datetaken"];
    var key = title + "##" + date;
    if (!FDF.map[key])
        FDF.map[key]= [];
    FDF.map[key].push(element);
}



FDF.fetch_status = function() {
     $.getJSON("duplicate.json", FDF.on_json_duplicate);
}


FDF.on_json_duplicate = function(data) {
    for (var i = 0; i < data.length; i++) {
        FDF.status[data[i]] = true;    
    }
    FDF.update_status();
}

FDF.update_status = function() {
    for(var id in FDF.status) {
        FDF.set_status(id, FDF.status[id]);
    }
}

FDF.set_status = function(id, b) {
    $("#status_" + id).show();
    $("#status_" + id + " .switch_in").animate({"left" : b ? "0px" : "-48px"}, 100);
    
}

FDF.on_click_status = function(id) {
    FDF.status[id] = !FDF.status[id];
    FDF.set_status(id, FDF.status[id]);
    
    var url = FDF.status[id] ? "tag.json?id=" + id : "untag.json?id=" + id;
    
    $.getJSON(url);
}


$(document).ready(FDF.boot);

