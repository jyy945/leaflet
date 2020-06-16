import {Point} from './Point';
import * as Util from '../core/Util';

// 投影坐标和像素坐标转换工具对象
export function Transformation(a, b, c, d) {
	if (Util.isArray(a)) {
		// use array properties
		this._a = a[0];
		this._b = a[1];
		this._c = a[2];
		this._d = a[3];
		return;
	}
	this._a = a;
	this._b = b;
	this._c = c;
	this._d = d;
}

Transformation.prototype = {
	// 将投影坐标转换为像素坐标
	transform: function (point, scale) {
		return this._transform(point.clone(), scale);
	},

	// 将投影坐标转换为像素坐标
	_transform: function (point, scale) {
		scale = scale || 1;
		point.x = scale * (this._a * point.x + this._b);
		point.y = scale * (this._c * point.y + this._d);
		return point;
	},

	// 像素坐标转换为投影坐标
	untransform: function (point, scale) {
		scale = scale || 1;
		return new Point(
		        (point.x / scale - this._b) / this._a,
		        (point.y / scale - this._d) / this._c);
	}
};

export function toTransformation(a, b, c, d) {
	return new Transformation(a, b, c, d);
}
