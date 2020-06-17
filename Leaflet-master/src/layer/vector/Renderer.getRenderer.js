import {Map} from '../../map/Map';
import {canvas} from './Canvas';
import {svg} from './SVG';

// 获取渲染器
Map.include({
	// 获取渲染器
	getRenderer: function (layer) {
		var renderer = layer.options.renderer || this._getPaneRenderer(layer.options.pane) || this.options.renderer || this._renderer;
		// 若还未设置面板对应的渲染器，则创建
		if (!renderer) {
			renderer = this._renderer = this._createRenderer();
		}
		// 查看是否已存在该渲染器，若无则添加到map
		if (!this.hasLayer(renderer)) {
			this.addLayer(renderer);
		}
		return renderer;
	},

	// 获取面板对应的渲染器
	_getPaneRenderer: function (name) {
		if (name === 'overlayPane' || name === undefined) {
			return false;
		}

		var renderer = this._paneRenderers[name];	// 获取对应的面板渲染器
		// 若未设置对应的面板渲染器则创建对应渲染器
		if (renderer === undefined) {
			renderer = this._createRenderer({pane: name});
			this._paneRenderers[name] = renderer;
		}
		return renderer;
	},

	// 创建渲染器
	_createRenderer: function (options) {
		// 若配置项中设置了preferCanvas则使用canvas，否则使用svg
		return (this.options.preferCanvas && canvas(options)) || svg(options);
	}
});
