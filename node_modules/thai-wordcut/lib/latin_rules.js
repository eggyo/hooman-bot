var WordRule = {
    createAcceptor: function(tag) {
        if (tag["WORD_RULE"])
            return null;
        return {
            strOffset: 0,
            isFinal: false,
            transit: function(ch) {
                var lch = ch.toLowerCase();
                if (lch >= "a" && lch <= "z" || lch === '\'') {
                    this.isFinal = true;
                    this.strOffset++;
                } else {
                    this.isError = true;
                }
                return this;
            },
            isError: false,
            tag: "WORD_RULE",
            type: "WORD_RULE",
            w: 1
        };
    }
};

var NumberRule = {
    createAcceptor: function(tag) {
        if (tag["NUMBER_RULE"])
            return null;
        return {
            strOffset: 0,
            isFinal: false,
            transit: function(ch) {
                if (ch >= "0" && ch <= "9") {
                    this.isFinal = true;
                    this.strOffset++;
                } else {
                    this.isError = true;
                }
                return this;
            },
            isError: false,
            tag: "NUMBER_RULE",
            type: "NUMBER_RULE",
            w: 1
        };
    }
};

var HashtagRule = {
    createAcceptor: function(tag) {
        if (tag["HashtagRule"])
            return null;
        return {
            strOffset: 0,
            isFinal: false,
            transit: function(ch) {
                if (ch >= "0" && ch <= "9") {
                    this.isFinal = true;
                    this.strOffset++;
                } else {
                    this.isError = true;
                }
                return this;
            },
            isError: false,
            tag: "HashtagRule",
            type: "HashtagRule",
            w: 1
        };
    }
};

var SpaceRule = {
    tag: "SPACE_RULE",
    createAcceptor: function(tag) {
        if (tag["SPACE_RULE"])
            return null;
        return {
            strOffset: 0,
            isFinal: false,
            transit: function(ch) {
                if (ch == " " || ch == "\t" || ch == "\r" || ch == "\n" ||
                    ch == "\u00A0" || ch == "\u2003" //nbsp and emsp
                ) {
                    this.isFinal = true;
                    this.strOffset++;
                } else {
                    this.isError = true;
                }
                return this;
            },
            isError: false,
            tag: SpaceRule.tag,
            w: 1,
            type: "SPACE_RULE"
        };
    }
}

var SingleSymbolRule = {
    tag: "SINSYM",
    createAcceptor: function(tag) {
        return {
            strOffset: 0,
            isFinal: false,
            transit: function(ch) {
                if (this.strOffset == 0 && ch.match(/^[\$\%\@\(\)\/\,\-\."`]$/)) {
                    this.isFinal = true;
                    this.strOffset++;
                } else {
                    this.isError = true;
                }
                return this;
            },
            isError: false,
            tag: "SINSYM",
            w: 1,
            type: "SINSYM"
        };
    }
}

var HashtagRule = {
    tag: "HashtagRule",
    createAcceptor: function(tag) {
        return {
            strOffset: 0,
            isFinal: false,
            transit: function(ch) {
                if (this.strOffset === 0 && ch === '#') {
                    this.isFinal = true;
                    this.strOffset++;
                } else if (this.strOffset !== 0 && !(ch == " " || ch == "\t" || ch == "\r" || ch == "\n" ||
                    ch == "\u00A0" || ch == "\u2003")) {
                    this.isFinal = true;
                    this.strOffset++;
                } else {
                    this.isError = true;
                }
                return this;
            },
            isError: false,
            tag: "HashtagRule",
            w: 1,
            type: "HashtagRule"
        };
    }
}

var HttpRule = {
    tag: "HttpRule",
    createAcceptor: function(tag) {
        return {
            strOffset: 0,
            isFinal: false,
            transit: function(ch) {
                if (this.strOffset === 0 && ch === 'h') {
                    this.isFinal = false;
                    this.strOffset++;
                } else if ((this.strOffset === 1 || this.strOffset === 2) && ch === 't') {
                    this.isFinal = false;
                    this.strOffset++;
                } else if (this.strOffset === 3 && ch === 'p') {
                    this.isFinal = false;
                    this.strOffset++;
                } else if (this.strOffset === 4 && ch === ':') {
                    this.isFinal = false;
                    this.strOffset++;
                } else if ((this.strOffset === 5 || this.strOffset === 6) && ch === '/') {
                    this.isFinal = false;
                    this.strOffset++;
                } else if (this.strOffset > 6 && !(ch == " " || ch == "\t" || ch == "\r" || ch == "\n" ||
                    ch == "\u00A0" || ch == "\u2003")) {
                    this.isFinal = true;
                    this.strOffset++;
                } else {
                    this.isError = true;
                }
                return this;
            },
            isError: false,
            tag: "HttpRule",
            w: 1,
            type: "HttpRule"
        };
    }
}

var LatinRules = [WordRule, SpaceRule, SingleSymbolRule, NumberRule, HashtagRule, HttpRule];

module.exports = LatinRules;
