import {Class} from './Class';

// 处理器类
export var Handler = Class.extend({
	initialize: function (map) {
		this._map = map;
	},

	// 启动处理器
	enable: function () {
		if (this._enabled) { return this; }

		this._enabled = true;
		this.addHooks();	// 触发处理器实例的钩子函数
		return this;
	},

	// 关闭处理器
	disable: function () {
		if (!this._enabled) { return this; }
		this._enabled = false;
		this.removeHooks();	// 移除处理器实例的钩子函数
		return this;
	},

	// 处理器是否已经启动
	enabled: function () {
		return !!this._enabled;
	}

	// @section Extension methods
	// Classes inheriting from `Handler` must implement the two following methods:
	// @method addHooks()
	// Called when the handler is enabled, should add event hooks.
	// @method removeHooks()
	// Called when the handler is disabled, should remove the event hooks added previously.
});

// @section There is static function which can be called without instantiating L.Handler:
// @function addTo(map: Map, name: String): this
// Adds a new Handler to the given map with the given name.
Handler.addTo = function (map, name) {
	map.addHandler(name, this);
	return this;
};
