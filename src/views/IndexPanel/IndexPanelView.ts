import { StringConvertible } from "@talla-ui/util";
import {
	$bind,
	$either,
	$list,
	$strf,
	$view,
	app,
	ObservedList,
	ObservedObject,
	ui,
	UIComponent,
	UIListViewEvent,
} from "talla-ui";
import icons from "../icons";
import { getViewForElement } from "../ViewPickerPanel/ViewPickerPanelView";

class InspectableObjectItem extends ObservedObject {
	label?: string;
	object?: unknown;
}

const FoldView = UIComponent.define(
	{ title: StringConvertible.EMPTY, folded: false },
	(_, ...content) =>
		ui.cell(
			{ grow: false, padding: { bottom: 8 } },
			ui.cell(
				{
					textColor: ui.color.PRIMARY,
					style: {
						cursor: "pointer",
						borderThickness: { bottom: 1 },
						borderColor: ui.color.TEXT.alpha(0.3),
					},
				},
				ui.row(
					{
						padding: { x: 6, y: 8 },
						onClick: "ToggleFold",
					},
					ui.image({
						icon: $view("folded").select(
							ui.icon.CHEVRON_NEXT,
							ui.icon.CHEVRON_DOWN,
						),
					}),
					ui.label({ text: $view("title"), bold: true }),
				),
			),
			ui.show({ when: $view.not("folded") }, ui.cell(...content)),
		),
	(v) => ({
		ToggleFold() {
			v.folded = !v.folded;
		},
	}),
);

const InfoDetailRow = UIComponent.define(
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
				cursor: "pointer",
				borderThickness: { bottom: 1 },
				borderColor: ui.color.SEPARATOR,
			},
		},
		ui.row(
			ui.label($view("label"), {
				hidden: $view.not("label"),
				fontSize: 12,
				width: 120,
			}),
			ui.label($view("value").or($view("showNone").select("<none>")), {
				fontSize: 12,
				dim: $view.not("value"),
				grow: true,
			}),
			ui.image({
				hidden: $view.not("chevron"),
				icon: ui.icon.CHEVRON_NEXT,
				height: 20,
			}),
		),
	),
);

export class IndexPanelView extends UIComponent {
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
							style: { cursor: "pointer" },
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
								$strf(
									"%i message#{/s}, %i error%2${plural||s}",
									$bind("log.numMessages"),
									$bind("log.numErrors"),
								),
								{ fontSize: 12 },
							),
						),
					),
				),

				ui.use(
					FoldView,
					{ title: "Activities" },
					ui.list(
						{ items: $view("activities") },
						ui.use(InfoDetailRow, {
							value: $list("item.label"),
							chevron: true,
							onClick: "InspectActivity",
						}),
					),
				),

				ui.use(
					FoldView,
					{ title: "Views" },
					ui.list(
						{ items: $view("views") },
						ui.use(InfoDetailRow, {
							value: $list("item.label"),
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
							value: $view("navigation.pageId"),
							showNone: true,
							onClick: "ShowNavigation",
						}),
						ui.use(InfoDetailRow, {
							label: "... detail",
							value: $view("navigation.detail"),
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
							value: $view("viewport.width"),
						}),
						ui.use(InfoDetailRow, {
							label: "Height",
							value: $view("viewport.height"),
						}),
						ui.use(InfoDetailRow, {
							label: "Aspect",
							value: $view("viewport.portrait").select("Portrait", "Landscape"),
						}),
						ui.use(InfoDetailRow, {
							label: "Cols",
							value: $either(
								$view("viewport.col5").select("5+"),
								$view("viewport.col4").select("4"),
								$view("viewport.col3").select("3"),
								$view("viewport.col2").select("2"),
							).else("1"),
						}),
						ui.use(InfoDetailRow, {
							label: "Rows",
							value: $either(
								$view("viewport.row5").select("5+"),
								$view("viewport.row4").select("4"),
								$view("viewport.row3").select("3"),
								$view("viewport.row2").select("2"),
							).else("1"),
						}),
					),
				),
				ui.cell({
					hidden: $bind("docked"),
					effect: ui.effect("DragModal"),
				}),
			),
		);
	}

	navigation = app.navigation;
	viewport = app.renderer?.viewport;
	activities = new ObservedList<InspectableObjectItem>();
	views = new ObservedList<InspectableObjectItem>();

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
					let parentObject = ObservedObject.whence(view);
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
