// taml.js

if(typeof DEBUG == "undefined") DEBUG=false;

// load jquery
var jqscript = document.createElement('script');
jqscript.type = 'text/javascript';
jqscript.src = 'http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.7.min.js';
document.getElementsByTagName('head')[0].appendChild(jqscript);


var app = {

    tamlString: "",
    tamlXML: {},
    counter: 0,
    dom: {},

    windowonload: function()
    {
        try
        {
            jq = jQuery.noConflict(true);
            jq(document).ready(app.init);
        }
        catch(e)
        {   
            // "jQuery" is undefined. Happens in IE.
            // IE9 runs window.onload too early, before the code above could load jquery
            // wait at 30FPS and try again...
            setTimeout(app.windowonload, 33); 
        }
    },

    init: function()
    {
        app.tamlString = helpers.getTamlStringFromHtml();

        try { app.tamlXML = jq.parseXML(app.tamlString); } catch(e) { throw errors.invalidXML }
        
        app.dom = helpers.xml2Object(app.tamlXML);

        helpers.clearAllHtml();

        parser.traverseobjects(app.dom, parser.enrichobject);
        parser.traverseobjects(app.dom, parser.generateobject);
        parser.traverseobjects(app.dom, parser.generateHTML);
        
        helpers.setHtml(html);
        //parser.traverseobjects(app.dom, parser.log);
        /*parser.traverseobjects(app.dom, function(key, o) {
            
            if(o._tamlId == 11)
            {
                log(o);
            }

        });*/
    },
}

var parser = {

    traverse: function(o, func)
    {
        var later = [];

        for (var i in o) 
        {
            if (typeof(o[i]) == "object") 
            {
                later.push(o[i]);
            }

            func.apply(this, [i, o[i]]);
        }

        for(var i in later)
        {
            parser.traverse(later[i], func);
        }
    },

    traverseobjects: function(o, func)
    {
        var later = [];

        for (var i in o) 
        {
            if (typeof(o[i]) == "object") 
            {
                func.apply(this, [i, o[i]]);
                later.push(o[i]);
            }
        }

        for(var i in later)
        {
            parser.traverseobjects(later[i], func);
        }
    },

    log: function(key, o) 
    {
        log(o);
        log(key + " : "+o);
    },

    enrichobject: function(key, o)
    {
        if(helpers.keyIsSystemObject(key))
            return;

        o._tamlId = ++app.counter;
        o._tamlType = key;
        
    },

    // loop through taml objects to generate html
    generateobject: function(key, o)
    {
        if(helpers.keyIsSystemObject(key))
            return;

        // if object exists in the generator, run its conversion method
        // ":" is now "_"
        if(tagGenerators[key.removeNs()])
            o._html = tagGenerators[key.removeNs()](key, o);
        else log("<{0}> : {1}".format(key, "unknown tag - deal with it later")); // throw later
    },

    // grabs the html out of all the objects
    generateHTML: function(key, o)
    {
        if(o._html)
            html = html.split('@^@').join('\n\t'+o._html+'\n');
    },
};

var html = '@^@';

var tagGenerators = {

    taml: function(key, o)
    {
        return "<style>html, body, div, ul {width: 100%; height: 100%; margin: 0; padding: 0;}</style>@^@";
    },

    t_application: function(key, o)
    {
        return "<div id='application{0}' style='background: red; opacity: 0.2'>@^@</div>".format(o._tamlId);
    },

    // all t:group run this generator
    t_group: function(key, o)
    {
        // cycle all attributes
        for(var a in o.attr)
        {
            
        }

        //var html = "<div " + "style='background: "+o.attrs.background+"'" + ">@TAML@</div>";
        //return html;

        return "<div id='group{0}' style='background: green; opacity: 0.2'>@^@</div>".format(o._tamlId);
    },

    t_layout: function(key, o)
    {
        return;
    },

    t_image: function(key, o)
    {
        return "<img id='image{0}' />@^@".format(o._tamlId);
    },

    t_list: function(key, o)
    {
        return "<div id='list{0}'><ul>@^@</ul></div>".format(o._tamlId);
    },
    
    t_renderer: function(key, o)
    {
        return "<li id='itemrenderer{0}'>@^@</li>".format(o._tamlId);
    },

    t_object: function(key, o)
    {
        return;
    },
};




var helpers = {

    getTamlStringFromHtml: function()
    {
        return jq('taml').parent().html();
    },

    keyIsSystemObject: function(key)
    {
        return (key == 'objs' || key == 'attrs');
    },

    clearAllHtml: function()
    {
        //jq('*').remove();
    },

    setHtml: function(html)
    {
        jq(document.body).empty().append(html);
    },

    xml2Object: function(xml)
    {
        var obj = {};

        if (xml.nodeType == 1) 
        { // element

            if (xml.attributes.length > 0) 
            {
                obj["attrs"] = {};
                
                for (var j = 0; j < xml.attributes.length; j++) 
                {
                    var attribute = xml.attributes.item(j);
                    obj["attrs"][attribute.nodeName] = attribute.nodeValue;
                }
            }
        } 
        else if (xml.nodeType == 3) 
        { // text
            obj = xml.nodeValue;
        }

        // do children
        if (xml.hasChildNodes()) 
        {
            obj["objs"] = {};

            for(var i = 0; i < xml.childNodes.length; i++) 
            {
                var item = xml.childNodes.item(i);
                var nodeName = item.nodeName;
                
                if(nodeName == '#text')
                {
                    delete obj[nodeName];
                    continue;
                }

                if (typeof(obj[nodeName]) == "undefined") 
                {
                    obj["objs"][nodeName] = helpers.xml2Object(item);
                } 
                else 
                {
                    if (typeof(obj[nodeName].length) == "undefined") 
                    {
                        var old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }

                    if(nodeName != '#text')
                    {
                        obj[nodeName].push(helpers.xml2Object(item));
                    }
                }
            }
        }

        return obj;
    },
}



var errors = {
    invalidXML:         "<TAML> Invalid XML / TAML... unclosed </tags>? undefined namespace? conflicting namespaces? taml doesn't support <shortTags /> yet.",
    tooManyTamlTags:    "<TAML> More Than One <taml> tag found...",
    noTamlTag:          "<TAML> No <taml> Tag Found! ...",
    invalidTaml:        "<TAML> Invalid TAML tag... Please check your syntax.",
    shortTag:           "<TAML> Short tag closing, ie. '/>' is currently unsupported. Please close...</tag> the tag for now."
};


var jq; // jquery
window.onload = app.windowonload;


String.prototype.contains = function(that)
{
    this.split('').join('').indexOf(that.toString()) != -1
};

String.prototype.format = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

String.prototype.removeNs = function() {
    
    return this.split(':').join('_');
}

function log(str)
{
    console.log(str);
}

String.prototype.ltrim=function()
    {return this.replace(/^\s+/,'');}

String.prototype.rtrim=function()
    {return this.replace(/\s+$/,'');}
