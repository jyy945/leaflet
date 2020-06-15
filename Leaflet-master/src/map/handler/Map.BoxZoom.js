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
		map.on('unload', this._destroy, this);
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

	_destroy: function () {
		DomUtil.remove(this._pane);
		delete this._pane;
	},

	_resetState: function () {
		this._resetStateTimeout = 0;
		this._moved = false;
	},

	_clearDeferredResetState: function () {
		if (this._resetStateTimeout !== 0) {
			clearTimeout(this._resetStateTimeout);
			this._resetStateTimeout = 0;
		}
	},

	_onMouseDown: function (e) {
		if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

		// Clear the deferred resetState if it hasn't executed yet, otherwise it
		// will interrupt the interaction and orphan a box element in the container.
		this._clearDeferredResetState();
		this._resetState();

		DomUtil.disableTextSelection();
		DomUtil.disableImageDrag();

		this._startPoint = this._map.mouseEventToContainerPoint(e);

		DomEvent.on(document, {
			contextmenu: DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	_onMouseMove: function (e) {
		if (!this._moved) {
			this._moved = true;

			this._box = DomUtil.create('div', 'leaflet-zoom-box', this._container);
			DomUtil.addClass(this._container, 'leaflet-crosshair');

			this._map.fire('boxzoomstart');
		}

		this._point = this._map.mouseEventToContainerPoint(e);

		var bounds = new Bounds(this._point, this._startPoint),
		    size = bounds.getSize();

		DomUtil.setPosition(this._box, bounds.min);

		this._box.style.width  = size.x + 'px';
		this._box.style.height = size.y + 'px';
	},

	_finish: function () {
		if (this._moved) {
			DomUtil.remove(this._box);
			DomUtil.removeClass(this._container, 'leaflet-crosshair');
		}

		DomUtil.enableTextSelection();
		DomUtil.enableImageDrag();

		DomEvent.off(document, {
			contextmenu: DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	_onMouseUp: function (e) {
		if ((e.which !== 1) && (e.button !== 1)) { return; }

		this._finish();

		if (!this._moved) { return; }
		// Postpone to next JS tick so internal click event handling
		// still see it as "moved".
		this._clearDeferredResetState();
		this._resetStateTimeout = setTimeout(Util.bind(this._resetState, this), 0);

		var bounds = new LatLngBounds(
		        this._map.containerPointToLatLng(this._startPoint),
		        this._map.containerPointToLatLng(this._point));

		this._map
			.fitBounds(bounds)
			.fire('boxzoomend', {boxZoomBounds: bounds});
	},

	_onKeyDown: function (e) {
		if (e.keyCode === 27) {
			this._finish();
		}
	}
});

// 添加boxzoom处理器
Map.addInitHook('addHandler', 'boxZoom', BoxZoom);
