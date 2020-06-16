import {LatLng} from '../LatLng';
import {Bounds} from '../../geometry/Bounds';
import {Point} from '../../geometry/Point';

/**
 * 球体墨卡托投影，为EPSG:3857表示
 * @type {number}
 */
var earthRadius = 6378137;

// 球体的墨卡托投影
export var SphericalMercator = {

	R: earthRadius,	// 地球的半径
	MAX_LATITUDE: 85.0511287798,	// 最大的纬度

	// 经纬度转为投影坐标
	project: function (latlng) {
		var d = Math.PI / 180,
		    max = this.MAX_LATITUDE,
		    lat = Math.max(Math.min(max, latlng.lat), -max),
		    sin = Math.sin(lat * d);

		return new Point(
			this.R * latlng.lng * d,	// 范围为-PI*R ~ PI* R
			this.R * Math.log((1 + sin) / (1 - sin)) / 2);
	},

	// 投影坐标转换为经纬度
	unproject: function (point) {
		var d = 180 / Math.PI;

		return new LatLng(
			(2 * Math.atan(Math.exp(point.y / this.R)) - (Math.PI / 2)) * d,
			point.x * d / this.R);
	},

	// 完整底图的范围
	bounds: (function () {
		var d = earthRadius * Math.PI;
		return new Bounds([-d, -d], [d, d]);
	})()
};
