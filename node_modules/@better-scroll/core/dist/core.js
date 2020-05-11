/*!
 * better-scroll / core
 * (c) 2016-2020 ustbhuangyi
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.BScroll = {}));
}(this, function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function warn(msg) {
        console.error("[BScroll warn]: " + msg);
    }

    // ssr support
    var inBrowser = typeof window !== 'undefined';
    var ua = inBrowser && navigator.userAgent.toLowerCase();
    var isWeChatDevTools = ua && /wechatdevtools/.test(ua);
    var isAndroid = ua && ua.indexOf('android') > 0;

    function getNow() {
        return window.performance && window.performance.now && window.performance.timing
            ? window.performance.now() + window.performance.timing.navigationStart
            : +new Date();
    }
    function extend(target) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        for (var i = 0; i < rest.length; i++) {
            var source = rest[i];
            for (var key in source) {
                target[key] = source[key];
            }
        }
        return target;
    }
    function isUndef(v) {
        return v === undefined || v === null;
    }

    var elementStyle = (inBrowser &&
        document.createElement('div').style);
    var vendor = (function () {
        if (!inBrowser) {
            return false;
        }
        var transformNames = {
            webkit: 'webkitTransform',
            Moz: 'MozTransform',
            O: 'OTransform',
            ms: 'msTransform',
            standard: 'transform'
        };
        for (var key in transformNames) {
            if (elementStyle[transformNames[key]] !== undefined) {
                return key;
            }
        }
        return false;
    })();
    function prefixStyle(style) {
        if (vendor === false) {
            return style;
        }
        if (vendor === 'standard') {
            if (style === 'transitionEnd') {
                return 'transitionend';
            }
            return style;
        }
        return vendor + style.charAt(0).toUpperCase() + style.substr(1);
    }
    function getElement(el) {
        return (typeof el === 'string'
            ? document.querySelector(el)
            : el);
    }
    function addEvent(el, type, fn, capture) {
        el.addEventListener(type, fn, {
            passive: false,
            capture: !!capture
        });
    }
    function removeEvent(el, type, fn, capture) {
        el.removeEventListener(type, fn, {
            capture: !!capture
        });
    }
    function offset(el) {
        var left = 0;
        var top = 0;
        while (el) {
            left -= el.offsetLeft;
            top -= el.offsetTop;
            el = el.offsetParent;
        }
        return {
            left: left,
            top: top
        };
    }
    var cssVendor = vendor && vendor !== 'standard' ? '-' + vendor.toLowerCase() + '-' : '';
    var transform = prefixStyle('transform');
    var transition = prefixStyle('transition');
    var hasPerspective = inBrowser && prefixStyle('perspective') in elementStyle;
    // fix issue #361
    var hasTouch = inBrowser && ('ontouchstart' in window || isWeChatDevTools);
    var hasTransition = inBrowser && transition in elementStyle;
    var style = {
        transform: transform,
        transition: transition,
        transitionTimingFunction: prefixStyle('transitionTimingFunction'),
        transitionDuration: prefixStyle('transitionDuration'),
        transitionDelay: prefixStyle('transitionDelay'),
        transformOrigin: prefixStyle('transformOrigin'),
        transitionEnd: prefixStyle('transitionEnd')
    };
    var eventTypeMap = {
        touchstart: 1,
        touchmove: 1,
        touchend: 1,
        mousedown: 2,
        mousemove: 2,
        mouseup: 2
    };
    function getRect(el) {
        if (el instanceof window.SVGElement) {
            var rect = el.getBoundingClientRect();
            return {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            };
        }
        else {
            return {
                top: el.offsetTop,
                left: el.offsetLeft,
                width: el.offsetWidth,
                height: el.offsetHeight
            };
        }
    }
    function preventDefaultExceptionFn(el, exceptions) {
        for (var i in exceptions) {
            if (exceptions[i].test(el[i])) {
                return true;
            }
        }
        return false;
    }
    var tagExceptionFn = preventDefaultExceptionFn;
    function tap(e, eventName) {
        var ev = document.createEvent('Event');
        ev.initEvent(eventName, true, true);
        ev.pageX = e.pageX;
        ev.pageY = e.pageY;
        e.target.dispatchEvent(ev);
    }
    function click(e, event) {
        if (event === void 0) { event = 'click'; }
        var eventSource;
        if (e.type === 'mouseup') {
            eventSource = e;
        }
        else if (e.type === 'touchend' || e.type === 'touchcancel') {
            eventSource = e.changedTouches[0];
        }
        var posSrc = {};
        if (eventSource) {
            posSrc.screenX = eventSource.screenX || 0;
            posSrc.screenY = eventSource.screenY || 0;
            posSrc.clientX = eventSource.clientX || 0;
            posSrc.clientY = eventSource.clientY || 0;
        }
        var ev;
        var bubbles = true;
        var cancelable = true;
        if (typeof MouseEvent !== 'undefined') {
            try {
                ev = new MouseEvent(event, extend({
                    bubbles: bubbles,
                    cancelable: cancelable
                }, posSrc));
            }
            catch (e) {
                createEvent();
            }
        }
        else {
            createEvent();
        }
        function createEvent() {
            ev = document.createEvent('Event');
            ev.initEvent(event, bubbles, cancelable);
            extend(ev, posSrc);
        }
        // forwardedTouchEvent set to true in case of the conflict with fastclick
        ev.forwardedTouchEvent = true;
        ev._constructed = true;
        e.target.dispatchEvent(ev);
    }
    function dblclick(e) {
        click(e, 'dblclick');
    }

    var ease = {
        // easeOutQuint
        swipe: {
            style: 'cubic-bezier(0.23, 1, 0.32, 1)',
            fn: function (t) {
                return 1 + --t * t * t * t * t;
            }
        },
        // easeOutQuard
        swipeBounce: {
            style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fn: function (t) {
                return t * (2 - t);
            }
        },
        // easeOutQuart
        bounce: {
            style: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
            fn: function (t) {
                return 1 - --t * t * t * t;
            }
        }
    };

    var DEFAULT_INTERVAL = 100 / 60;
    var windowCompat = inBrowser && window;
    function noop() { }
    var requestAnimationFrame = (function () {
        if (!inBrowser) {
            /* istanbul ignore if */
            return noop;
        }
        return (windowCompat.requestAnimationFrame ||
            windowCompat.webkitRequestAnimationFrame ||
            windowCompat.mozRequestAnimationFrame ||
            windowCompat.oRequestAnimationFrame ||
            // if all else fails, use setTimeout
            function (callback) {
                return window.setTimeout(callback, (callback.interval || DEFAULT_INTERVAL) / 2); // make interval as precise as possible.
            });
    })();
    var cancelAnimationFrame = (function () {
        if (!inBrowser) {
            /* istanbul ignore if */
            return noop;
        }
        return (windowCompat.cancelAnimationFrame ||
            windowCompat.webkitCancelAnimationFrame ||
            windowCompat.mozCancelAnimationFrame ||
            windowCompat.oCancelAnimationFrame ||
            function (id) {
                window.clearTimeout(id);
            });
    })();

    var noop$1 = function (val) { };
    var sharedPropertyDefinition = {
        enumerable: true,
        configurable: true,
        get: noop$1,
        set: noop$1
    };
    var getProperty = function (obj, key) {
        var keys = key.split('.');
        for (var i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
            if (typeof obj !== 'object' || !obj)
                return;
        }
        var lastKey = keys.pop();
        if (typeof obj[lastKey] === 'function') {
            return function () {
                return obj[lastKey].apply(obj, arguments);
            };
        }
        else {
            return obj[lastKey];
        }
    };
    var setProperty = function (obj, key, value) {
        var keys = key.split('.');
        var temp;
        for (var i = 0; i < keys.length - 1; i++) {
            temp = keys[i];
            if (!obj[temp])
                obj[temp] = {};
            obj = obj[temp];
        }
        obj[keys.pop()] = value;
    };
    function propertiesProxy(target, sourceKey, key) {
        sharedPropertyDefinition.get = function proxyGetter() {
            return getProperty(this, sourceKey);
        };
        sharedPropertyDefinition.set = function proxySetter(val) {
            setProperty(this, sourceKey, val);
        };
        Object.defineProperty(target, key, sharedPropertyDefinition);
    }

    var EventEmitter = /** @class */ (function () {
        function EventEmitter(names) {
            this.events = {};
            this.eventTypes = {};
            this.registerType(names);
        }
        EventEmitter.prototype.on = function (type, fn, context) {
            if (context === void 0) { context = this; }
            this.hasType(type);
            if (!this.events[type]) {
                this.events[type] = [];
            }
            this.events[type].push([fn, context]);
            return this;
        };
        EventEmitter.prototype.once = function (type, fn, context) {
            var _this = this;
            if (context === void 0) { context = this; }
            this.hasType(type);
            var magic = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                _this.off(type, magic);
                fn.apply(context, args);
            };
            magic.fn = fn;
            this.on(type, magic);
            return this;
        };
        EventEmitter.prototype.off = function (type, fn) {
            if (!type && !fn) {
                this.events = {};
                return this;
            }
            if (type) {
                this.hasType(type);
                if (!fn) {
                    this.events[type] = [];
                    return this;
                }
                var events = this.events[type];
                if (!events) {
                    return this;
                }
                var count = events.length;
                while (count--) {
                    if (events[count][0] === fn ||
                        (events[count][0] && events[count][0].fn === fn)) {
                        events.splice(count, 1);
                    }
                }
                return this;
            }
        };
        EventEmitter.prototype.trigger = function (type) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.hasType(type);
            var events = this.events[type];
            if (!events) {
                return;
            }
            var len = events.length;
            var eventsCopy = events.slice();
            var ret;
            for (var i = 0; i < len; i++) {
                var event_1 = eventsCopy[i];
                var fn = event_1[0], context = event_1[1];
                if (fn) {
                    ret = fn.apply(context, args);
                    if (ret === true) {
                        return ret;
                    }
                }
            }
        };
        EventEmitter.prototype.registerType = function (names) {
            var _this = this;
            names.forEach(function (type) {
                _this.eventTypes[type] = type;
            });
        };
        EventEmitter.prototype.destroy = function () {
            this.events = {};
            this.eventTypes = {};
        };
        EventEmitter.prototype.hasType = function (type) {
            var types = this.eventTypes;
            var isType = types[type] === type;
            if (!isType) {
                warn("EventEmitter has used unknown event type: \"" + type + "\", should be oneof [" +
                    ("" + Object.keys(types).map(function (_) { return JSON.stringify(_); })) +
                    "]");
            }
        };
        return EventEmitter;
    }());
    var EventRegister = /** @class */ (function () {
        function EventRegister(wrapper, events) {
            this.wrapper = wrapper;
            this.events = events;
            this.addDOMEvents();
        }
        EventRegister.prototype.destroy = function () {
            this.removeDOMEvents();
            this.events = [];
        };
        EventRegister.prototype.addDOMEvents = function () {
            this.handleDOMEvents(addEvent);
        };
        EventRegister.prototype.removeDOMEvents = function () {
            this.handleDOMEvents(removeEvent);
        };
        EventRegister.prototype.handleDOMEvents = function (eventOperation) {
            var _this = this;
            var wrapper = this.wrapper;
            this.events.forEach(function (event) {
                eventOperation(wrapper, event.name, _this, !!event.capture);
            });
        };
        EventRegister.prototype.handleEvent = function (e) {
            var eventType = e.type;
            this.events.some(function (event) {
                if (event.name === eventType) {
                    event.handler(e);
                    return true;
                }
                return false;
            });
        };
        return EventRegister;
    }());

    var Options = /** @class */ (function () {
        function Options() {
            this.startX = 0;
            this.startY = 0;
            this.scrollX = false;
            this.scrollY = true;
            this.freeScroll = false;
            this.directionLockThreshold = 5;
            this.eventPassthrough = "" /* None */;
            this.click = false;
            this.dblclick = false;
            this.tap = '';
            this.bounce = {
                top: true,
                bottom: true,
                left: true,
                right: true
            };
            this.bounceTime = 800;
            this.momentum = true;
            this.momentumLimitTime = 300;
            this.momentumLimitDistance = 15;
            this.swipeTime = 2500;
            this.swipeBounceTime = 500;
            this.deceleration = 0.0015;
            this.flickLimitTime = 200;
            this.flickLimitDistance = 100;
            this.resizePolling = 60;
            this.probeType = 0 /* Default */;
            this.stopPropagation = false;
            this.preventDefault = true;
            this.preventDefaultException = {
                tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|AUDIO)$/
            };
            this.tagException = {
                tagName: /^TEXTAREA$/
            };
            this.HWCompositing = true;
            this.useTransition = true;
            this.bindToWrapper = false;
            this.disableMouse = hasTouch;
            this.disableTouch = !hasTouch;
            this.autoBlur = true;
        }
        Options.prototype.merge = function (options) {
            if (!options)
                return this;
            for (var key in options) {
                this[key] = options[key];
            }
            return this;
        };
        Options.prototype.process = function () {
            this.translateZ =
                this.HWCompositing && hasPerspective ? ' translateZ(0)' : '';
            this.useTransition = this.useTransition && hasTransition;
            this.preventDefault = !this.eventPassthrough && this.preventDefault;
            this.resolveBounce();
            // If you want eventPassthrough I have to lock one of the axes
            this.scrollX =
                this.eventPassthrough === "horizontal" /* Horizontal */
                    ? false
                    : this.scrollX;
            this.scrollY =
                this.eventPassthrough === "vertical" /* Vertical */ ? false : this.scrollY;
            // With eventPassthrough we also need lockDirection mechanism
            this.freeScroll = this.freeScroll && !this.eventPassthrough;
            // force true when freeScroll is true
            this.scrollX = this.freeScroll ? true : this.scrollX;
            this.scrollY = this.freeScroll ? true : this.scrollY;
            this.directionLockThreshold = this.eventPassthrough
                ? 0
                : this.directionLockThreshold;
            return this;
        };
        Options.prototype.resolveBounce = function () {
            var directions = ['top', 'right', 'bottom', 'left'];
            var bounce = this.bounce;
            if (bounce === false || bounce === true) {
                this.bounce = makeMap(directions, bounce);
            }
        };
        return Options;
    }());
    function makeMap(keys, val) {
        if (val === void 0) { val = true; }
        var ret = {};
        keys.forEach(function (key) {
            ret[key] = val;
        });
        return ret;
    }

    var ActionsHandler = /** @class */ (function () {
        function ActionsHandler(wrapper, options) {
            this.wrapper = wrapper;
            this.options = options;
            this.hooks = new EventEmitter([
                'beforeStart',
                'start',
                'move',
                'end',
                'click'
            ]);
            this.handleDOMEvents();
        }
        ActionsHandler.prototype.handleDOMEvents = function () {
            var _a = this.options, bindToWrapper = _a.bindToWrapper, disableMouse = _a.disableMouse, disableTouch = _a.disableTouch, click = _a.click;
            var wrapper = this.wrapper;
            var target = bindToWrapper ? wrapper : window;
            var wrapperEvents = [];
            var targetEvents = [];
            var shouldRegisterTouch = hasTouch && !disableTouch;
            var shouldRegisterMouse = !disableMouse;
            if (click) {
                wrapperEvents.push({
                    name: 'click',
                    handler: this.click.bind(this),
                    capture: true
                });
            }
            if (shouldRegisterTouch) {
                wrapperEvents.push({
                    name: 'touchstart',
                    handler: this.start.bind(this)
                });
                targetEvents.push({
                    name: 'touchmove',
                    handler: this.move.bind(this)
                }, {
                    name: 'touchend',
                    handler: this.end.bind(this)
                }, {
                    name: 'touchcancel',
                    handler: this.end.bind(this)
                });
            }
            if (shouldRegisterMouse) {
                wrapperEvents.push({
                    name: 'mousedown',
                    handler: this.start.bind(this)
                });
                targetEvents.push({
                    name: 'mousemove',
                    handler: this.move.bind(this)
                }, {
                    name: 'mouseup',
                    handler: this.end.bind(this)
                });
            }
            this.wrapperEventRegister = new EventRegister(wrapper, wrapperEvents);
            this.targetEventRegister = new EventRegister(target, targetEvents);
        };
        ActionsHandler.prototype.beforeHandler = function (e, type) {
            var _a = this.options, preventDefault = _a.preventDefault, stopPropagation = _a.stopPropagation, preventDefaultException = _a.preventDefaultException;
            var preventDefaultConditions = {
                start: function () {
                    return (preventDefault &&
                        !preventDefaultExceptionFn(e.target, preventDefaultException));
                },
                end: function () {
                    return (preventDefault &&
                        !preventDefaultExceptionFn(e.target, preventDefaultException));
                },
                move: function () {
                    return preventDefault;
                }
            };
            if (preventDefaultConditions[type]()) {
                e.preventDefault();
            }
            if (stopPropagation) {
                e.stopPropagation();
            }
        };
        ActionsHandler.prototype.setInitiated = function (type) {
            if (type === void 0) { type = 0; }
            this.initiated = type;
        };
        ActionsHandler.prototype.start = function (e) {
            var _eventType = eventTypeMap[e.type];
            if (this.initiated && this.initiated !== _eventType) {
                return;
            }
            this.setInitiated(_eventType);
            // if textarea or other html tags in options.tagException is manipulated
            // do not make bs scroll
            if (tagExceptionFn(e.target, this.options.tagException)) {
                this.setInitiated();
                return;
            }
            // no mouse left button
            if (_eventType === 2 /* Mouse */ && e.button !== 0 /* Left */)
                return;
            if (this.hooks.trigger(this.hooks.eventTypes.beforeStart, e)) {
                return;
            }
            this.beforeHandler(e, 'start');
            var point = (e.touches ? e.touches[0] : e);
            this.pointX = point.pageX;
            this.pointY = point.pageY;
            this.hooks.trigger(this.hooks.eventTypes.start, e);
        };
        ActionsHandler.prototype.move = function (e) {
            if (eventTypeMap[e.type] !== this.initiated) {
                return;
            }
            this.beforeHandler(e, 'move');
            var point = (e.touches ? e.touches[0] : e);
            var deltaX = point.pageX - this.pointX;
            var deltaY = point.pageY - this.pointY;
            this.pointX = point.pageX;
            this.pointY = point.pageY;
            if (this.hooks.trigger(this.hooks.eventTypes.move, {
                deltaX: deltaX,
                deltaY: deltaY,
                e: e
            })) {
                return;
            }
            // auto end when out of wrapper
            var scrollLeft = document.documentElement.scrollLeft ||
                window.pageXOffset ||
                document.body.scrollLeft;
            var scrollTop = document.documentElement.scrollTop ||
                window.pageYOffset ||
                document.body.scrollTop;
            var pX = this.pointX - scrollLeft;
            var pY = this.pointY - scrollTop;
            if (pX >
                document.documentElement.clientWidth -
                    this.options.momentumLimitDistance ||
                pX < this.options.momentumLimitDistance ||
                pY < this.options.momentumLimitDistance ||
                pY >
                    document.documentElement.clientHeight -
                        this.options.momentumLimitDistance) {
                this.end(e);
            }
        };
        ActionsHandler.prototype.end = function (e) {
            if (eventTypeMap[e.type] !== this.initiated) {
                return;
            }
            this.setInitiated();
            this.beforeHandler(e, 'end');
            this.hooks.trigger(this.hooks.eventTypes.end, e);
        };
        ActionsHandler.prototype.click = function (e) {
            this.hooks.trigger(this.hooks.eventTypes.click, e);
        };
        ActionsHandler.prototype.destroy = function () {
            this.wrapperEventRegister.destroy();
            this.targetEventRegister.destroy();
            this.hooks.destroy();
        };
        return ActionsHandler;
    }());

    var translaterMetaData = {
        x: ['translateX', 'px'],
        y: ['translateY', 'px']
    };
    var Translater = /** @class */ (function () {
        function Translater(content) {
            this.content = content;
            this.style = content.style;
            this.hooks = new EventEmitter(['beforeTranslate', 'translate']);
        }
        Translater.prototype.getComputedPosition = function () {
            var cssStyle = window.getComputedStyle(this.content, null);
            var matrix = cssStyle[style.transform].split(')')[0].split(', ');
            var x = +(matrix[12] || matrix[4]);
            var y = +(matrix[13] || matrix[5]);
            return {
                x: x,
                y: y
            };
        };
        Translater.prototype.translate = function (point) {
            var transformStyle = [];
            Object.keys(point).forEach(function (key) {
                if (!translaterMetaData[key]) {
                    return;
                }
                var transformFnName = translaterMetaData[key][0];
                if (transformFnName) {
                    var transformFnArgUnit = translaterMetaData[key][1];
                    var transformFnArg = point[key];
                    transformStyle.push(transformFnName + "(" + transformFnArg + transformFnArgUnit + ")");
                }
            });
            this.hooks.trigger(this.hooks.eventTypes.beforeTranslate, transformStyle, point);
            this.style[style.transform] = transformStyle.join(' ');
            this.hooks.trigger(this.hooks.eventTypes.translate, point);
        };
        Translater.prototype.destroy = function () {
            this.hooks.destroy();
        };
        return Translater;
    }());

    var Base = /** @class */ (function () {
        function Base(content, translater, options) {
            this.content = content;
            this.translater = translater;
            this.options = options;
            this.hooks = new EventEmitter([
                'move',
                'end',
                'beforeForceStop',
                'forceStop',
                'time',
                'timeFunction'
            ]);
            this.style = content.style;
        }
        Base.prototype.translate = function (endPoint) {
            this.translater.translate(endPoint);
        };
        Base.prototype.setPending = function (pending) {
            this.pending = pending;
        };
        Base.prototype.setForceStopped = function (forceStopped) {
            this.forceStopped = forceStopped;
        };
        Base.prototype.destroy = function () {
            this.hooks.destroy();
            cancelAnimationFrame(this.timer);
        };
        return Base;
    }());

    var Transition = /** @class */ (function (_super) {
        __extends(Transition, _super);
        function Transition() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Transition.prototype.startProbe = function () {
            var _this = this;
            var probe = function () {
                var pos = _this.translater.getComputedPosition();
                _this.hooks.trigger(_this.hooks.eventTypes.move, pos);
                // excute when transition ends
                if (!_this.pending) {
                    _this.hooks.trigger(_this.hooks.eventTypes.end, pos);
                    return;
                }
                _this.timer = requestAnimationFrame(probe);
            };
            cancelAnimationFrame(this.timer);
            this.timer = requestAnimationFrame(probe);
        };
        Transition.prototype.transitionTime = function (time) {
            if (time === void 0) { time = 0; }
            this.style[style.transitionDuration] = time + 'ms';
            this.hooks.trigger(this.hooks.eventTypes.time, time);
        };
        Transition.prototype.transitionTimingFunction = function (easing) {
            this.style[style.transitionTimingFunction] = easing;
            this.hooks.trigger(this.hooks.eventTypes.timeFunction, easing);
        };
        Transition.prototype.move = function (startPoint, endPoint, time, easingFn, isSlient) {
            this.setPending(time > 0 && (startPoint.x !== endPoint.x || startPoint.y !== endPoint.y));
            this.transitionTimingFunction(easingFn);
            this.transitionTime(time);
            this.translate(endPoint);
            if (time && this.options.probeType === 3 /* Realtime */) {
                this.startProbe();
            }
            // if we change content's transformY in a tick
            // such as: 0 -> 50px -> 0
            // transitionend will not be triggered
            // so we forceupdate by reflow
            if (!time) {
                this._reflow = this.content.offsetHeight;
            }
            // no need to dispatch move and end when slient
            if (!time && !isSlient) {
                this.hooks.trigger(this.hooks.eventTypes.move, endPoint);
                this.hooks.trigger(this.hooks.eventTypes.end, endPoint);
            }
        };
        Transition.prototype.stop = function () {
            // still in transition
            if (this.pending) {
                this.setPending(false);
                cancelAnimationFrame(this.timer);
                var _a = this.translater.getComputedPosition(), x = _a.x, y = _a.y;
                this.transitionTime();
                this.translate({ x: x, y: y });
                this.setForceStopped(true);
                if (this.hooks.trigger(this.hooks.eventTypes.beforeForceStop, { x: x, y: y })) {
                    return;
                }
                this.hooks.trigger(this.hooks.eventTypes.forceStop, { x: x, y: y });
            }
        };
        return Transition;
    }(Base));

    var Animation = /** @class */ (function (_super) {
        __extends(Animation, _super);
        function Animation() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Animation.prototype.move = function (startPoint, endPoint, time, easingFn, isSlient) {
            // time is 0
            if (!time) {
                this.translate(endPoint);
                // if we change content's transformY in a tick
                // such as: 0 -> 50px -> 0
                // transitionend will not be triggered
                // so we forceupdate by reflow
                this._reflow = this.content.offsetHeight;
                // no need to dispatch move and end when slient
                if (isSlient)
                    return;
                this.hooks.trigger(this.hooks.eventTypes.move, endPoint);
                this.hooks.trigger(this.hooks.eventTypes.end, endPoint);
                return;
            }
            this.animate(startPoint, endPoint, time, easingFn);
        };
        Animation.prototype.animate = function (startPoint, endPoint, duration, easingFn) {
            var _this = this;
            var startTime = getNow();
            var destTime = startTime + duration;
            var step = function () {
                var now = getNow();
                // js animation end
                if (now >= destTime) {
                    _this.translate(endPoint);
                    _this.hooks.trigger(_this.hooks.eventTypes.move, endPoint);
                    _this.hooks.trigger(_this.hooks.eventTypes.end, endPoint);
                    return;
                }
                now = (now - startTime) / duration;
                var easing = easingFn(now);
                var newPoint = {};
                Object.keys(endPoint).forEach(function (key) {
                    var startValue = startPoint[key];
                    var endValue = endPoint[key];
                    newPoint[key] = (endValue - startValue) * easing + startValue;
                });
                _this.translate(newPoint);
                if (_this.pending) {
                    _this.timer = requestAnimationFrame(step);
                }
                if (_this.options.probeType === 3 /* Realtime */) {
                    _this.hooks.trigger(_this.hooks.eventTypes.move, newPoint);
                }
            };
            this.setPending(true);
            cancelAnimationFrame(this.timer);
            step();
        };
        Animation.prototype.stop = function () {
            // still in requestFrameAnimation
            if (this.pending) {
                this.setPending(false);
                cancelAnimationFrame(this.timer);
                var pos = this.translater.getComputedPosition();
                this.setForceStopped(true);
                if (this.hooks.trigger(this.hooks.eventTypes.beforeForceStop, pos)) {
                    return;
                }
                this.hooks.trigger(this.hooks.eventTypes.forceStop, pos);
            }
        };
        return Animation;
    }(Base));

    function createAnimater(element, translater, options) {
        var useTransition = options.useTransition;
        var animaterOptions = {};
        Object.defineProperty(animaterOptions, 'probeType', {
            enumerable: true,
            configurable: false,
            get: function () {
                return options.probeType;
            }
        });
        if (useTransition) {
            return new Transition(element, translater, animaterOptions);
        }
        else {
            return new Animation(element, translater, animaterOptions);
        }
    }

    var Behavior = /** @class */ (function () {
        function Behavior(wrapper, options) {
            this.wrapper = wrapper;
            this.options = options;
            this.hooks = new EventEmitter(['momentum', 'end']);
            this.content = this.wrapper.children[0];
            this.currentPos = 0;
            this.startPos = 0;
        }
        Behavior.prototype.start = function () {
            this.direction = 0 /* Default */;
            this.movingDirection = 0 /* Default */;
            this.dist = 0;
        };
        Behavior.prototype.move = function (delta) {
            delta = this.hasScroll ? delta : 0;
            this.movingDirection =
                delta > 0
                    ? -1 /* Negative */
                    : delta < 0
                        ? 1 /* Positive */
                        : 0 /* Default */;
            var newPos = this.currentPos + delta;
            // Slow down or stop if outside of the boundaries
            if (newPos > this.minScrollPos || newPos < this.maxScrollPos) {
                if ((newPos > this.minScrollPos && this.options.bounces[0]) ||
                    (newPos < this.maxScrollPos && this.options.bounces[1])) {
                    newPos = this.currentPos + delta / 3;
                }
                else {
                    newPos =
                        newPos > this.minScrollPos ? this.minScrollPos : this.maxScrollPos;
                }
            }
            return newPos;
        };
        Behavior.prototype.end = function (duration) {
            var momentumInfo = {
                duration: 0
            };
            var absDist = Math.abs(this.currentPos - this.startPos);
            // start momentum animation if needed
            if (this.options.momentum &&
                duration < this.options.momentumLimitTime &&
                absDist > this.options.momentumLimitDistance) {
                var wrapperSize = (this.direction === -1 /* Negative */ && this.options.bounces[0]) ||
                    (this.direction === 1 /* Positive */ && this.options.bounces[1])
                    ? this.wrapperSize
                    : 0;
                momentumInfo = this.hasScroll
                    ? this.momentum(this.currentPos, this.startPos, duration, this.maxScrollPos, this.minScrollPos, wrapperSize, this.options)
                    : { destination: this.currentPos, duration: 0 };
            }
            else {
                this.hooks.trigger(this.hooks.eventTypes.end, momentumInfo);
            }
            return momentumInfo;
        };
        Behavior.prototype.momentum = function (current, start, time, lowerMargin, upperMargin, wrapperSize, options) {
            if (options === void 0) { options = this.options; }
            var distance = current - start;
            var speed = Math.abs(distance) / time;
            var deceleration = options.deceleration, swipeBounceTime = options.swipeBounceTime, swipeTime = options.swipeTime;
            var momentumData = {
                destination: current + (speed / deceleration) * (distance < 0 ? -1 : 1),
                duration: swipeTime,
                rate: 15
            };
            this.hooks.trigger(this.hooks.eventTypes.momentum, momentumData, distance);
            if (momentumData.destination < lowerMargin) {
                momentumData.destination = wrapperSize
                    ? Math.max(lowerMargin - wrapperSize / 4, lowerMargin - (wrapperSize / momentumData.rate) * speed)
                    : lowerMargin;
                momentumData.duration = swipeBounceTime;
            }
            else if (momentumData.destination > upperMargin) {
                momentumData.destination = wrapperSize
                    ? Math.min(upperMargin + wrapperSize / 4, upperMargin + (wrapperSize / momentumData.rate) * speed)
                    : upperMargin;
                momentumData.duration = swipeBounceTime;
            }
            momentumData.destination = Math.round(momentumData.destination);
            return momentumData;
        };
        Behavior.prototype.updateDirection = function () {
            var absDist = Math.round(this.currentPos) - this.absStartPos;
            this.direction =
                absDist > 0
                    ? -1 /* Negative */
                    : absDist < 0
                        ? 1 /* Positive */
                        : 0 /* Default */;
        };
        Behavior.prototype.refresh = function () {
            var _a = this.options.rect, size = _a.size, position = _a.position;
            var isWrapperStatic = window.getComputedStyle(this.wrapper, null).position === 'static';
            var wrapperRect = getRect(this.wrapper);
            this.wrapperSize = wrapperRect[size];
            var contentRect = getRect(this.content);
            this.contentSize = contentRect[size];
            this.relativeOffset = contentRect[position];
            if (isWrapperStatic) {
                this.relativeOffset -= wrapperRect[position];
            }
            this.minScrollPos = 0;
            this.maxScrollPos = this.wrapperSize - this.contentSize;
            if (this.maxScrollPos < 0) {
                this.maxScrollPos -= this.relativeOffset;
                this.minScrollPos = -this.relativeOffset;
            }
            this.hasScroll =
                this.options.scrollable && this.maxScrollPos < this.minScrollPos;
            if (!this.hasScroll) {
                this.maxScrollPos = this.minScrollPos;
                this.contentSize = this.wrapperSize;
            }
            this.direction = 0;
        };
        Behavior.prototype.updatePosition = function (pos) {
            this.currentPos = pos;
        };
        Behavior.prototype.getCurrentPos = function () {
            return Math.round(this.currentPos);
        };
        Behavior.prototype.checkInBoundary = function () {
            var position = this.adjustPosition(this.currentPos);
            var inBoundary = position === this.getCurrentPos();
            return {
                position: position,
                inBoundary: inBoundary
            };
        };
        // adjust position when out of boundary
        Behavior.prototype.adjustPosition = function (pos) {
            var roundPos = Math.round(pos);
            if (!this.hasScroll || roundPos > this.minScrollPos) {
                roundPos = this.minScrollPos;
            }
            else if (roundPos < this.maxScrollPos) {
                roundPos = this.maxScrollPos;
            }
            return roundPos;
        };
        Behavior.prototype.updateStartPos = function () {
            this.startPos = this.currentPos;
        };
        Behavior.prototype.updateAbsStartPos = function () {
            this.absStartPos = this.currentPos;
        };
        Behavior.prototype.resetStartPos = function () {
            this.updateStartPos();
            this.updateAbsStartPos();
        };
        Behavior.prototype.getAbsDist = function (delta) {
            this.dist += delta;
            return Math.abs(this.dist);
        };
        Behavior.prototype.destroy = function () {
            this.hooks.destroy();
        };
        return Behavior;
    }());

    var _a, _b, _c, _d;
    var PassthroughHandlers = (_a = {},
        _a["yes" /* Yes */] = function (e) {
            return true;
        },
        _a["no" /* No */] = function (e) {
            e.preventDefault();
            return false;
        },
        _a);
    var DirectionMap = (_b = {},
        _b["horizontal" /* Horizontal */] = (_c = {},
            _c["yes" /* Yes */] = "horizontal" /* Horizontal */,
            _c["no" /* No */] = "vertical" /* Vertical */,
            _c),
        _b["vertical" /* Vertical */] = (_d = {},
            _d["yes" /* Yes */] = "vertical" /* Vertical */,
            _d["no" /* No */] = "horizontal" /* Horizontal */,
            _d),
        _b);
    var DirectionLockAction = /** @class */ (function () {
        function DirectionLockAction(directionLockThreshold, freeScroll, eventPassthrough) {
            this.directionLockThreshold = directionLockThreshold;
            this.freeScroll = freeScroll;
            this.eventPassthrough = eventPassthrough;
            this.reset();
        }
        DirectionLockAction.prototype.reset = function () {
            this.directionLocked = "" /* Default */;
        };
        DirectionLockAction.prototype.checkMovingDirection = function (absDistX, absDistY, e) {
            this.computeDirectionLock(absDistX, absDistY);
            return this.handleEventPassthrough(e);
        };
        DirectionLockAction.prototype.adjustDelta = function (deltaX, deltaY) {
            if (this.directionLocked === "horizontal" /* Horizontal */) {
                deltaY = 0;
            }
            else if (this.directionLocked === "vertical" /* Vertical */) {
                deltaX = 0;
            }
            return {
                deltaX: deltaX,
                deltaY: deltaY
            };
        };
        DirectionLockAction.prototype.computeDirectionLock = function (absDistX, absDistY) {
            // If you are scrolling in one direction, lock it
            if (this.directionLocked === "" /* Default */ && !this.freeScroll) {
                if (absDistX > absDistY + this.directionLockThreshold) {
                    this.directionLocked = "horizontal" /* Horizontal */; // lock horizontally
                }
                else if (absDistY >= absDistX + this.directionLockThreshold) {
                    this.directionLocked = "vertical" /* Vertical */; // lock vertically
                }
                else {
                    this.directionLocked = "none" /* None */; // no lock
                }
            }
        };
        DirectionLockAction.prototype.handleEventPassthrough = function (e) {
            var handleMap = DirectionMap[this.directionLocked];
            if (handleMap) {
                if (this.eventPassthrough === handleMap["yes" /* Yes */]) {
                    return PassthroughHandlers["yes" /* Yes */](e);
                }
                else if (this.eventPassthrough === handleMap["no" /* No */]) {
                    return PassthroughHandlers["no" /* No */](e);
                }
            }
            return false;
        };
        return DirectionLockAction;
    }());

    var ScrollerActions = /** @class */ (function () {
        function ScrollerActions(scrollBehaviorX, scrollBehaviorY, actionsHandler, animater, options) {
            this.hooks = new EventEmitter([
                'start',
                'beforeMove',
                'scrollStart',
                'scroll',
                'beforeEnd',
                'end',
                'scrollEnd'
            ]);
            this.scrollBehaviorX = scrollBehaviorX;
            this.scrollBehaviorY = scrollBehaviorY;
            this.actionsHandler = actionsHandler;
            this.animater = animater;
            this.options = options;
            this.directionLockAction = new DirectionLockAction(options.directionLockThreshold, options.freeScroll, options.eventPassthrough);
            this.enabled = true;
            this.bindActionsHandler();
        }
        ScrollerActions.prototype.bindActionsHandler = function () {
            var _this = this;
            // [mouse|touch]start event
            this.actionsHandler.hooks.on(this.actionsHandler.hooks.eventTypes.start, function (e) {
                if (!_this.enabled)
                    return true;
                return _this.handleStart(e);
            });
            // [mouse|touch]move event
            this.actionsHandler.hooks.on(this.actionsHandler.hooks.eventTypes.move, function (_a) {
                var deltaX = _a.deltaX, deltaY = _a.deltaY, e = _a.e;
                if (!_this.enabled)
                    return true;
                return _this.handleMove(deltaX, deltaY, e);
            });
            // [mouse|touch]end event
            this.actionsHandler.hooks.on(this.actionsHandler.hooks.eventTypes.end, function (e) {
                if (!_this.enabled)
                    return true;
                return _this.handleEnd(e);
            });
            // click
            this.actionsHandler.hooks.on(this.actionsHandler.hooks.eventTypes.click, function (e) {
                // handle native click event
                if (_this.enabled && !e._constructed) {
                    _this.handleClick(e);
                }
            });
        };
        ScrollerActions.prototype.handleStart = function (e) {
            var timestamp = getNow();
            this.moved = false;
            this.startTime = timestamp;
            this.directionLockAction.reset();
            this.scrollBehaviorX.start();
            this.scrollBehaviorY.start();
            // force stopping last transition or animation
            this.animater.stop();
            this.scrollBehaviorX.resetStartPos();
            this.scrollBehaviorY.resetStartPos();
            this.hooks.trigger(this.hooks.eventTypes.start, e);
        };
        ScrollerActions.prototype.handleMove = function (deltaX, deltaY, e) {
            if (this.hooks.trigger(this.hooks.eventTypes.beforeMove, e)) {
                return;
            }
            var absDistX = this.scrollBehaviorX.getAbsDist(deltaX);
            var absDistY = this.scrollBehaviorY.getAbsDist(deltaY);
            var timestamp = getNow();
            // We need to move at least momentumLimitDistance pixels
            // for the scrolling to initiate
            if (this.checkMomentum(absDistX, absDistY, timestamp)) {
                return true;
            }
            if (this.directionLockAction.checkMovingDirection(absDistX, absDistY, e)) {
                this.actionsHandler.setInitiated();
                return true;
            }
            var delta = this.directionLockAction.adjustDelta(deltaX, deltaY);
            var newX = this.scrollBehaviorX.move(delta.deltaX);
            var newY = this.scrollBehaviorY.move(delta.deltaY);
            if (!this.moved) {
                this.moved = true;
                this.hooks.trigger(this.hooks.eventTypes.scrollStart);
            }
            this.animater.translate({
                x: newX,
                y: newY
            });
            this.dispatchScroll(timestamp);
        };
        ScrollerActions.prototype.dispatchScroll = function (timestamp) {
            // dispatch scroll in interval time
            if (timestamp - this.startTime > this.options.momentumLimitTime) {
                // refresh time and starting position to initiate a momentum
                this.startTime = timestamp;
                this.scrollBehaviorX.updateStartPos();
                this.scrollBehaviorY.updateStartPos();
                if (this.options.probeType === 1 /* Throttle */) {
                    this.hooks.trigger(this.hooks.eventTypes.scroll, this.getCurrentPos());
                }
            }
            // dispatch scroll all the time
            if (this.options.probeType > 1 /* Throttle */) {
                this.hooks.trigger(this.hooks.eventTypes.scroll, this.getCurrentPos());
            }
        };
        ScrollerActions.prototype.checkMomentum = function (absDistX, absDistY, timestamp) {
            return (timestamp - this.endTime > this.options.momentumLimitTime &&
                absDistY < this.options.momentumLimitDistance &&
                absDistX < this.options.momentumLimitDistance);
        };
        ScrollerActions.prototype.handleEnd = function (e) {
            if (this.hooks.trigger(this.hooks.eventTypes.beforeEnd, e)) {
                return;
            }
            var currentPos = this.getCurrentPos();
            this.scrollBehaviorX.updateDirection();
            this.scrollBehaviorY.updateDirection();
            if (this.hooks.trigger(this.hooks.eventTypes.end, e, currentPos)) {
                return true;
            }
            this.animater.translate(currentPos);
            this.endTime = getNow();
            var duration = this.endTime - this.startTime;
            this.hooks.trigger(this.hooks.eventTypes.scrollEnd, currentPos, duration);
        };
        ScrollerActions.prototype.handleClick = function (e) {
            if (!preventDefaultExceptionFn(e.target, this.options.preventDefaultException)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        ScrollerActions.prototype.getCurrentPos = function () {
            return {
                x: this.scrollBehaviorX.getCurrentPos(),
                y: this.scrollBehaviorY.getCurrentPos()
            };
        };
        ScrollerActions.prototype.refresh = function () {
            this.endTime = 0;
        };
        ScrollerActions.prototype.destroy = function () {
            this.hooks.destroy();
        };
        return ScrollerActions;
    }());

    function createActionsHandlerOptions(bsOptions) {
        var options = [
            'click',
            'bindToWrapper',
            'disableMouse',
            'disableTouch',
            'preventDefault',
            'stopPropagation',
            'tagException',
            'preventDefaultException'
        ].reduce(function (prev, cur) {
            prev[cur] = bsOptions[cur];
            return prev;
        }, {});
        return options;
    }
    function createBehaviorOptions(bsOptions, extraProp, bounces, rect) {
        var options = [
            'momentum',
            'momentumLimitTime',
            'momentumLimitDistance',
            'deceleration',
            'swipeBounceTime',
            'swipeTime'
        ].reduce(function (prev, cur) {
            prev[cur] = bsOptions[cur];
            return prev;
        }, {});
        // add extra property
        options.scrollable = bsOptions[extraProp];
        options.bounces = bounces;
        options.rect = rect;
        return options;
    }

    function bubbling(source, target, events) {
        events.forEach(function (event) {
            var sourceEvent;
            var targetEvent;
            if (typeof event === 'string') {
                sourceEvent = targetEvent = event;
            }
            else {
                sourceEvent = event.source;
                targetEvent = event.target;
            }
            source.on(sourceEvent, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return target.trigger.apply(target, [targetEvent].concat(args));
            });
        });
    }

    var Scroller = /** @class */ (function () {
        function Scroller(wrapper, options) {
            this.hooks = new EventEmitter([
                'beforeStart',
                'beforeMove',
                'beforeScrollStart',
                'scrollStart',
                'scroll',
                'beforeEnd',
                'scrollEnd',
                'refresh',
                'touchEnd',
                'end',
                'flick',
                'scrollCancel',
                'momentum',
                'scrollTo',
                'ignoreDisMoveForSamePos',
                'scrollToElement',
                'resize'
            ]);
            this.wrapper = wrapper;
            this.content = wrapper.children[0];
            this.options = options;
            var _a = this
                .options.bounce, _b = _a.left, left = _b === void 0 ? true : _b, _c = _a.right, right = _c === void 0 ? true : _c, _d = _a.top, top = _d === void 0 ? true : _d, _e = _a.bottom, bottom = _e === void 0 ? true : _e;
            // direction X
            this.scrollBehaviorX = new Behavior(wrapper, createBehaviorOptions(options, 'scrollX', [left, right], {
                size: 'width',
                position: 'left'
            }));
            // direction Y
            this.scrollBehaviorY = new Behavior(wrapper, createBehaviorOptions(options, 'scrollY', [top, bottom], {
                size: 'height',
                position: 'top'
            }));
            this.translater = new Translater(this.content);
            this.animater = createAnimater(this.content, this.translater, this.options);
            this.actionsHandler = new ActionsHandler(wrapper, createActionsHandlerOptions(this.options));
            this.actions = new ScrollerActions(this.scrollBehaviorX, this.scrollBehaviorY, this.actionsHandler, this.animater, this.options);
            var resizeHandler = this.resize.bind(this);
            this.resizeRegister = new EventRegister(window, [
                {
                    name: 'orientationchange',
                    handler: resizeHandler
                },
                {
                    name: 'resize',
                    handler: resizeHandler
                }
            ]);
            this.transitionEndRegister = new EventRegister(this.content, [
                {
                    name: style.transitionEnd,
                    handler: this.transitionEnd.bind(this)
                }
            ]);
            this.init();
        }
        Scroller.prototype.init = function () {
            var _this = this;
            this.bindTranslater();
            this.bindAnimater();
            this.bindActions();
            // enable pointer events when scrolling ends
            this.hooks.on(this.hooks.eventTypes.scrollEnd, function () {
                _this.togglePointerEvents(true);
            });
        };
        Scroller.prototype.bindTranslater = function () {
            var _this = this;
            var hooks = this.translater.hooks;
            hooks.on(hooks.eventTypes.beforeTranslate, function (transformStyle) {
                if (_this.options.translateZ) {
                    transformStyle.push(_this.options.translateZ);
                }
            });
            // disable pointer events when scrolling
            hooks.on(hooks.eventTypes.translate, function (pos) {
                _this.updatePositions(pos);
                _this.togglePointerEvents(false);
            });
        };
        Scroller.prototype.bindAnimater = function () {
            var _this = this;
            // reset position
            this.animater.hooks.on(this.animater.hooks.eventTypes.end, function (pos) {
                if (!_this.resetPosition(_this.options.bounceTime)) {
                    _this.animater.setPending(false);
                    _this.hooks.trigger(_this.hooks.eventTypes.scrollEnd, pos);
                }
            });
            bubbling(this.animater.hooks, this.hooks, [
                {
                    source: this.animater.hooks.eventTypes.move,
                    target: this.hooks.eventTypes.scroll
                },
                {
                    source: this.animater.hooks.eventTypes.forceStop,
                    target: this.hooks.eventTypes.scrollEnd
                }
            ]);
        };
        Scroller.prototype.bindActions = function () {
            var _this = this;
            var actions = this.actions;
            bubbling(actions.hooks, this.hooks, [
                {
                    source: actions.hooks.eventTypes.start,
                    target: this.hooks.eventTypes.beforeStart
                },
                {
                    source: actions.hooks.eventTypes.start,
                    target: this.hooks.eventTypes.beforeScrollStart // just for event api
                },
                {
                    source: actions.hooks.eventTypes.beforeMove,
                    target: this.hooks.eventTypes.beforeMove
                },
                {
                    source: actions.hooks.eventTypes.scrollStart,
                    target: this.hooks.eventTypes.scrollStart
                },
                {
                    source: actions.hooks.eventTypes.scroll,
                    target: this.hooks.eventTypes.scroll
                },
                {
                    source: actions.hooks.eventTypes.beforeEnd,
                    target: this.hooks.eventTypes.beforeEnd
                }
            ]);
            actions.hooks.on(actions.hooks.eventTypes.end, function (e, pos) {
                _this.hooks.trigger(_this.hooks.eventTypes.touchEnd, pos);
                if (_this.hooks.trigger(_this.hooks.eventTypes.end, pos)) {
                    return true;
                }
                // check if it is a click operation
                if (!actions.moved && _this.checkClick(e)) {
                    _this.animater.setForceStopped(false);
                    _this.hooks.trigger(_this.hooks.eventTypes.scrollCancel);
                    return true;
                }
                _this.animater.setForceStopped(false);
                // reset if we are outside of the boundaries
                if (_this.resetPosition(_this.options.bounceTime, ease.bounce)) {
                    return true;
                }
            });
            actions.hooks.on(actions.hooks.eventTypes.scrollEnd, function (pos, duration) {
                var deltaX = Math.abs(pos.x - _this.scrollBehaviorX.startPos);
                var deltaY = Math.abs(pos.y - _this.scrollBehaviorY.startPos);
                if (_this.checkFlick(duration, deltaX, deltaY)) {
                    _this.hooks.trigger(_this.hooks.eventTypes.flick);
                    return;
                }
                if (_this.momentum(pos, duration)) {
                    return;
                }
                _this.hooks.trigger(_this.hooks.eventTypes.scrollEnd, pos);
            });
        };
        Scroller.prototype.checkFlick = function (duration, deltaX, deltaY) {
            // flick
            if (this.hooks.events.flick.length > 1 &&
                duration < this.options.flickLimitTime &&
                deltaX < this.options.flickLimitDistance &&
                deltaY < this.options.flickLimitDistance) {
                return true;
            }
        };
        Scroller.prototype.momentum = function (pos, duration) {
            var meta = {
                time: 0,
                easing: ease.swiper,
                newX: pos.x,
                newY: pos.y
            };
            // start momentum animation if needed
            var momentumX = this.scrollBehaviorX.end(duration);
            var momentumY = this.scrollBehaviorY.end(duration);
            meta.newX = isUndef(momentumX.destination)
                ? meta.newX
                : momentumX.destination;
            meta.newY = isUndef(momentumY.destination)
                ? meta.newY
                : momentumY.destination;
            meta.time = Math.max(momentumX.duration, momentumY.duration);
            this.hooks.trigger(this.hooks.eventTypes.momentum, meta, this);
            // when x or y changed, do momentum animation now!
            if (meta.newX !== pos.x || meta.newY !== pos.y) {
                // change easing function when scroller goes out of the boundaries
                if (meta.newX > this.scrollBehaviorX.minScrollPos ||
                    meta.newX < this.scrollBehaviorX.maxScrollPos ||
                    meta.newY > this.scrollBehaviorY.minScrollPos ||
                    meta.newY < this.scrollBehaviorY.maxScrollPos) {
                    meta.easing = ease.swipeBounce;
                }
                this.scrollTo(meta.newX, meta.newY, meta.time, meta.easing);
                return true;
            }
        };
        Scroller.prototype.checkClick = function (e) {
            // when in the process of pulling down, it should not prevent click
            var cancelable = {
                preventClick: this.animater.forceStopped
            };
            // we scrolled less than momentumLimitDistance pixels
            if (this.hooks.trigger(this.hooks.eventTypes.checkClick))
                return true;
            if (!cancelable.preventClick) {
                var _dblclick = this.options.dblclick;
                var dblclickTrigged = false;
                if (_dblclick && this.lastClickTime) {
                    var _a = _dblclick.delay, delay = _a === void 0 ? 300 : _a;
                    if (getNow() - this.lastClickTime < delay) {
                        dblclickTrigged = true;
                        dblclick(e);
                    }
                }
                if (this.options.tap) {
                    tap(e, this.options.tap);
                }
                if (this.options.click &&
                    !preventDefaultExceptionFn(e.target, this.options.preventDefaultException)) {
                    click(e);
                }
                this.lastClickTime = dblclickTrigged ? null : getNow();
                return true;
            }
            return false;
        };
        Scroller.prototype.resize = function () {
            var _this = this;
            if (!this.actions.enabled) {
                return;
            }
            // fix a scroll problem under Android condition
            if (isAndroid) {
                this.wrapper.scrollTop = 0;
            }
            if (!this.hooks.trigger(this.hooks.eventTypes.resize)) {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = window.setTimeout(function () {
                    _this.refresh();
                }, this.options.resizePolling);
            }
        };
        Scroller.prototype.transitionEnd = function (e) {
            if (e.target !== this.content || !this.animater.pending) {
                return;
            }
            var animater = this.animater;
            animater.transitionTime();
            if (!this.resetPosition(this.options.bounceTime, ease.bounce)) {
                this.animater.setPending(false);
                if (this.options.probeType !== 3 /* Realtime */) {
                    this.hooks.trigger(this.hooks.eventTypes.scrollEnd, this.getCurrentPos());
                }
            }
        };
        Scroller.prototype.togglePointerEvents = function (enabled) {
            if (enabled === void 0) { enabled = true; }
            var el = this.content.children.length
                ? this.content.children
                : [this.content];
            var pointerEvents = enabled ? 'auto' : 'none';
            for (var i = 0; i < el.length; i++) {
                var node = el[i];
                // ignore BetterScroll instance's wrapper DOM
                if (node.isBScrollContainer) {
                    continue;
                }
                node.style.pointerEvents = pointerEvents;
            }
        };
        Scroller.prototype.refresh = function () {
            this.scrollBehaviorX.refresh();
            this.scrollBehaviorY.refresh();
            this.actions.refresh();
            this.wrapperOffset = offset(this.wrapper);
        };
        Scroller.prototype.scrollBy = function (deltaX, deltaY, time, easing) {
            if (time === void 0) { time = 0; }
            var _a = this.getCurrentPos(), x = _a.x, y = _a.y;
            easing = !easing ? ease.bounce : easing;
            deltaX += x;
            deltaY += y;
            this.scrollTo(deltaX, deltaY, time, easing);
        };
        Scroller.prototype.scrollTo = function (x, y, time, easing, extraTransform, isSilent) {
            if (time === void 0) { time = 0; }
            if (extraTransform === void 0) { extraTransform = {
                start: {},
                end: {}
            }; }
            easing = !easing ? ease.bounce : easing;
            var easingFn = this.options.useTransition ? easing.style : easing.fn;
            var currentPos = this.getCurrentPos();
            var startPoint = __assign({ x: currentPos.x, y: currentPos.y }, extraTransform.start);
            var endPoint = __assign({ x: x,
                y: y }, extraTransform.end);
            this.hooks.trigger(this.hooks.eventTypes.scrollTo, endPoint);
            if (!this.hooks.trigger(this.hooks.eventTypes.ignoreDisMoveForSamePos)) {
                // it is an useless move
                if (startPoint.x === endPoint.x && startPoint.y === endPoint.y) {
                    return;
                }
            }
            this.animater.move(startPoint, endPoint, time, easingFn, isSilent);
        };
        Scroller.prototype.scrollToElement = function (el, time, offsetX, offsetY, easing) {
            var targetEle = getElement(el);
            var pos = offset(targetEle);
            var getOffset = function (offset, size, wrapperSize) {
                if (typeof offset === 'number') {
                    return offset;
                }
                // if offsetX/Y are true we center the element to the screen
                return offset ? Math.round(size / 2 - wrapperSize / 2) : 0;
            };
            offsetX = getOffset(offsetX, targetEle.offsetWidth, this.wrapper.offsetWidth);
            offsetY = getOffset(offsetY, targetEle.offsetHeight, this.wrapper.offsetHeight);
            var getPos = function (pos, wrapperPos, offset, scrollBehavior) {
                pos -= wrapperPos;
                pos = scrollBehavior.adjustPosition(pos - offset);
                return pos;
            };
            pos.left = getPos(pos.left, this.wrapperOffset.left, offsetX, this.scrollBehaviorX);
            pos.top = getPos(pos.top, this.wrapperOffset.top, offsetY, this.scrollBehaviorY);
            if (this.hooks.trigger(this.hooks.eventTypes.scrollToElement, targetEle, pos)) {
                return;
            }
            this.scrollTo(pos.left, pos.top, time, easing);
        };
        Scroller.prototype.resetPosition = function (time, easing) {
            if (time === void 0) { time = 0; }
            easing = !easing ? ease.bounce : easing;
            var _a = this.scrollBehaviorX.checkInBoundary(), x = _a.position, xInBoundary = _a.inBoundary;
            var _b = this.scrollBehaviorY.checkInBoundary(), y = _b.position, yInBoundary = _b.inBoundary;
            if (xInBoundary && yInBoundary) {
                return false;
            }
            // out of boundary
            this.scrollTo(x, y, time, easing);
            return true;
        };
        Scroller.prototype.updatePositions = function (pos) {
            this.scrollBehaviorX.updatePosition(pos.x);
            this.scrollBehaviorY.updatePosition(pos.y);
        };
        Scroller.prototype.getCurrentPos = function () {
            return this.actions.getCurrentPos();
        };
        Scroller.prototype.enable = function () {
            this.actions.enabled = true;
        };
        Scroller.prototype.disable = function () {
            cancelAnimationFrame(this.animater.timer);
            this.actions.enabled = false;
        };
        Scroller.prototype.destroy = function () {
            var _this = this;
            var keys = [
                'resizeRegister',
                'transitionEndRegister',
                'actionsHandler',
                'actions',
                'hooks',
                'animater',
                'translater',
                'scrollBehaviorX',
                'scrollBehaviorY'
            ];
            keys.forEach(function (key) { return _this[key].destroy(); });
        };
        return Scroller;
    }());

    var propertiesConfig = [
        {
            sourceKey: 'scroller.scrollBehaviorX.currentPos',
            key: 'x'
        },
        {
            sourceKey: 'scroller.scrollBehaviorY.currentPos',
            key: 'y'
        },
        {
            sourceKey: 'scroller.scrollBehaviorX.hasScroll',
            key: 'hasHorizontalScroll'
        },
        {
            sourceKey: 'scroller.scrollBehaviorY.hasScroll',
            key: 'hasVerticalScroll'
        },
        {
            sourceKey: 'scroller.scrollBehaviorX.contentSize',
            key: 'scrollerWidth'
        },
        {
            sourceKey: 'scroller.scrollBehaviorY.contentSize',
            key: 'scrollerHeight'
        },
        {
            sourceKey: 'scroller.scrollBehaviorX.maxScrollPos',
            key: 'maxScrollX'
        },
        {
            sourceKey: 'scroller.scrollBehaviorY.maxScrollPos',
            key: 'maxScrollY'
        },
        {
            sourceKey: 'scroller.scrollBehaviorX.minScrollPos',
            key: 'minScrollX'
        },
        {
            sourceKey: 'scroller.scrollBehaviorY.minScrollPos',
            key: 'minScrollY'
        },
        {
            sourceKey: 'scroller.scrollBehaviorX.movingDirection',
            key: 'movingDirectionX'
        },
        {
            sourceKey: 'scroller.scrollBehaviorY.movingDirection',
            key: 'movingDirectionY'
        },
        {
            sourceKey: 'scroller.scrollBehaviorX.direction',
            key: 'directionX'
        },
        {
            sourceKey: 'scroller.scrollBehaviorY.direction',
            key: 'directionY'
        },
        {
            sourceKey: 'scroller.actions.enabled',
            key: 'enabled'
        },
        {
            sourceKey: 'scroller.animater.pending',
            key: 'pending'
        },
        {
            sourceKey: 'scroller.animater.stop',
            key: 'stop'
        },
        {
            sourceKey: 'scroller.scrollTo',
            key: 'scrollTo'
        },
        {
            sourceKey: 'scroller.scrollBy',
            key: 'scrollBy'
        },
        {
            sourceKey: 'scroller.scrollToElement',
            key: 'scrollToElement'
        },
        {
            sourceKey: 'scroller.resetPosition',
            key: 'resetPosition'
        }
    ];

    var BScroll = /** @class */ (function (_super) {
        __extends(BScroll, _super);
        function BScroll(el, options) {
            var _this = _super.call(this, [
                'refresh',
                'enable',
                'disable',
                'beforeScrollStart',
                'scrollStart',
                'scroll',
                'scrollEnd',
                'scrollCancel',
                'touchEnd',
                'flick',
                'destroy'
            ]) || this;
            var wrapper = getElement(el);
            if (!wrapper) {
                warn('Can not resolve the wrapper DOM.');
                return _this;
            }
            var content = wrapper.children[0];
            if (!content) {
                warn('The wrapper need at least one child element to be scroller.');
                return _this;
            }
            _this.plugins = {};
            _this.options = new Options().merge(options).process();
            _this.hooks = new EventEmitter([
                'init',
                'refresh',
                'enable',
                'disable',
                'destroy'
            ]);
            _this.init(wrapper);
            return _this;
        }
        BScroll.use = function (ctor) {
            var name = ctor.pluginName;
            var installed = this.plugins.some(function (plugin) { return ctor === plugin.ctor; });
            if (installed)
                return this;
            if (isUndef(name)) {
                warn("Plugin Class must specify plugin's name in static property by 'pluginName' field.");
                return this;
            }
            if (this.pluginsMap[name]) {
                warn("This plugin has been registered, maybe you need change plugin's name");
                return this;
            }
            this.pluginsMap[name] = true;
            this.plugins.push({
                name: name,
                applyOrder: ctor.applyOrder,
                ctor: ctor
            });
            return this;
        };
        BScroll.prototype.init = function (wrapper) {
            this.wrapper = wrapper;
            wrapper.isBScrollContainer = true;
            this.scroller = new Scroller(wrapper, this.options);
            this.eventBubbling();
            this.handleAutoBlur();
            this.innerRefresh();
            this.scroller.scrollTo(this.options.startX, this.options.startY);
            this.enable();
            this.proxy(propertiesConfig);
            this.applyPlugins();
        };
        BScroll.prototype.applyPlugins = function () {
            var _this = this;
            var options = this.options;
            this.constructor.plugins
                .sort(function (a, b) {
                var _a;
                var applyOrderMap = (_a = {},
                    _a["pre" /* Pre */] = -1,
                    _a["post" /* Post */] = 1,
                    _a);
                var aOrder = a.applyOrder ? applyOrderMap[a.applyOrder] : 0;
                var bOrder = b.applyOrder ? applyOrderMap[b.applyOrder] : 0;
                return aOrder - bOrder;
            })
                .forEach(function (item) {
                var ctor = item.ctor;
                if (options[item.name] && typeof ctor === 'function') {
                    _this.plugins[item.name] = new ctor(_this);
                }
            });
        };
        BScroll.prototype.handleAutoBlur = function () {
            if (this.options.autoBlur) {
                this.on(this.eventTypes.beforeScrollStart, function () {
                    var activeElement = document.activeElement;
                    if (activeElement &&
                        (activeElement.tagName === 'INPUT' ||
                            activeElement.tagName === 'TEXTAREA')) {
                        activeElement.blur();
                    }
                });
            }
        };
        BScroll.prototype.eventBubbling = function () {
            bubbling(this.scroller.hooks, this, [
                'beforeScrollStart',
                'scrollStart',
                'scroll',
                'scrollEnd',
                'scrollCancel',
                'touchEnd',
                'flick'
            ]);
        };
        BScroll.prototype.innerRefresh = function () {
            this.scroller.refresh();
            this.hooks.trigger(this.hooks.eventTypes.refresh);
            this.trigger(this.eventTypes.refresh);
        };
        BScroll.prototype.proxy = function (propertiesConfig) {
            var _this = this;
            propertiesConfig.forEach(function (_a) {
                var key = _a.key, sourceKey = _a.sourceKey;
                propertiesProxy(_this, sourceKey, key);
            });
        };
        BScroll.prototype.refresh = function () {
            this.innerRefresh();
            this.scroller.resetPosition();
        };
        BScroll.prototype.enable = function () {
            this.scroller.enable();
            this.hooks.trigger(this.hooks.eventTypes.enable);
            this.trigger(this.eventTypes.enable);
        };
        BScroll.prototype.disable = function () {
            this.scroller.disable();
            this.hooks.trigger(this.hooks.eventTypes.disable);
            this.trigger(this.eventTypes.disable);
        };
        BScroll.prototype.destroy = function () {
            this.hooks.trigger(this.hooks.eventTypes.destroy);
            this.trigger(this.eventTypes.destroy);
            this.scroller.destroy();
        };
        BScroll.prototype.eventRegister = function (names) {
            this.registerType(names);
        };
        BScroll.plugins = [];
        BScroll.pluginsMap = {};
        return BScroll;
    }(EventEmitter));

    exports.Behavior = Behavior;
    exports.Options = Options;
    exports.default = BScroll;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
if(typeof window !== "undefined" && window.BScroll) { 
  window.BScroll = window.BScroll.default;
}
