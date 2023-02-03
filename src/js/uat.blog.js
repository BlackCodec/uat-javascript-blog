// RELEASE: 20230202.1800

const blog_title = {
    default: 'iCapito.it',
    any: "iCapito.it - ${title}"
};

const site_url = {
    base: 'http://localhost',
    metadata: 'http://localhost/db/metadatas',
    template: 'http://localhost/db/templates',
    content: 'http://localhost/db/contents'
};

// if the browser is less this resolution switch to mobile page (if provided)
const min_width = 800;

// DO NOT EDIT
const CONSTANTS = {
    template: {
        name: "default",
        file: {
            body: "page.template",
            headers: "header.template",
            mobile: "mobile.template",
        }
    },
    request_method: "GET",
    types: {
        metadata: "json",
        content: "text",
        default: "text"
    },
    regex_attributes: /(?<!\\)\$\{([a-zA-Z0-9:.\/\-_]+)\}/gm,
    regex_replace: "(?<!\\\\)\\$\\{${text}\\}",
    default_object_id: "page",
    default_route: {
        home: "home",
        error: "error",
    },
    metadata_extension: "json",
    object_attributes: {
        title: "title",
        template: "template",
        content_type: "type",
        content: "content"
    },
    alog_format:"<${date}> [${level}] uat_blog_engine.${method}(): ${message}",
    log_format:"[${level}] ${method}: ${message}",
};

let GLOBAL_METADATA = {
    site_name: blog_title.default,
    template_url: site_url.template + "/" + CONSTANTS.template.name,
    date: "" + new Date(),
    year: ""+ (new Date()).getFullYear(),
    site_url: site_url.base,
    is_mobile:false,
    release: "20230202.1800"
};

// LOGGING
let methods = ["__init__"];

function entering(method_name) { methods.unshift(method_name); log("trace",`Entering in ${method_name}`); }
function exiting(method_name) { 
    if (methods[0] !== method_name) {
        for (let [i,value] in methods.entries()) {
            if ( value === method_name) {
                methods.splice(i,1);
                break;
            }
        }
    } else {
        methods.shift();
    }
    log("trace",`Exiting from ${method_name}`);
}
function info(message) { log("info", message); }
function warn(message) { log("warning", message); }
function error(message) { log("error", message); }
function debug(message) { log("debug", message); }
function log(level, message) {
    let log_message = CONSTANTS.log_format.replace("${date}",new Date())
        .replace("${level}", level.toUpperCase())
        .replace("${method}",methods[0]).replace("${message}", message);
    console.log(log_message);
}

function get_request_file() {
    entering("get_request_file");
    try {
        let remove_url = site_url.base;
        if (!remove_url.endsWith('/')) remove_url = remove_url + "/";
        let respone = window.location.href.replace(remove_url, '');
        debug(`Request file url ${respone}`);
        return respone;
    } finally {
        exiting("get_request_file");
    }
}

function get_remote_file(remote_url, result_type = CONSTANTS.types.default, request_method = CONSTANTS.request_method) {
    entering("get_remote_file");
    try {
        debug(`method: ${request_method}, url: ${remote_url}, type: ${result_type}`);
        let response;
        $.ajax({
            type: request_method,
            url: remote_url,
            dataType: result_type,
            async: false,
            success: function (udf_content) {
                response = udf_content;
                debug(`Response: ${JSON.stringify(response)}`);
            },
            error: function (exception) {
                error(`Error: ${JSON.stringify(exception)}`);
                response = undefined;
            }
        });
        return response;
    } finally {
        exiting("get_remote_file");
    }
}

function convert_raw_content(text, type = CONSTANTS.types.default) {
    entering("convert_raw_content");
    try {
        info(`Convert from ${type}:\n${text}`);
        let return_text = text;
        if (type === "markdown") {
            let converter = new showdown.Converter();
            return_text = converter.makeHtml(return_text);
        }
        return_text = return_text.replaceAll("\\n\\n","<br>").replaceAll("\\n","<br>");
        debug(`Return text:\n${return_text}`);
        return return_text;
    } finally { 
        exiting("convert_raw_content");
    }
}

