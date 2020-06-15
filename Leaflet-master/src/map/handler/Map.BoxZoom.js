import {Map} from '../Map';
import {Handler} from '../../core/Handler';
import * as Util from '../../core/Util';
import * as DomUtil from '../../dom/DomUtil';
import * as DomEvent from '../../dom/DomEvent';
import {LatLngBounds} from '../../geo/LatLngBounds';
import {Bounds} from '../../geometry/Bounds';

// 框选放大地图
Map.mergeOptions({
	// 默认通过按住Shift键的同时拖动鼠标，地图是否可以缩放到指定的矩形区域
	boxZoom: true
});

export var BoxZoom = Handler.extend({
	initialize: function (map) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;
		this._resetStateTimeout = 0;
		map.on('unload', this._destroy, this);	// 向map注册卸载事件
	},

	addHooks: function () {
		DomEvent.on(this._container, 'mousedown', this._onMouseDown, this);
	},

	removeHooks: function () {
		DomEvent.off(this._container, 'mousedown', this._onMouseDown, this);
	},

	moved: function () {
		return this._moved;
	},

	// 销毁处理器
	_destroy: function () {
		DomUtil.remove(this._pane);
		delete this._pane;
	},

	// 重设处理器的状态
	_resetState: function () {
		this._resetStateTimeout = 0;
		this._moved = false;	// 标记鼠标未正在移动
	},

	// 清除上一次的操作
	_clearDeferredResetState: function () {
		if (this._resetStateTimeout !== 0) {
			clearTimeout(this._resetStateTimeout);
			this._resetStateTimeout = 0;
		}
	},

	// 鼠标按下回调
	_onMouseDown: function (e) {
		// 若未按下shift，或者鼠标按下的不是左键则退出
		if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

		this._clearDeferredResetState();	// 清除上一次的处理
		this._resetState();	// 重设处理器的状态

		DomUtil.disableTextSelection();	// 禁止文本被选择
		DomUtil.disableImageDrag();	// 禁止拖拽图片

		this._startPoint = this._map.mouseEventToContainerPoint(e);		// 将鼠标的屏幕位置转化为相对于container的点作为初始点

		// 注册其他相关事件
		DomEvent.on(document, {
			contextmenu: DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	// 按下shift并移动鼠标的事件
	_onMouseMove: function (e) {
		// 若_moved未false表示状态为为移动
		if (!this._moved) {
			this._moved = true;	// 标记鼠标正在移动

			// 创建zoom-box：绘制的矩形范围的dom元素
			this._box = DomUtil.create('div', 'leaflet-zoom-box', this._container);
			DomUtil.addClass(this._container, 'leaflet-crosshair');

			this._map.fire('boxzoomstart');
		}
		this._point = this._map.mouseEventToContainerPoint(e);	// 获取鼠标位置对应在container上的点
		// 根据原始点和当前点获取范围
		var bounds = new Bounds(this._point, this._startPoint),
		    size = bounds.getSize();
		DomUtil.setPosition(this._box, bounds.min);	// 设置box的位置
		// 设置box的宽高
		this._box.style.width  = size.x + 'px';
		this._box.style.height = size.y + 'px';
	},

	// 鼠标移动结束，收尾工作，删除dom元素和样式，注销事件
	_finish: function () {
		// 若_moved状态为true，移动状态，则删除对应的绘制图形dom元素以及删除container上的样式
		if (this._moved) {
			DomUtil.remove(this._box);
			DomUtil.removeClass(this._container, 'leaflet-crosshair');
		}
		DomUtil.enableTextSelection();	// 开启文字选择
		DomUtil.enableImageDrag();	// 开启图片可拖拽
		// 注销处理器中注册的事件
		DomEvent.off(document, {
			contextmenu: DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	// 鼠标抬起的事件
	_onMouseUp: function (e) {
		// 若所操作的不是左键， 则退出
		if ((e.which !== 1) && (e.button !== 1)) { return; }

		this._finish();	// 鼠标移动结束，收尾工作，删除dom元素和样式，注销事件

		if (!this._moved) { return; }
		// 恢复初始状态
		this._clearDeferredResetState();
		this._resetStateTimeout = setTimeout(Util.bind(this._resetState, this), 0);
		// 将最后绘制的举行范围转换为经纬度范围
		var bounds = new LatLngBounds(
		        this._map.containerPointToLatLng(this._startPoint),
		        this._map.containerPointToLatLng(this._point));

		// 将设置map的范围
		this._map
			.fitBounds(bounds)
			.fire('boxzoomend', {boxZoomBounds: bounds});	// 触发boxzoomend，未注册，用于插件开发
	},

	// 按键按下事件
	_onKeyDown: function (e) {
		// 若在拖动的过程中按下了ESC按键则取消绘制
		if (e.keyCode === 27) {
			this._finish();
		}
	}
});

// 添加boxzoom处理器
Map.addInitHook('addHandler', 'boxZoom', BoxZoom);
