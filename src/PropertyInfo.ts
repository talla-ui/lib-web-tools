import {
	ManagedList,
	LazyString,
	UIColor,
	UIComponent,
	ManagedObject,
	Activity,
	ViewComposite,
	UIContainer,
	UIButton,
	UILabel,
	UIConditionalView,
	UIListView,
	ActivityList,
	UIIconResource,
	View,
} from "talla-ui";

type PropertyMap = Map<string, (it: PropertyInfo) => PropertyInfo>;

const BUILTINS = new Map<Function, string[]>([
	[Activity, ["title", "view"]],
	[ViewComposite, ["body"]],
	[UIContainer, ["content"]],
	[UIButton, ["label", "icon"]],
	[UILabel, ["text", "icon"]],
	[UILabel, ["text", "icon"]],
	[UIConditionalView, ["state", "body"]],
	[UIListView, ["items"]],
]);

const PROMISE_PENDING = Symbol("PROMISE_PENDING");
const PROMISE_ERROR = Symbol("PROMISE_ERROR");
const _promiseValues = new WeakMap<Promise<any>, any>();
const _promiseErrors = new WeakMap<Promise<any>, any>();
function getPromiseValue(promise: Promise<any>) {
	if (!_promiseValues.has(promise)) {
		promise
			.then((value) => _promiseValues.set(promise, value))
			.catch((e) => {
				_promiseValues.set(promise, PROMISE_ERROR);
				_promiseErrors.set(promise, e);
			});
		_promiseValues.set(promise, PROMISE_PENDING);
	}
	return _promiseValues.get(promise);
}
function getPromiseError(promise: Promise<any>) {
	return _promiseErrors.get(promise);
}
function getPromiseStatus(promise: Promise<any>) {
	let value = getPromiseValue(promise);
	if (value === PROMISE_PENDING) return "(pending)";
	if (value === PROMISE_ERROR) return "(error)";
	return "(resolved)";
}

export class PropertyInfo extends ManagedObject {
	static getDisplayValue(value: any, ignoreObject?: boolean): string {
		// handle simple types first
		if (value === undefined) return "undefined";
		if (value === null) return "null";
		switch (typeof value) {
			case "object":
				break;
			case "function":
				return "<Function> " + String(value).split("\n")[0];
			case "string":
				return JSON.stringify(value);
			default:
				return value.toString();
		}

		// handle promises (using weak map)
		if (value instanceof Promise) {
			return "<Promise> " + getPromiseStatus(value);
		}

		// handle objects
		if (ignoreObject) return "...";
		if (Array.isArray(value)) {
			return "<Array> length = " + value.length;
		}
		if (value instanceof Map) {
			return "<Map> size = " + value.size;
		}
		if (value instanceof Date) {
			return "<Date> " + +value;
		}
		if (value instanceof ManagedList) {
			return "<ManagedList> count = " + value.count;
		}
		if (value instanceof LazyString) {
			return "<LazyString> " + value.toString();
		}
		if (value instanceof UIColor) {
			return "<UIColor> " + value.toString();
		}
		if (value instanceof UIComponent) {
			return (
				"<" +
				value.constructor.name +
				"> " +
				(value.hidden ? "(hidden) " : "") +
				String(
					(value as any).text ||
						(value as any).label ||
						(value as any).url ||
						"",
				)
			);
		}
		if (value instanceof Node) {
			return (
				`<${value.nodeName.toLowerCase()}>` +
				("className" in value ? " ." + value.className : "")
			);
		}
		if (Object.getPrototypeOf(value) === Object.prototype) {
			return (
				"{ " +
				Object.keys(value)
					.slice(0, 3)
					.map((k) => k + ": " + this.getDisplayValue(value[k], true))
					.join(", ") +
				(Object.keys(value).length > 3 ? ", ..." : "") +
				" }"
			);
		}
		return `<${value.constructor?.name || "object"}>`;
	}