function parse_text(text, metadata = {}) {
    entering("parse_text");
    try {
        info(`Text to parse:\n${text}`);
        let response = text;
        // check if metadata is defined so need to convert content
        let match_list = [];
        if (metadata) {
            info(`Metadata:${JSON.stringify(metadata)}`);
            debug(`Type from source ${metadata[CONSTANTS.object_attributes.content_type]}`);
            match_list = response.match(CONSTANTS.regex_attributes);
            // now we have a list of matches
            for (let match_index in match_list) {
                let search_text = match_list[match_index];
                let key = search_text.substring(2).slice(0,-1);
                debug(`Search for ${search_text} and check metadata for key ${key}` );
                let replace_text = "";
                if (key) {
                    // check if key equals ${file:*}
                    if (key.startsWith("file:")) {
                        // load remote content
                        info(`Load remote file in raw mode: ${key}`);
                        let content_url = key.replace("file:", "");
                        let remote_content = get_remote_file(site_url.content + "/" + content_url);
                        if (remote_content) {
                            replace_text = parse_text(remote_content,metadata);
                        }
                        // TODO: error so what we can show?!
                    } else if (key.startsWith("include:")) {
                        // load the metadata
                        info(`Load remote metadata: ${key}`);
                        let content_url = key.replace("include:", "");
                        let remote_metadata = get_remote_file(site_url.metadata + "/" + content_url + "." + CONSTANTS.metadata_extension, CONSTANTS.types.metadata);
                        if (remote_metadata) {
                            if (typeof remote_metadata === 'string' || remote_metadata instanceof String) {
                                remote_metadata = JSON.parse(remote_metadata);
                            }
                            debug(`remote metadata content: ${JSON.stringify(remote_metadata)}`);
                            if (remote_metadata) {
                                if (remote_metadata[CONSTANTS.object_attributes.content]) {
                                    // load and parse the content
                                    let remote_content = parse_text(remote_metadata[CONSTANTS.object_attributes.content], remote_metadata);
                                    if (remote_content) {
                                        replace_text = convert_raw_content(remote_content,remote_metadata[CONSTANTS.object_attributes.content_type]);
                                    }
                                } // TODO: no metadata?!
                            } // TODO: metadata json invalid
                        } // TODO: no metadata?!
                    } else if (key.startsWith("if:")) {
                        // if:variable_to_search:value_if_true:value_if_false
                        let key_split = key.split(":");
                        let search = key_split[1];
                        // default to false
                        replace_text = key_split[3]; 
                        if (metadata[search] || GLOBAL_METADATA[search]) replace_text = key_split[2];
                    } else if (metadata[key]) {
                        replace_text = metadata[key];
                    } else if (GLOBAL_METADATA[key]) {
                        debug("Load from global metadata ...");
                        replace_text = GLOBAL_METADATA[key];
                    }
                    debug(`Type before convert raw content: ${metadata[CONSTANTS.object_attributes.content_type]}`);
                    info(`Replace:\n${search_text} -> ${replace_text}`);
                    let replace_regex = new RegExp(CONSTANTS.regex_replace.replace("${text}",key));
                    response = response.replace(replace_regex, replace_text);
                } // TODO: invalid key
            }
            // we need to check the type if type is markdown we need to convert
            response = convert_raw_content(response, metadata[CONSTANTS.object_attributes.content_type]);
        }   
        debug(`response:\n${response}`);
        return response;
    } finally {
        exiting("parse_text");
    }
}

function detectMobile() {
    if (/ipad|tablet|mobile/i.test(navigator.userAgent)) {
        GLOBAL_METADATA.is_mobile = true;
        return CONSTANTS.template.file.mobile;
    }
    GLOBAL_METADATA.is_mobile = false;
    return CONSTANTS.template.file.body;
}

