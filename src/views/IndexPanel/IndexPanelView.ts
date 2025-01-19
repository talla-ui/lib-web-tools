import {
	$list,
	$view,
	app,
	bind,
	ManagedList,
	ManagedObject,
	StringConvertible,
	ui,
	UIListViewEvent,
	ViewComposite,
} from "talla-ui";
import { getViewForElement } from "../ViewPickerPanel/ViewPickerPanelView";
import icons from "../icons";

class InspectableObjectItem extends ManagedObject {
	label?: string;
	object?: unknown;
}

class FoldView extends ViewComposite.define(
	{ title: StringConvertible.EMPTY, folded: false },
	(_, ...content) =>
		ui.cell(
			{ style: { grow: 0 }, padding: { bottom: 8 } },
			ui.cell(
				{
					textColor: ui.color.PRIMARY,
					style: {
						css: { cursor: "pointer" },
						borderThickness: { bottom: 1 },
						borderColor: ui.color.TEXT.alpha(0.3),
					},
				},
				ui.row(
					{
						padding: { x: 6, y: 8 },
						onClick: "ToggleFold",
					},
					ui.label({
						icon: $view
							.boolean("folded")
							.select(ui.icon.CHEVRON_NEXT, ui.icon.CHEVRON_DOWN),
					}),
					ui.label({ text: $view.bind("title"), bold: true }),
				),
			),
			ui.conditional({ state: $view.not("folded") }, ui.cell(...content)),
		),
) {
	onToggleFold() {
		this.folded = !this.folded;
	}
}

const InfoDetailRow = ViewComposite.define(
	{
		label: StringConvertible.EMPTY,
		value: undefined as unknown,
		showNone: false,
		chevron: false,
	},
	ui.cell(
		{
			padding: { x: 8, y: 4 },
			style: {
				height: 32,
				css: { cursor: "pointer" },
				borderThickness: { bottom: 1 },
				borderColor: ui.color.SEPARATOR,
			},
		},
		ui.row(
			ui.label($view.string("label"), {
				hidden: $view.not("label"),
				fontSize: 12,
				width: 120,
				style: { shrink: 0 },
			}),
			ui.label(
				$view.string("value").or($view.bind("showNone").select("<none>")),
				{
					fontSize: 12,
					dim: $view.not("value"),
					style: { grow: 1, shrink: 1 },
				},
			),
			ui.label({
				hidden: $view.not("chevron"),
				icon: ui.icon.CHEVRON_NEXT,
				iconSize: 20,
			}),
		),
	),
);

export class IndexPanelView extends ViewComposite {
	protected defineView() {
		return ui.cell(
			{ style: { shrink: 1 } },
			ui.scroll(
				ui.row(ui.label("Inspector", { fontSize: 16, bold: true, padding: 8 })),

				ui.use(
					FoldView,
					{ title: "Log" },
					ui.cell(
						{
							style: { css: { cursor: "pointer" } },
							onClick: "ShowConsole",
						},
						ui.row(
							{ padding: { x: 8, y: 4 } },
							ui.button({
								icon: icons.console,
								iconSize: 20,
								style: ui.style.BUTTON_ICON,
							}),
							ui.label(
								bind.strf(
									"%i message#{/s}, %i error%2${plural||s}",
									bind("log.numMessages"),
									bind("log.numErrors"),
								),
								{
									fontSize: 12,
									style: { grow: 1 },
								},
							),
						),
					),
				),

				ui.use(
					FoldView,
					{ title: "Activities" },
					ui.list(
						{ items: $view.list("activities") },
						ui.use(InfoDetailRow, {
							value: $list.bind("item.label"),
							chevron: true,
							onClick: "InspectActivity",
						}),
					),
				),

				ui.use(
					FoldView,
					{ title: "Views" },
					ui.list(
						{ items: $view.list("views") },
						ui.use(InfoDetailRow, {
							value: $list.bind("item.label"),
							chevron: true,
							onClick: "InspectView",
						}),
					),
				),

				ui.use(
					FoldView,
					{ title: "Navigation", folded: true },
					ui.column(
						ui.use(InfoDetailRow, {
							label: "Page ID",
							value: $view.string("navigation.pageId"),
							showNone: true,
							onClick: "ShowNavigation",
						}),
						ui.use(InfoDetailRow, {
							label: "... detail",
							value: $view.string("navigation.detail"),
							showNone: true,
							onClick: "ShowNavigation",
						}),
					),
				),

				ui.use(
					FoldView,
					{ title: "Viewport", folded: true },
					ui.column(
						ui.use(InfoDetailRow, {
							label: "Width",
							value: $view.string("viewport.width"),
						}),
						ui.use(InfoDetailRow, {
							label: "Height",
							value: $view.string("viewport.height"),
						}),
						ui.use(InfoDetailRow, {
							label: "Aspect",
							value: $view
								.boolean("viewport.portrait")
								.select("Portrait", "Landscape"),
						}),
						ui.use(InfoDetailRow, {
							label: "Cols",
							value: bind
								.either(
									$view.boolean("viewport.col5").select("5+"),
									$view.boolean("viewport.col4").select("4"),
									$view.boolean("viewport.col3").select("3"),
									$view.boolean("viewport.col2").select("2"),
								)
								.else("1"),
						}),
						ui.use(InfoDetailRow, {
							label: "Rows",
							value: bind
								.either(
									$view.boolean("viewport.row5").select("5+"),
									$view.boolean("viewport.row4").select("4"),
									$view.boolean("viewport.row3").select("3"),
									$view.boolean("viewport.row2").select("2"),
								)
								.else("1"),
						}),
					),
				),
				ui.cell({ hidden: bind("docked"), effect: ui.effect("DragModal") }),
			),
		);
	}