	static getPropertyMap(value: unknown, forceObject?: boolean): PropertyMap {
		if (!forceObject) {
			if (value instanceof Promise) {
				return new Map([
					["status", (it) => it.setValue(getPromiseStatus(value))],
					["value", (it) => it.setValue(getPromiseValue(value))],
					["error", (it) => it.setValue(getPromiseError(value))],
				]);
			}
			if (
				Array.isArray(value) ||
				value instanceof Set ||
				value instanceof ManagedList ||
				value instanceof ActivityList
			) {
				return new Map(
					[...value].map((v, i) => [String(i), (it) => it.setValue(v)]),
				);
			}
			if (value instanceof Map) {
				return new Map(
					[...value].map(([k, v]) => [
						this.getDisplayValue(k),
						(it) => it.setValue(v),
					]),
				);
			}
			if (value instanceof Date) {
				return new Map([
					["value", (it) => it.setValue(+value, false, true)],
					["toDateString()", (it) => it.setValue(value.toDateString(), true)],
					["toTimeString()", (it) => it.setValue(value.toTimeString(), true)],
				]);
			}
			if (value instanceof UIColor) {
				return new Map([
					["toString()", (it) => it.setValue(value.toString(), true)],
				]);
			}
			if (value instanceof LazyString) {
				return new Map([
					["toString()", (it) => it.setValue(value.toString(), true)],
					["getOriginal()", (it) => it.setValue(value.getOriginal(), true)],
				]);
			}
			if (value instanceof UIIconResource) {
				return new Map([
					["toString()", (it) => it.setValue(value.toString(), true)],
					["isMirrorRtl()", (it) => it.setValue(value.isMirrorRTL(), true)],
				]);
			}
		}
		let result: PropertyMap = new Map();
		if (typeof value === "object" && value) {
			let isPrototype = false;
			let cur = value;
			while (cur) {
				let desc = Object.getOwnPropertyDescriptors(cur);
				let builtins: string[] | undefined;
				for (let [type, keys] of BUILTINS) {
					if (cur instanceof type) builtins = keys;
				}
				let native = cur instanceof Node;
				for (let key in native ? cur : desc) {
					let v = (value as any)[key];
					if (key === "constructor" && isPrototype) continue;
					let p = desc[key];
					let isPrivate = key[0] === "_" || (p && !p.enumerable);
					if (isPrototype) isPrivate = true;
					let isBuiltin = builtins?.includes(key);
					result.set(key, (it) => it.setValue(v, isPrivate, isBuiltin));
					if (
						(v instanceof ManagedList || v instanceof ActivityList) &&
						v.count &&
						v.count < 20
					) {
						let i = 0;
						for (let item of v) {
							result.set(key + "[" + i++ + "]", (it) =>
								it.setValue(item, isPrivate, isBuiltin, true),
							);
						}
					}
				}
				isPrototype = true;
				cur = Object.getPrototypeOf(cur);
				if (cur === Object.prototype || cur === ManagedObject.prototype) break;
			}
		}
		return result;
	}

	constructor(key: string | number = "") {
		super();
		key = this.key = String(key);
		this.private = key[0] === "_";
	}

	readonly key: string;
	value?: unknown;
	display = "";
	builtin?: boolean;
	private?: boolean;
	invalid?: boolean;
	isList?: boolean;
	listItem?: boolean;
	view?: View;

	setValue(
		value: any,
		isPrivate = this.private,
		isBuiltin = this.builtin,
		listItem?: boolean,
	) {
		if (value === PROMISE_PENDING) value = undefined;
		if (value === PROMISE_ERROR) value = undefined;
		this.value = value;
		this.display = PropertyInfo.getDisplayValue(value);
		this.private = isPrivate;
		this.builtin = isBuiltin;
		this.listItem = listItem;
		this.view =
			value instanceof View
				? value
				: value instanceof Activity
					? value.view
					: undefined;
		this.invalid = value instanceof ManagedObject && value.isUnlinked();
		return this;
	}
}
