
import {Class} from '../core/Class';
import {Map} from '../map/Map';
import * as Util from '../core/Util';
import * as DomUtil from '../dom/DomUtil';

/*
 * @class Control
 * @aka L.Control
 * @inherits Class
 *
 * L.Control is a base class for implementing map controls. Handles positioning.
 * All other controls extend from this class.
 */

export var Control = Class.extend({
	// @section
	// @aka Control options
	options: {
		// @option position: String = 'topright'
		// The position of the control (one of the map corners). Possible values are `'topleft'`,
		// `'topright'`, `'bottomleft'` or `'bottomright'`
		position: 'topright'
	},

	initialize: function (options) {
		Util.setOptions(this, options);
	},


	// 获取控件的位置信息
	getPosition: function () {
		return this.options.position;
	},

	// @method setPosition(position: string): this
	// Sets the position of the control.
	setPosition: function (position) {
		var map = this._map;

		if (map) {
			map.removeControl(this);
		}

		this.options.position = position;

		if (map) {
			map.addControl(this);
		}

		return this;
	},

	// 获取该控件对应的dom元素
	getContainer: function () {
		return this._container;
	},

	// 将控件添加到map
	addTo: function (map) {
		this.remove();
		this._map = map;

		var container = this._container = this.onAdd(map),	// 创建控件dom元素
		    pos = this.getPosition(),	// 获取控件的位置信息
		    corner = map._controlCorners[pos];	// map初始化中创建了四个corner元素，使用pos找到该dom元素

		DomUtil.addClass(container, 'leaflet-control');

		// 若pos包含bottom，则将corner节点放在父元素的尾部，否则放在头部
		if (pos.indexOf('bottom') !== -1) {
			corner.insertBefore(container, corner.firstChild);
		} else {
			corner.appendChild(container);
		}
		// 注册map的卸载监听事件，若map注销，则将
		this._map.on('unload', this.remove, this);

		return this;
	},

	// 移除控件
	remove: function () {
		if (!this._map) {
			return this;
		}

		DomUtil.remove(this._container);	// 删除该控件的dom节点

		// 若存在onRemove，则表示需要注销控件上已经在map节点上注册的事件监听
		if (this.onRemove) {
			this.onRemove(this._map);
		}

		this._map.off('unload', this.remove, this);	// 将map的unload事件注销
		this._map = null;

		return this;
	},

	_refocusOnMap: function (e) {
		// if map exists and event is not a keyboard event
		if (this._map && e && e.screenX > 0 && e.screenY > 0) {
			this._map.getContainer().focus();
		}
	}
});

export var control = function (options) {
	return new Control(options);
};

/* @section Extension methods
 * @uninheritable
 *
 * Every control should extend from `L.Control` and (re-)implement the following methods.
 *
 * @method onAdd(map: Map): HTMLElement
 * Should return the container DOM element for the control and add listeners on relevant map events. Called on [`control.addTo(map)`](#control-addTo).
 *
 * @method onRemove(map: Map)
 * Optional method. Should contain all clean up code that removes the listeners previously added in [`onAdd`](#control-onadd). Called on [`control.remove()`](#control-remove).
 */

// 向Map中添加操作控件方法
Map.include({
	// 将控件添加到map
	addControl: function (control) {
		control.addTo(this);
		return this;
	},

	// @method removeControl(control: Control): this
	// Removes the given control from the map
	removeControl: function (control) {
		control.remove();
		return this;
	},

	// 初始化四个corner节点，用于放置控件dom元素
	_initControlPos: function () {
		var corners = this._controlCorners = {},
		    l = 'leaflet-',
		    container = this._controlContainer =
		            DomUtil.create('div', l + 'control-container', this._container);

		function createCorner(vSide, hSide) {
			var className = l + vSide + ' ' + l + hSide;

			corners[vSide + hSide] = DomUtil.create('div', className, container);
		}

		createCorner('top', 'left');
		createCorner('top', 'right');
		createCorner('bottom', 'left');
		createCorner('bottom', 'right');
	},

	_clearControlPos: function () {
		for (var i in this._controlCorners) {
			DomUtil.remove(this._controlCorners[i]);
		}
		DomUtil.remove(this._controlContainer);
		delete this._controlCorners;
		delete this._controlContainer;
	}
});
