import {Map} from '../Map';
import {Handler} from '../../core/Handler';

// 双击缩放处理器

Map.mergeOptions({
	// 是否可以通过双击地图来放大地图和通过双击来缩小地图，
	// 如果传递的是center，则无论鼠标在何处，双击缩放都将缩放到视图的中心
	doubleClickZoom: true
});

export var DoubleClickZoom = Handler.extend({
	addHooks: function () {
		// 向map注册双击事件
		this._map.on('dblclick', this._onDoubleClick, this);
	},

	removeHooks: function () {
		this._map.off('dblclick', this._onDoubleClick, this);
	},

	// 双击事件
	_onDoubleClick: function (e) {
		var map = this._map,
		    oldZoom = map.getZoom(),
		    delta = map.options.zoomDelta,
			// 若按住了shift按键则缩小地图，否则放大地图
		    zoom = e.originalEvent.shiftKey ? oldZoom - delta : oldZoom + delta;

		// 若配置项设置为center则调用setZoom，否则调用setZoomAround
		if (map.options.doubleClickZoom === 'center') {
			map.setZoom(zoom);
		} else {
			map.setZoomAround(e.containerPoint, zoom);
		}
	}
});

// 向map添加注册处理器初始化钩子函数
Map.addInitHook('addHandler', 'doubleClickZoom', DoubleClickZoom);
