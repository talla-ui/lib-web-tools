import {
	$list,
	$view,
	app,
	ObservedList,
	ObservedObject,
	ui,
	UIListViewEvent,
	UIScrollContainer,
	UIComponent,
	ViewEvent,
	$strf,
	$bind,
} from "talla-ui";
import { PropertyInfo } from "../../PropertyInfo";
import icons from "../icons";

const MAX_ITEMS = 500;

export class InspectPanelView extends UIComponent.define({
	object: undefined as unknown,
}) {
	protected defineView() {
		return ui.cell(
			{ name: "PropertyList", style: { shrink: 1 } },
			ui.cell(
				{ style: { grow: 0, maxHeight: 152 } },
				ui.scroll(
					{ onBeforeRender: "HistoryScrollRendered" },
					ui.list(
						{ items: $view.list("history") },
						ui.cell(
							{
								height: 32,
								grow: false,
								padding: { x: 8, y: 4 },
								background: $list("item.value")
									.equals($view("object"))
									.select(
										ui.color.PRIMARY.mix(ui.color.BACKGROUND, 0.75),
										ui.color.BACKGROUND.contrast(-0.1).alpha(0.5),
									),
								style: {
									borderThickness: { bottom: 1 },
									borderColor: ui.color.TEXT.alpha(0.5),
									css: { cursor: "pointer" },
								},
								onClick: "HistoryClick",
								onMouseEnter: "HighlightEnter",
								onMouseLeave: "HighlightLeave",
							},
							ui.row(
								ui.label({
									icon: $list("item.value")
										.equals($view("object"))
										.select(ui.icon.CHEVRON_DOWN, ui.icon.CHEVRON_NEXT),
									style: { shrink: 0 },
								}),
								ui.label($strf(".%s", $list.string("item.key")), {
									hidden: $list.not("item.key"),
									style: { shrink: 0 },
									fontSize: 12,
								}),
								ui.spacer(),
								ui.label($list.string("item.display"), {
									dim: true,
									fontSize: 12,
									style: $list
										.boolean("item.invalid")
										.select({ strikeThrough: true }),
								}),
							),
						),
					),
				),
			),
			ui.scroll(
				{ onBeforeRender: "PropertyScrollRendered" },
				ui.list(
					{ items: $view.list("properties") },
					ui.cell(
						{
							height: 32,
							grow: false,
							padding: { x: 8, y: 4 },
							style: {
								borderThickness: { bottom: 1 },
								borderColor: ui.color.SEPARATOR,
								css: { cursor: "pointer" },
							},
							background: $list
								.boolean("item.listItem")
								.select(ui.color.TEXT.alpha(0.05)),
							layout: {
								axis: "horizontal",
								gravity: "center",
								distribution: "start",
							},
							onClick: "PropertyClick",
							onMouseEnter: "HighlightEnter",
							onMouseLeave: "HighlightLeave",
						},
						ui.label({
							hidden: $list.not("item.isList"),
							icon: ui.icon.CHEVRON_DOWN,
							iconSize: 16,
							position: { gravity: "overlay", top: 4, start: 104 },
						}),
						ui.label({
							hidden: $list.not("item.view"),
							icon: icons.selectElement,
							iconSize: 16,
							iconColor: ui.color.PRIMARY.alpha(0.8),
							position: { gravity: "overlay", top: 4, end: 8 },
						}),
						ui.label($list.string("item.key"), {
							hidden: $list.boolean("item.listItem"),
							style: { width: 120, shrink: 0 },
							padding: { end: 8 },
							fontSize: 12,
							dim: $list.boolean("item.private"),
							bold: $list.boolean("item.builtin"),
						}),
						ui.label($list.string("item.display"), {
							style: $list
								.boolean("item.invalid")
								.select({ strikeThrough: true }),
							fontSize: 12,
							padding: $list.boolean("item.listItem").select({ start: 120 }),
							dim: $list.boolean("item.private").else(0.85),
						}),
					),
				),
				ui.cell(
					{
						hidden: $view("displayValue").matches(undefined),
						layout: { clip: true, gravity: "start", distribution: "start" },
						padding: 8,
					},
					ui.label("value", { bold: true, dim: true, fontSize: 12 }),
					ui.label($view.string("displayValue"), {
						style: {
							fontFamily: "monospace",
							fontSize: 12,
							userSelect: true,
							lineBreakMode: "pre-wrap",
							css: { wordBreak: "break-all" },
						},
					}),
				),
				ui.cell({
					hidden: $bind.boolean("docked"),
					effect: ui.effect("DragModal"),
					style: { shrink: 1 },
				}),
			),
		);
	}

	history = new ObservedList<PropertyInfo>();
	properties = new ObservedList<PropertyInfo>();
	displayValue?: string;

	setObject(object: unknown) {
		this.history.clear();
		this.object = object;
		this.update(true);
	}

	findHistory(type: { whence: (object: any) => any }) {
		if (!this.history.count) {
			this.history.add(new PropertyInfo().setValue(this.object));
		}
		let object = this.history.first()?.value || this.object;
		while (object) {
			object = type.whence(object);
			if (object) {
				let item = new PropertyInfo().setValue(object);
				this.history.insert(item, this.history.first());
			}
		}
		app.renderer?.schedule(() => this.fixScroll(), true);
	}

	protected beforeRender(): void {
		if (!this.history.count && this.object != null) {
			this.history.add(new PropertyInfo().setValue(this.object));
		}
		let h = setInterval(() => {
			if (this.isUnlinked()) clearInterval(h);
			else this.update();
		}, 200);
		this.update();
	}

	protected update(force?: boolean) {
		for (let item of this.history) {
			if (item.value instanceof ObservedObject && item.value.isUnlinked()) {
				item.invalid = true;
			}
		}

		let object = this.object;
		let builtins: PropertyInfo[] = [];
		let items: PropertyInfo[] = [];
		let privItems: PropertyInfo[] = [];
		if (typeof this.object === "object" && this.object !== null) {
			let existing = force
				? new Map<string, PropertyInfo>()
				: new Map(this.properties.map((i) => [i.key, i]));
			let map = PropertyInfo.getPropertyMap(object);
			let keys = [...map.keys()];
			let prev: PropertyInfo | undefined;
			for (let key of keys.slice(0, MAX_ITEMS)) {
				let item = existing.get(key) || new PropertyInfo(key);
				item = map.get(key)!(item);
				if (prev && !prev.listItem && item.listItem) prev.isList = true;
				let list = item.builtin ? builtins : item.private ? privItems : items;
				list.push(item);
				prev = item;
			}
			if (keys.length > MAX_ITEMS) {
				privItems.push(
					new PropertyInfo("..." + (keys.length - MAX_ITEMS) + " more"),
				);
			}
			if (keys.length === 0) {
				privItems.push(new PropertyInfo("<empty>"));
			}
		}
		this.properties.replaceAll([...builtins, ...items, ...privItems]);
		this.displayValue =
			typeof object !== "object" && typeof object !== "undefined"
				? String(object)
				: undefined;
	}

	protected onPropertyClick(e: UIListViewEvent<PropertyInfo>) {
		let item = e.data.listViewItem;
		if (!item) return;
		if (
			e.data.event instanceof MouseEvent &&
			(e.data.event.ctrlKey || e.data.event.metaKey)
		) {
			this.emit("ShowFloat", { object: item.value });
			return;
		}
		this.history.add(item);
		this.object = item.value;
		this.update(true);
		app.renderer?.schedule(() => this.fixScroll(), true);
	}

	protected onHistoryClick(e: UIListViewEvent<PropertyInfo>) {
		let item = e.data.listViewItem;
		if (!item) return;
		let found = false;
		for (let it of this.history) {
			if (found) this.history.remove(it);
			else if (it === item) found = true;
		}
		this.object = item.value;
		this.update(true);
		app.renderer?.schedule(() => this.fixScroll(), true);
	}

	protected onHighlightEnter(e: UIListViewEvent<PropertyInfo>) {
		let item = e.data.listViewItem;
		this.emit("HighlightView", { view: item?.view });
	}

	protected onHighlightLeave() {
		this.emit("HighlightView", { view: undefined });
	}

	protected fixScroll() {
		this._propertyScroll?.scrollToTop();
		this._historyScroll?.scrollToBottom();
	}

	protected onHistoryScrollRendered(e: ViewEvent<UIScrollContainer>) {
		this._historyScroll = e.source;
	}

	protected onPropertyScrollRendered(e: ViewEvent<UIScrollContainer>) {
		this._propertyScroll = e.source;
	}

	_historyScroll?: UIScrollContainer;
	_propertyScroll?: UIScrollContainer;
}
