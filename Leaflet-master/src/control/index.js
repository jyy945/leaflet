import {Control, control} from './Control'; // 包含map初始化配置
import {Layers, layers} from './Control.Layers';
import {Zoom, zoom} from './Control.Zoom';  // 包含map初始化配置
import {Scale, scale} from './Control.Scale';
import {Attribution, attribution} from './Control.Attribution'; // 包含map初始化配置

Control.Layers = Layers;
Control.Zoom = Zoom;
Control.Scale = Scale;
Control.Attribution = Attribution;

control.layers = layers;
control.zoom = zoom;
control.scale = scale;
control.attribution = attribution;

export {Control, control};
