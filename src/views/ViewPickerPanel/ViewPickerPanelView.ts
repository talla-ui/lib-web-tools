import { $bind, ui, View, UIComponent } from "talla-ui";
import icons from "../icons";

export function getViewForElement(elt?: Element) {
	while (elt) {
		for (let p in elt) {
			if (p.startsWith("Web__Handler_")) {
				let view = (elt as any)[p].observed;
				if (view instanceof View) return view;
			}
		}
		elt = elt.parentElement as any;
	}
}

export class ViewPickerPanelView extends UIComponent {
	protected defineView() {
		return ui.cell(
			{
				padding: 8,
			},
			ui.cell({
				hidden: $bind.boolean("docked"),
				effect: ui.effect("DragModal"),
			}),
			ui.label({
				icon: icons.selectElement,
				iconSize: 32,
				iconColor: ui.color.PRIMARY.alpha(0.8),
				align: "center",
			}),
			ui.spacer(0, 16),
			ui.label("Select a view to inspect", { dim: true, align: "center" }),
			ui.cell({
				hidden: $bind.boolean("docked"),
				effect: ui.effect("DragModal"),
			}),
		);
	}

	protected beforeRender() {
		this._mouseHandler = this.handleMouseEvent.bind(this);
		this.registerHandlers();
	}

	protected beforeUnlink() {
		this.stopHandlers();
	}

	protected registerHandlers() {
		window.addEventListener("mousemove", this._mouseHandler as any);
		window.addEventListener("mousedown", this._mouseHandler as any, true);
		window.addEventListener("mouseup", this._mouseHandler as any, true);
		window.addEventListener("click", this._mouseHandler as any, true);
	}

	protected stopHandlers() {
		window.removeEventListener("mousemove", this._mouseHandler as any);
		window.removeEventListener("mousedown", this._mouseHandler as any, true);
		window.removeEventListener("mouseup", this._mouseHandler as any, true);
		window.removeEventListener("click", this._mouseHandler as any, true);
	}

	protected handleMouseEvent(e: MouseEvent) {
		// find out which element is under the mouse
		let elt: any = document.elementFromPoint(e.clientX, e.clientY);
		let parentElt = elt;
		while (parentElt) {
			if (parentElt.dataset.name?.startsWith("WebTools")) return;
			parentElt = parentElt.parentElement;
		}
		e.preventDefault();
		e.stopPropagation();
		let view = getViewForElement(elt);
		if (view) {
			this.emit("HighlightView", { view });
			if (e.type === "mousedown") {
				this.emit("InspectObject", { object: view });
			}
			if (e.type === "click") {
				this.stopHandlers();
				this.emit("InspectObject", { object: view });
				this.emit("ClearPicker");
			}
			return false;
		}
	}

	private _mouseHandler?: Function;
}
