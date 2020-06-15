import {CRS} from './CRS';
import * as Util from '../../core/Util';


// 地球的基本信息，并扩展了CRS的通用方法
export var Earth = Util.extend({}, CRS, {
	wrapLng: [-180, 180],

	// 球体半径的长度
	R: 6371000,

	// 计算经纬度之间的距离
	distance: function (latlng1, latlng2) {
		var rad = Math.PI / 180,
		    lat1 = latlng1.lat * rad,
		    lat2 = latlng2.lat * rad,
		    sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2),
		    sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2),
		    a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
		    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return this.R * c;
	}
});
