// taml.js

if(typeof DEBUG == "undefined") DEBUG=false;

// load jquery
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.7.min.js';
document.documentElement.appendChild(script);

var script2 = document.createElement('script');
script2.type = 'text/javascript';
script2.src = "http://www.fyneworks.com/jquery/xml-to-json/jquery.xml2json.pack.js";
document.documentElement.appendChild(script2);


    // -. detect xml
    // 1. detect (double) attributes
    // 2. detect bad tags
    // 3. detect bad attributes for tag
    // 4. detect bad children for tags (if any, if many, if matches)
    // 5. apply conversion and verbatim transcriptions
    // 6. write dom
    // 7. apply databinding model

var app = {

    tamlString: "",
    tamlXML: {},
    counter: 0,
    dom: {},

    preinit: function()
    {
        if(DEBUG)
            log('<TAML> IN DEBUG MODE...');
        else
            log('DEBUG? ' + DEBUG);

        jq = jQuery.noConflict(true);
        jq(document).ready(app.init);
    },

    init: function()
    {
        app.tamlString = helpers.getTamlStringFromHtml();

        try { app.tamlXML = jq.parseXML(app.tamlString); } catch(e) { throw errors.invalidXML }
        
        app.dom = jq.xml2json(app.tamlXML);

        helpers.clearAllHtml();

        //parser.loopLevelByLevel(app.dom);

        //parser.traverseobjects(app.dom, parser.enrichobject);
        
        //parser.traverseobjects(app.dom, parser.log);

        parser.traverseobjects(app.dom, parser.generateobject);

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
        o._tamlId = ++app.counter;
        o._tamlType = key;
    },

    generateobject: function(key, o)
    {
        // loop through object to generate
        for (var i in o)
        {
            if(typeof(o[i]) != "object")
            {
                // we have an attribute
                log('({0}) : {1} - {2}'.format(key, i, o[i]));
                // append attribute to list
            }
        }

        if(generator[key])
            o._html = generator[key](key, o);
        else
            log("({0}) - {1}".format(key, errors.invalidTaml)); // throw later
        
        log('');
    },
};




var generator = {

    application: function(key, o)
    {
        return "<div id='application'>@TAML@</div>";
    },

    group: function(key, o)
    {
        var html = "<div " + "style='background: "+o.color+"'" + ">@TAML@</div>";

        return html;
    },

    image: function(key, o)
    {
        
    },
};




var helpers = {

    getTamlStringFromHtml: function()
    {
        return jq('taml').parent().detach().html();
    },

    clearAllHtml: function()
    {
        jq('*').remove();
    },
}



var errors = {
    invalidXML:         "<TAML> Invalid XML / TAML... unclosed </tags>? undefined namespace? conflicting namespaces? taml doesn't support <shortTags /> yet.",
    tooManyTamlTags:    "<TAML> More Than One <taml> tag found...",
    noTamlTag:          "<TAML> No <taml> Tag Found! ...",
    invalidTaml:        "<TAML> Invalid TAML tag... Please check your syntax.",
    shortTag:           "<TAML> Short tag closing, ie. '/>' is currently unsupported. Please close...</tag> the tag for now."
};

var taml_lang = {
    tags: [
        'taml',
        'background',
        'hgroup',
        'border',
        'list'
    ]
};


var jq; // jquery
window.onload = app.preinit;


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

function log(str)
{
    console.log(str);
}