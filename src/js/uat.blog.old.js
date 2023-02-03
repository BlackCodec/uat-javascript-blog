// RELEASE: 20230130.1600

let blog_title = 'iCapito.it';
let site_url = 'http://localhost/';
let database_url = 'http://localhost/db';
let template_url = 'http://localhost/db/template';

let min_width = 800;
let default_plugins = { "disqus": false, "google_analytics": false, "coockies": false };

let objects = {
    "article" : {
        "attributes": ["title","description","content","tag","category"],
        "plugins": { "disqus": false, "google_analytics": false, "coockies": false }
    },
    "list" : { 
        "attributes": ["title","description","readmore:false"], 
        "plugins": default_plugins
    },
    "page" : { 
        "attributes": ["title","content"],
        "plugins": default_plugins
    },
    "home" : { 
        "attributes": ["title","content"],
        "plugins": default_plugins
    },
};

function loadxml(url) {
    console.log("Source: " + url);
    $('#page').hide();
    $('#article').hide();
    $('#list').hide();
    $.ajax({
        type: "GET",
        url: url,
        dataType: "xml",
        async: false,
        success: function(xml) {
            $type = $(xml).find("type").text();
            var converter = new showdown.Converter();
            if ($type.startsWith('list:')) {
                $typearray = $type.split(':');
                $realtype = $typearray[0];
                $objtype = $typearray[1];
                $counter = $typearray[2];
                titolo = $(xml).find("object").find("title").text();
                document.title = titolo + ' | ' + blogTitle;
                $body = $('#' + $realtype);
                if ($body.length) {
                    $body.show();
                    $recordobj = $('.' + $objtype + "list");
                    $bodycontent = "";
                    for (i=1;i<=$counter;i++) {
                        var contenuto = $recordobj.html();
                        object_attributes[$realtype].forEach(function(elementraw) {
                            element=elementraw;
                            toconvert=true;
                            $typeelem = elementraw.split(':');
                            if ($typeelem.length > 1) {
                                element = $typeelem[0];
                                toconvert = ($typeelem === 'true');
                            }
                            strContent = $(xml).find($objtype + i).find(element).text().replace(/\\n/g,"\<br\>");
                            strContent = strContent.replace(/\{\{siteurl\}\}/g,siteUrl);
                            if (toconvert)
                                strContent = converter.makeHtml(strContent);
                            contenuto = contenuto.replace("{{" + element + "}}", strContent);
                        });
                        $bodycontent += contenuto;
                    }
                    $body.html($bodycontent);
                }
                disqusVisible = false;
            }
            else {
                titolo = $(xml).find("object").find("title").text();
                disqusVisible = disqusEnabled;
                if ($type == 'home') {
                    document.title = blogTitle;
                    disqusVisible = false;
                }
                else
                    document.title = titolo + ' | ' + blogTitle;
                if ($type == 'page')
                    disqusVisible = false;
                $body = $('#' + $type);
                if ($body.length) {
                    $body.show();
                    var contenuto = $body.html();
                    object_attributes[$type].forEach(function(elementraw) {
                        element=elementraw;
                        toconvert=true;
                        $typeelem = elementraw.split(':');
                        if ($typeelem.length > 1) {
                            element = $typeelem[0];
                            toconvert = ($typeelem === 'true');
                        }
                        strContent = $(xml).find($type).find(element).text().replace(/\\n/g,"<br>");
                        strContent = strContent.replace(/\{\{siteurl\}\}/g,siteUrl);
                        if (toconvert)
                            strContent = converter.makeHtml(strContent);
                        contenuto = contenuto.replace("{{" + element + "}}", strContent);
                    });
                    $body.html(contenuto);
                }
            }
        },
        error: function() {
            console.log("The XML File could not be processed correctly.");
            loadxml(databaseUrl + "/pages/404.xml")
            disqusVisible = false;
        }
    });
};

function adaptiveSite() {
    if (detectMobile()) {
        $('#desktop').hide();
        $('#mobile').show();
    } else {
        $('#desktop').show();
        $('#mobile').hide();
    }
}

function startup() {
    updateCopyRight();
    adaptiveSite();
    if (enableCookie) {
        var cookieaccept = getCookie('cookiepolicy');
        $('#cookielink').show();
        $('#cookielinkmobile').show();
        $('#infocookie').hide();
        if (cookieaccept != "ok") {
            $('#cookies').show();
        }
    }
    $('#backtohome').attr("href",siteUrl + '/');
    $('#backtohomemobile').attr("href",siteUrl + '/');
    var file = window.location.href.replace(siteUrl + '/','') + '.xml';
    if (file == ".xml" || file == "#.xml")
        file = "/pages/home.xml";
    if (!file.startsWith("#")) {
        if (!file.startsWith("/"))
            file = '/' + file;
        loadxml(databaseUrl + file);
    }
    if (disqusEnabled && disqusVisible) {
        var disqus_config = function () {
            this.page.url = window.location.href; 
            this.page.identifier = window.location.href.replace(siteUrl,'').replace(/\//g,'_');
        };
        (function() { // DON'T EDIT BELOW THIS LINE
            var d = document, s = d.createElement('script');
            s.src = 'https://icapito-it.disqus.com/embed.js';
            s.setAttribute('data-timestamp', +new Date());
            (d.head || d.body).appendChild(s);
        })();
    }
    if (googleAnalytics) {
        if (navigator.doNotTrack == 0) {
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
            ga('create', 'UA-135063903-1', 'auto');
            ga('send', 'pageview');
        }
    }

    $(window).on("orientationchange",function(){
        adaptiveSite();
    });
    window.onresize = function(event) {
        adaptiveSite();
    };
};

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function acceptCookie() {
    setCookie('cookiepolicy','ok',360);
    $('#cookies').hide();
}

function updateCopyRight() {
    var copyright = $('#copynow').html();
    copyright = copyright.replace(/\{\{datenow\}\}/g,new Date().getFullYear());
    $('#copynow').html(copyright);
}

function showHideMenu() {
    if ($('#mobilemenu').is(":visible")) {
        $('#mobilemenu').hide();
        document.querySelectorAll(".barra").forEach(function(el) {
            el.style.display='block';
        });
        document.querySelectorAll(".barrax").forEach(function(el) {
            el.style.display='none';
        });
    } else {
        $('#mobilemenu').show();
        document.querySelectorAll(".barra").forEach(function(el) {
            el.style.display='none';
        });
        document.querySelectorAll(".barrax").forEach(function(el) {
            el.style.display='block';
        });
    }
}

function detectMobile() {
    return (/ipad|tablet|mobile/i.test(navigator.userAgent));
}
