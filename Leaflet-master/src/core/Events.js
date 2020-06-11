import {Class} from './Class';
import * as Util from './Util';

/*
 * @class Evented
 * @aka L.Evented
 * @inherits Class
 *
 * A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
 *
 * @example
 *
 * ```js
 * map.on('click', function(e) {
 * 	alert(e.latlng);
 * } );
 * ```
 *
 * Leaflet deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
 *
 * ```js
 * function onClick(e) { ... }
 *
 * map.on('click', onClick);
 * map.off('click', onClick);
 * ```
 */

export var Events = {
	// 添加监听事件，types：{mouseclick: fn, dbclick: fn} 或者："mouseclick dbclick"
	on: function (types, fn, context) {

		// types为对象，{事件名称：回调}
		if (typeof types === 'object') {
			for (var type in types) {
				this._on(type, types[type], fn);
			}

		} else {
			// 用空格分割事件名称
			types = Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._on(types[i], fn, context);
			}
		}

		return this;
	},


	// 移除事件，若未设置任何参数，则删除该对象所有的事件。若fn未设置，则删除对象中所有的type事件
	off: function (types, fn, context) {
		// 若不存在参数，则表示该对象中所有的注册事件
		if (!types) {
			delete this._events;
		// 若types为对象,types：{mouseclick: fn, dbclick: fn}，则移除types中对应的事件
		} else if (typeof types === 'object') {
			for (var type in types) {
				this._off(type, types[type], fn);
			}
		} else {
			// 删除多个事件
			types = Util.splitWords(types);
			for (var i = 0, len = types.length; i < len; i++) {
				this._off(types[i], fn, context);
			}
		}

		return this;
	},

	// 注册监听事件
	_on: function (type, fn, context) {
		// 事件缓存，实例结构：
		// {
		// 		"mouseclick": [
		// 			{
		// 				fn: function one(){...}
		//				ctx: obj1
		// 			},
		//			{
		//				fn: function two(){...}
		//				ctx: obj2
		//			}
		//			...
		// 		],
		//		"dbclick": ....
		// }
		this._events = this._events || {};

		var typeListeners = this._events[type];	// 获取对象中其他注册的该事件的回调函数
		// 若对象中未曾设置过相同事件名称，则保存其回调函数
		if (!typeListeners) {
			typeListeners = [];
			this._events[type] = typeListeners;
		}

		if (context === this) {
			// Less memory footprint.
			context = undefined;
		}
		var newListener = {fn: fn, ctx: context},	// 事件监听对象
		    listeners = typeListeners;

		// check if fn already there
		// 查看是否已经注册了相同的事件，若存在则返回，否则将其添加到事件数组中
		for (var i = 0, len = listeners.length; i < len; i++) {
			if (listeners[i].fn === fn && listeners[i].ctx === context) {
				return;
			}
		}

		listeners.push(newListener);
	},

	// 移除事件， 若未设置fn则删除所有的type事件。，否则删除对应的事件
	_off: function (type, fn, context) {
		var listeners, i, len;
		// 若对象未曾注册过事件，则返回
		if (!this._events) { return; }

		listeners = this._events[type];	// 获取事件名称为type的所有的事件对象
		// 若未曾注册过该该事件，则返回
		if (!listeners) {
			return;
		}
		// 若没有传递回调函数参数，因为闭包的原因，需要将对应的保存的所有的事件对象的回调函数设置为false，避免执行。
		// 同时删除该事件所有的事件对象
		if (!fn) {
			// Set all removed listeners to noop so they are not called if remove happens in fire
			for (i = 0, len = listeners.length; i < len; i++) {
				listeners[i].fn = Util.falseFn;
			}
			// clear all listeners for a type if function isn't specified
			delete this._events[type];
			return;
		}

		if (context === this) {
			context = undefined;
		}

		// 若fn和context参数存在，则表示需要删除单个事件对象，需要保证fn和contex都相同，才能删除
		if (listeners) {
			for (i = 0, len = listeners.length; i < len; i++) {
				var l = listeners[i];
				if (l.ctx !== context) { continue; }
				if (l.fn === fn) {
					l.fn = Util.falseFn;
					// 如果该事件已经触发且还未完成执行，则将该事件数组重新复制，这样正在执行所需的回调不是同一个对象，可以保证_events的安全操作
					if (this._firingCount) {
						/* copy array in case events are being fired */
						this._events[type] = listeners = listeners.slice();
					}
					listeners.splice(i, 1);

					return;
				}
			}
		}
	},

	// 触发对象中的所有type事件，若设置了propagate则触发父对象的type事件
	fire: function (type, data, propagate) {
		if (!this.listens(type, propagate)) { return this; }	// 检查是否注册了type事件

		// 构建回调函数中参数事件对象
		var event = Util.extend({}, data, {
			type: type,
			target: this,
			sourceTarget: data && data.sourceTarget || this
		});

		if (this._events) {
			var listeners = this._events[type];

			// _firingCount用于防止触发事件未执行完成同时删除该事件。
			// _firingCound表示正在执行的回调函数的个数，当为0时表示没有正在执行的事件。可以直接删除，否则需要将_events进行复制，防止删除掉需要回调的对象
			if (listeners) {
				this._firingCount = (this._firingCount + 1) || 1;
				// 执行对象注册的所有该事件的回调函数
				for (var i = 0, len = listeners.length; i < len; i++) {
					var l = listeners[i];
					l.fn.call(l.ctx || this, event);
				}

				this._firingCount--;
			}
		}

		// 若设置了propagate，则表示需要冒泡到父对象，父对象中的对应的事件需要执行
		if (propagate) {
			this._propagateEvent(event);
		}

		return this;
	},

	// 检查是否注册事件名称为type的事件
	// 若设置了propagate，则还要检查对象的父对象的事件注册，若该对象和父对象都没有找到该事件，则返回false
	//
	listens: function (type, propagate) {
		var listeners = this._events && this._events[type];
		if (listeners && listeners.length) { return true; }

		if (propagate) {
			// also check parents for listeners if event propagates
			for (var id in this._eventParents) {
				if (this._eventParents[id].listens(type, propagate)) { return true; }
			}
		}
		return false;
	},

	// 触发一次事件。内部会注册一个同名称的事件，但回调函数为移除这两个监听
	once: function (types, fn, context) {

		if (typeof types === 'object') {
			for (var type in types) {
				this.once(type, types[type], fn);
			}
			return this;
		}

		// 设置执行一次之后的回调函数，其内部为移除该事件。需要移除监听的用户事件和监听的移除回调
		var handler = Util.bind(function () {
			this
			    .off(types, fn, context)
			    .off(types, handler, context);
		}, this);

		// 添加两个监听，一个为触发后执行用户回调，一个为触发后执行移除事件的回调
		return this
		    .on(types, fn, context)
		    .on(types, handler, context);
	},

	// @method addEventParent(obj: Evented): this
	// Adds an event parent - an `Evented` that will receive propagated events
	// TODO
	addEventParent: function (obj) {
		this._eventParents = this._eventParents || {};
		this._eventParents[Util.stamp(obj)] = obj;
		return this;
	},

	// @method removeEventParent(obj: Evented): this
	// Removes an event parent, so it will stop receiving propagated events
	// TODO
	removeEventParent: function (obj) {
		if (this._eventParents) {
			delete this._eventParents[Util.stamp(obj)];
		}
		return this;
	},

	// 冒泡触发执行事件
	_propagateEvent: function (e) {
		// 遍历父对象的事件对象，触发对应的事件
		for (var id in this._eventParents) {
			this._eventParents[id].fire(e.type, Util.extend({
				layer: e.target,
				propagatedFrom: e.target
			}, e), true);
		}
	}
};

// aliases; we should ditch those eventually

// @method addEventListener(…): this
// Alias to [`on(…)`](#evented-on)
Events.addEventListener = Events.on;

// @method removeEventListener(…): this
// Alias to [`off(…)`](#evented-off)

// @method clearAllEventListeners(…): this
// Alias to [`off()`](#evented-off)
Events.removeEventListener = Events.clearAllEventListeners = Events.off;

// @method addOneTimeEventListener(…): this
// Alias to [`once(…)`](#evented-once)
Events.addOneTimeEventListener = Events.once;

// @method fireEvent(…): this
// Alias to [`fire(…)`](#evented-fire)
Events.fireEvent = Events.fire;

// @method hasEventListeners(…): Boolean
// Alias to [`listens(…)`](#evented-listens)
Events.hasEventListeners = Events.listens;

export var Evented = Class.extend(Events);
