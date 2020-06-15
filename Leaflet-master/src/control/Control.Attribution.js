
import {Control} from './Control';
import {Map} from '../map/Map';
import * as Util from '../core/Util';
import * as DomEvent from '../dom/DomEvent';
import * as DomUtil from '../dom/DomUtil';


// 属性文本控件
export var Attribution = Control.extend({
	options: {
		position: 'bottomright',	// 默认显示位置为右下角
		prefix: '<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'	// 默认显示的属性文本前缀
	},

	initialize: function (options) {
		Util.setOptions(this, options);

		this._attributions = {};
	},

	// 创建属性文本控件dom元素
	onAdd: function (map) {
		map.attributionControl = this;
		this._container = DomUtil.create('div', 'leaflet-control-attribution');
		DomEvent.disableClickPropagation(this._container);	// 控制操作控件时防止事件冒泡到父元素

		// 获取map中的所有图层的属性文本
		for (var i in map._layers) {
			if (map._layers[i].getAttribution) {
				this.addAttribution(map._layers[i].getAttribution());
			}
		}

		this._update();	// 构建属性文本，并将其添加到属性文本控件dom元素中

		return this._container;
	},

	// 设置属性文本的前缀
	setPrefix: function (prefix) {
		this.options.prefix = prefix;
		this._update();
		return this;
	},

	// 添加图层的属性文本
	addAttribution: function (text) {
		if (!text) { return this; }

		if (!this._attributions[text]) {
			this._attributions[text] = 0;
		}
		this._attributions[text]++;

		this._update();	//构建属性文本，并将其添加到属性文本控件dom元素中

		return this;
	},

	// 将控件中对应的属性文本删除
	removeAttribution: function (text) {
		if (!text) { return this; }

		if (this._attributions[text]) {
			this._attributions[text]--;
			this._update();
		}

		return this;
	},

	// 构建属性文本，并将其添加到属性文本控件dom元素中，多个文本使用|分割
	_update: function () {
		if (!this._map) { return; }

		var attribs = [];

		for (var i in this._attributions) {
			if (this._attributions[i]) {
				attribs.push(i);
			}
		}

		var prefixAndAttribs = [];

		if (this.options.prefix) {
			prefixAndAttribs.push(this.options.prefix);
		}
		if (attribs.length) {
			prefixAndAttribs.push(attribs.join(', '));
		}

		this._container.innerHTML = prefixAndAttribs.join(' | ');
	}
});

// 默认设置属性控件
Map.mergeOptions({
	attributionControl: true
});

// map初始化钩子函数，用于构建属性文本控件
Map.addInitHook(function () {
	if (this.options.attributionControl) {
		new Attribution().addTo(this);
	}
});

// @namespace Control.Attribution
// @factory L.control.attribution(options: Control.Attribution options)
// Creates an attribution control.
export var attribution = function (options) {
	return new Attribution(options);
};
