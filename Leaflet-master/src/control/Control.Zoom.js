
import {Control} from './Control';
import {Map} from '../map/Map';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

/*
 * @class Control.Zoom
 * @aka L.Control.Zoom
 * @inherits Control
 *
 * A basic zoom control with two buttons (zoom in and zoom out). It is put on the map by default unless you set its [`zoomControl` option](#map-zoomcontrol) to `false`. Extends `Control`.
 */

export var Zoom = Control.extend({
	// @section
	// @aka Control.Zoom options
	options: {
		position: 'topleft',

		// 放大按键文本
		zoomInText: '+',

		// 放大按键的提示信息
		zoomInTitle: 'Zoom in',
		// 缩小按键的文本：-
		zoomOutText: '&#x2212;',
		// 缩小按键的提示信息
		zoomOutTitle: 'Zoom out'
	},

	// 创建缩放控件dom元素以及注册相关的事件监听
	onAdd: function (map) {
		var zoomName = 'leaflet-control-zoom',
		    container = DomUtil.create('div', zoomName + ' leaflet-bar'),
		    options = this.options;

		// 创建放大按键dom元素
		this._zoomInButton  = this._createButton(options.zoomInText, options.zoomInTitle,
		        zoomName + '-in',  container, this._zoomIn);
		// 创建缩小按键的dom元素
		this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
		        zoomName + '-out', container, this._zoomOut);

		this._updateDisabled();	// 更新按键的显示状态，点击和不可点击状态
		// 在map上注册事件，控制按键的显示状态
		map.on('zoomend zoomlevelschange', this._updateDisabled, this);

		return container;
	},

	// 注销在map节点上注册的事件
	onRemove: function (map) {
		map.off('zoomend zoomlevelschange', this._updateDisabled, this);
	},

	disable: function () {
		this._disabled = true;
		this._updateDisabled();
		return this;
	},

	enable: function () {
		this._disabled = false;
		this._updateDisabled();
		return this;
	},

	// 点击放大按键的回调
	_zoomIn: function (e) {
		if (!this._disabled && this._map._zoom < this._map.getMaxZoom()) {
			this._map.zoomIn(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
		}
	},

	// 点击缩小按键的回调
	_zoomOut: function (e) {
		if (!this._disabled && this._map._zoom > this._map.getMinZoom()) {
			this._map.zoomOut(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
		}
	},

	// 创建按键dom元素
	_createButton: function (html, title, className, container, fn) {
		var link = DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		link.setAttribute('role', 'button');
		link.setAttribute('aria-label', title);

		DomEvent.disableClickPropagation(link);	// 禁止冒泡到父元素
		// 为按键注册点击事件，点击时禁止冒泡避免默认行为，然后执行fn，最后再次将焦点放在控件dom节点上
		DomEvent.on(link, 'click', DomEvent.stop);
		DomEvent.on(link, 'click', fn, this);
		DomEvent.on(link, 'click', this._refocusOnMap, this);

		return link;
	},

	// 更新按键的状态
	_updateDisabled: function () {
		var map = this._map,
		    className = 'leaflet-disabled';

		DomUtil.removeClass(this._zoomInButton, className);
		DomUtil.removeClass(this._zoomOutButton, className);

		// 若_disabled为true，或者zoom值达到zoom的范围，则禁止点击按键
		if (this._disabled || map._zoom === map.getMinZoom()) {
			DomUtil.addClass(this._zoomOutButton, className);
		}
		if (this._disabled || map._zoom === map.getMaxZoom()) {
			DomUtil.addClass(this._zoomInButton, className);
		}
	}
});

// 默认设置缩放控件
Map.mergeOptions({
	zoomControl: true
});

// 添加map初始化钩子，用于在初始化期间构建缩放控件
Map.addInitHook(function () {
	// 若配置项设置了zoomControl，则添加zoom控件
	if (this.options.zoomControl) {
		this.zoomControl = new Zoom();
		this.addControl(this.zoomControl);
	}
});

// @namespace Control.Zoom
// @factory L.control.zoom(options: Control.Zoom options)
// Creates a zoom control
export var zoom = function (options) {
	return new Zoom(options);
};
