
const matcher = require("./Matcher");

class UrlMatcher{
    match(url, _matches, _except) {
        let _returnVal = false;
        let _exceptVal = false;
        if(_except){
            _except.forEach(value => {
                if (matcher.isMatch(url, value)) {
                    _exceptVal = true;
                }
            });
        }
        if(_exceptVal){
            return false;
        }
        if(_matches){
            _matches.forEach(value => {
                if (matcher.isMatch(url, value)) {
                    _returnVal = true;
                }
            });
        }
        return _returnVal;
    }
}
module.exports=new UrlMatcher();