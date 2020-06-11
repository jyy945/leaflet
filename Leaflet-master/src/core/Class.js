import * as Util from './Util';

// @class Class
// @aka L.Class

// @section
// @uninheritable

// Thanks to John Resig and Dean Edwards for inspiration!


export function Class() {}

// 对象继承，使用原型链继承，其中__super__指向父类的原型对象，_initHooks保存初始化钩子函数数组，
// 父类中的静态方法和属性会被子类继承，props中的方法会保存到子类的原型对象中
Class.extend = function (props) {

    // 创建构造函数
	var NewClass = function () {

		// 调用自身的initialize方法
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}

		// 调用父类的init hook函数
		this.callInitHooks();
	};


	var parentProto = NewClass.__super__ = this.prototype;  // 父类的原型对象
	var proto = Util.create(parentProto);   // 新创建NewClass的原型对象，其原型对象是当前对象的原型
    // 原型链继承
	proto.constructor = NewClass;
	NewClass.prototype = proto;

    // 继承父类的静态方法
	for (var i in this) {
		if (Object.prototype.hasOwnProperty.call(this, i) && i !== 'prototype' && i !== '__super__') {
			NewClass[i] = this[i];
		}
	}

    // 将props中statics的属性合并到NewClass中
	if (props.statics) {
		Util.extend(NewClass, props.statics);
		delete props.statics;
	}

	// 将props中的includes和proto进行合并
	if (props.includes) {
		checkDeprecatedMixinEvents(props.includes); // 检查是否包含被舍弃的L.Mixin.Events，若有则警告
		Util.extend.apply(null, [proto].concat(props.includes));    // 将includes和proto进行合并
		delete props.includes;
	}

	// 合并proto和props中的options
	if (proto.options) {
		props.options = Util.extend(Util.create(proto.options), props.options);
	}

	// 将props中的属性和proto进行合并
	Util.extend(proto, props);

	proto._initHooks = [];

	// 将callinithooks放入子类的原型对象中，在字类执行构造函数时执行
	proto.callInitHooks = function () {
        // 用于标记是否已经执行了初始化钩子函数，仅执行一次
		if (this._initHooksCalled) { return; }
        // 首先执行父类的callInitHooks函数
		if (parentProto.callInitHooks) {
			parentProto.callInitHooks.call(this);
		}

		this._initHooksCalled = true;   // 初始化钩子函数标记为已执行，防止重复初始化

        // 调用_initHooks初始化钩子函数数组中所有的钩子函数
		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
			proto._initHooks[i].call(this);
		}
	};

	return NewClass;
};


// 向原型对象中添加属性
Class.include = function (props) {
	Util.extend(this.prototype, props);
	return this;
};

// 将options和对象原型的options合并
Class.mergeOptions = function (options) {
	Util.extend(this.prototype.options, options);
	return this;
};

// @function addInitHook(fn: Function): this
// Adds a [constructor hook](#class-constructor-hooks) to the class.
// 添加初始化钩子
Class.addInitHook = function (fn) { // (Function) || (String, args...)
	var args = Array.prototype.slice.call(arguments, 1);

	var init = typeof fn === 'function' ? fn : function () {
		this[fn].apply(this, args);
	};

	this.prototype._initHooks = this.prototype._initHooks || [];
	this.prototype._initHooks.push(init);
	return this;
};

function checkDeprecatedMixinEvents(includes) {
	if (typeof L === 'undefined' || !L || !L.Mixin) { return; }

	includes = Util.isArray(includes) ? includes : [includes];

	for (var i = 0; i < includes.length; i++) {
		if (includes[i] === L.Mixin.Events) {
			console.warn('Deprecated include of L.Mixin.Events: ' +
				'this property will be removed in future releases, ' +
				'please inherit from L.Evented instead.', new Error().stack);
		}
	}
}