function page_load(remote_file_url) {
    entering("page_load");
    let page = {
        title: blog_title.default,
        headers: "",
        content: "",
        object_id: CONSTANTS.default_object_id,
        body: "${content}"
    };
    info("Load requested content ...")
    // Load metadata 
    let metadata = get_remote_file(remote_file_url, CONSTANTS.types.metadata);
    try {
        if (metadata) {
            if (typeof metadata === 'string' || metadata instanceof String) metadata = JSON.parse(metadata);
            if (!metadata) {
                error("No valid metadata found ...");
                throw Error("Invalid metadata");
            } else {
                // the metadata contains content attribute
                if (metadata[CONSTANTS.object_attributes.content]) {
                    // we need to load the template
                    info("Load template body ...");
                    let template_body = get_remote_file(GLOBAL_METADATA.template_url + "/" + detectMobile());
                    if (template_body) page.body = template_body;
                    info("Load template headers ...");
                    let template_headers = get_remote_file(GLOBAL_METADATA.template_url + "/" + CONSTANTS.template.file.headers);
                    if (template_headers) {
                        debug(`Template headers:\n ${template_headers}`);
                        page.headers = parse_text(template_headers);
                    }
                    let content = metadata[CONSTANTS.object_attributes.content];
                    info(`Parse content:\n${content}`);
                    // Content is defined, load it
                    content = parse_text(content, metadata);
                    page.content = content;
                } else {
                    // TODO: no content?!
                    error("Invalid content");
                    throw Error("Invalid content");
                }
                if (metadata[CONSTANTS.object_attributes.title]) {
                    info("Parse title ... ");
                    let title = blog_title.any;
                    metadata[CONSTANTS.object_attributes.content_type] = CONSTANTS.types.default
                    title = parse_text(title, metadata);
                    page.title = title;
                } else {
                    // TODO: no title?!
                    warn("Invalid title");
                }
                if (metadata[CONSTANTS.object_attributes.template]) page.object_id = metadata[CONSTANTS.object_attributes.template];
            }
            info(`Processing page metadata:\n${JSON.stringify(page)}`);
            // update document title
            document.title = page.title;
            if (page.headers) {
                debug(`Add headers: \n${page.headers}`);
                let add_head = document.createRange();
                let head_content = add_head.createContextualFragment(page.headers);
                document.querySelector("head").append(head_content);
            }
            // process document body
            let body_content = document.body.innerHTML;
            debug("Process body ...");
            body_content = parse_text(parse_text(body_content, page),page);
            // update document body
            document.body.innerHTML = body_content;
        } else {
            error(`Invalid metadata. Redirect to error page: ${error_url}`);
            throw Error("Invalid metadata");
        }
    } finally {
        exiting("page_load");
    }
    
};

function engine_start() {
    entering("engine_start");
    let request_file = get_request_file();
    let request_file_url = request_file;
    let error_url = site_url.base + "/" + CONSTANTS.default_route.error;

    let page = {
        title: blog_title.default,
        headers: "",
        content: "",
        object_id: CONSTANTS.default_object_id,
        body: "${content}"
    };

    // check if request url is the home
    if (!request_file_url) { request_file_url = CONSTANTS.default_route.home; }
    // Convert the url to get metadata
    if (!request_file_url.startsWith(site_url.metadata)) { request_file_url = site_url.metadata + "/" + request_file_url; }
    if (!request_file_url.endsWith(CONSTANTS.metadata_extension)) { request_file_url = request_file_url + "." + CONSTANTS.metadata_extension; }

    try {
        page_load(request_file_url);
    } catch {
        try {
            page_load(error_url);
        } catch {
            window.location.href = error_url;
        }
    } finally {
        exiting("engine_start");
    }
    $(window).on("orientationchange",function(){
        location.reload();
    });
    window.onresize = function(event) {
        location.reload();
    };
};