	navigation = app.navigation;
	viewport = app.renderer?.viewport;
	activities = new ManagedList<InspectableObjectItem>();
	views = new ManagedList<InspectableObjectItem>();

	protected beforeRender() {
		let updateInterval = setInterval(() => {
			if (this.isUnlinked()) {
				clearInterval(updateInterval);
				return;
			}
			this._updateViews();
			this._updateActivities();
		}, 1000);
		this._updateActivities();
		setTimeout(() => {
			this._updateViews();
		}, 10);
	}

	protected onShowNavigation() {
		this.emit("InspectObject", { object: this.navigation });
	}

	protected onInspectView(e: UIListViewEvent<InspectableObjectItem>) {
		let item = e.data.listViewItem;
		this.emit("InspectObject", { object: item?.object });
	}

	protected onInspectActivity(e: UIListViewEvent<InspectableObjectItem>) {
		let item = e.data.listViewItem;
		this.emit("InspectObject", { object: item?.object });
	}

	private _updateActivities() {
		let active: InspectableObjectItem[] = [];
		let inactive: InspectableObjectItem[] = [];
		for (let activity of app.activities) {
			let label = `<${activity.constructor.name}>`;
			if (activity.isActive()) label += " (Active)";
			if (activity.navigationPageId) {
				label += ` /${activity.navigationPageId}`;
			}
			if (activity.title) {
				label += " " + JSON.stringify(activity.title);
			}
			let item =
				this.activities.find((i) => i.object === activity) ||
				Object.assign(new InspectableObjectItem(), {
					label: activity.constructor.name,
					object: activity,
				});
			item.label = label;
			if (activity.isActive()) active.push(item);
			else inactive.push(item);
		}
		this.activities.replaceAll([...active, ...inactive]);
	}

	private _updateViews() {
		let rootElts = Array.from(document.body.children);
		let items: InspectableObjectItem[] = [];
		for (let root of rootElts) {
			let innerElts = Array.from(root.children);
			if (/OVERLAY/.test(String(root.nodeName))) {
				innerElts = innerElts.map((elt) => elt.firstElementChild!);
			}
			for (let inner of innerElts) {
				let view = getViewForElement(inner);
				if (view) {
					let label = `<${view.constructor.name}>`;
					if ("name" in view && view.name) {
						if (/WebTools/.test(view.name as string)) continue;
						label += " " + view.name;
					}
					let parentObject = ManagedObject.whence(view);
					if (parentObject) {
						label += ` (${parentObject.constructor.name})`;
					}
					let item =
						this.views.find((i) => i.object === view) ||
						Object.assign(new InspectableObjectItem(), { label, object: view });
					item.label = label;
					items.push(item);
				}
			}
		}
		this.views.replaceAll(items);
	}
}
