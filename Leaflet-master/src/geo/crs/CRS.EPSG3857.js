import {Earth} from './CRS.Earth';
import {SphericalMercator} from '../projection/Projection.SphericalMercator';
import {toTransformation} from '../../geometry/Transformation';
import * as Util from '../../core/Util';

// 通用的crs，使用球体墨卡托投影
export var EPSG3857 = Util.extend({}, Earth, {
	code: 'EPSG:3857',
	projection: SphericalMercator,	// 投影设置为球体墨卡托投影

	transformation: (function () {
		var scale = 0.5 / (Math.PI * SphericalMercator.R);
		return toTransformation(scale, 0.5, -scale, 0.5);
	}())
});

export var EPSG900913 = Util.extend({}, EPSG3857, {
	code: 'EPSG:900913'
});
