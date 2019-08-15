function parse_cookies(arr) {
    var result = {};
    
    for(var i = 0; i < arr.length; ++i) {
        var parts = arr[i].split(',');
        for(var j = 0; j < parts.length; ++j) {
            var p = parts[j];
            if( p && p.length > 0 ) {
                var cookie = p.split(';')[0]
                var kv = cookie.split('=');
                if( kv.length == 2 ) {
                    result[ kv[0].trim() ] = kv[1].trim();
                }
            }
        }
    }

    return result;
}

function find_logged_in_cookie(cookies) {
    for(var k in cookies) {
        if( k.startsWith('wordpress_logged_in_') ) {
            return [k, cookies[k]];
        }
    }
    return null;
}

function collect_cookies(dict, key) {
    var cookies = [];
    for(var k in dict) {
        if( k == key ) {
            var val = dict[k];
            if( val && val.length > 0 ) cookies.push(val);
        }
    }
    return cookies;
}

function get_logged_in(dict, key) {
    var cookies = collect_cookies(dict, key);
    var parsed = parse_cookies(cookies);
    return find_logged_in_cookie(parsed);
}

function getInt(obj, key, def) {
    var val = obj[key];
    return val ? parseInt(val) : def;
}

var WPLogin = function() {
    this.evaluate = function(context) {
        if( context.runtimeInfo.task != 'requestSend' ) {
            return ''
        }
        
        var cur_req = context.getCurrentRequest();
        var logged_in = get_logged_in( cur_req.headers, 'Cookie' );
        if( logged_in ) {
            console.log("Wordpress cookie already set: " + logged_in)
            return '';
        }        
        
        var self = this;

        var form = {
            'log': self.login,
            'pwd': self.password,
            'wp-submit': 'Log In',
            'testcookie': 0,
        };
        
        var body = '';
        for(var k in form) {
            if( body.length > 0 ) body += '&';
            body += encodeURIComponent(k) + '=' + encodeURIComponent(form[k]);
        }
        
        const req = new NetworkHTTPRequest();
        req.requestUrl = self.url;
        req.requestMethod = "POST";
        req.requestTimeout = getInt(self,'timeout', 5) * 1000;
        req.requestBody = body;
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.send();

        logged_in = get_logged_in( req.responseHeaders, 'Set-Cookie' );
        return logged_in ? logged_in[0] + '=' + logged_in[1] : '';
    }
}

WPLogin.identifier = "me.dizzus.WPLogin";
WPLogin.title = "WordPress authorization";
WPLogin.inputs = [
    new InputField(
        'url',
        'Login page',
        'String',
        {
            persisted: true,
            placeholder: 'Login URL, e.g: http://192.168.250.16/wp-login.php',
            defaultValue: 'http://192.168.250.16/wp-login.php'
        }
	),

    new InputField(
        'login',
        'User login',
        'SecureValue',
        {
            persisted: true,
            placeholder: 'User login',
        }
	),

    new InputField(
        'password',
        'User password',
        'SecureValue',
        {
            persisted: true,
            placeholder: 'User password',
        }
	),

    new InputField(
        'timeout',
        'Connection timeout',
        'String',
        {
            persisted: true,
            placeholder: 'Timeout in seconds',
            defaultValue: '5'
        }
	),
	
];

registerDynamicValueClass(WPLogin);
