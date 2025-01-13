import { $view, ui, UICell, ViewComposite } from "talla-ui";
import { ClickForegroundEffect } from "../ClickForegroundEffect";
import { InspectPanelView } from "../InspectPanel/InspectPanelView";
import icons from "../icons";

export class FloatOverlayView extends ViewComposite {
	protected defineView() {
		return ui.cell(
			{
				name: "WebToolsFloat",
				background: ui.color.BACKGROUND.alpha(0.8),
				borderRadius: 8,
				effect: ClickForegroundEffect,
				position: {
					gravity: "overlay",
					top: 32,
				},
				style: {
					width: 320,
					maxWidth: "90vw",
					height: 300,
					borderColor: ui.color.BACKGROUND.brighten(0.5),
					borderThickness: 2,
					css: {
						backdropFilter: "blur(15px)",
						boxShadow: "0 0 0 4px rgba(0,0,0,0.4)",
					},
				},
			},
			ui.cell(
				{
					style: { grow: 0 },
					background: ui.color.BACKGROUND,
					effect: ui.effect("DragModal"),
				},
				ui.row(
					{ padding: { start: 8, end: 4, y: 2 }, spacing: 4 },
					ui.label($view.string("title"), { bold: true }),
					ui.spacer(),
					ui.button({
						icon: icons.copy,
						iconSize: 20,
						style: ui.style.BUTTON_ICON,
						onClick: "Clone",
					}),
					ui.button({
						icon: ui.icon.CLOSE,
						iconSize: 16,
						style: ui.style.BUTTON_ICON,
						onClick: "Close",
					}),
				),
			),
			ui.separator({ margin: 0 }),
			ui.scroll(ui.renderView({ view: $view.bind("inspectView") })),
		);
	}

	title: string;
	inspectView = this.attach(new InspectPanelView(), { delegate: this });

	constructor(object?: unknown, title = "Inspect") {
		super();
		this.title = title;
		this.inspectView.setObject(object);
	}

	protected beforeRender() {
		let cell = this.body as UICell;
		let randX = (Math.random() * window.innerWidth) / 3 + 64;
		cell.position = {
			...cell.position,
			left: randX + "px",
			top: window.innerHeight / 3,
		};
	}

	protected onClone() {
		this.emit("ShowFloat", { object: this.inspectView.object });
	}

	protected onClose() {
		this.unlink();
	}
}
