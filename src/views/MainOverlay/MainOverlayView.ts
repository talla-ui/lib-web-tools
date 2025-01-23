import {
	Activity,
	ActivityList,
	app,
	ManagedEvent,
	UIButton,
	UIComponent,
	UIConditionalView,
	View,
	ViewComposite,
	ViewEvent,
} from "talla-ui";
import { LogModel } from "../../LogModel";
import { ConsoleOverlayView } from "../ConsoleOverlay/ConsoleOverlayView";
import { ClickForegroundEffect } from "../ClickForegroundEffect";
import { FloatOverlayView } from "../FloatOverlay/FloatOverlayView";
import { IndexPanelView } from "../IndexPanel/IndexPanelView";
import { InspectPanelView } from "../InspectPanel/InspectPanelView";
import { ViewPickerPanelView } from "../ViewPickerPanel/ViewPickerPanelView";
import view from "./view";

export class MainOverlayView extends ViewComposite {
	constructor(logModel: LogModel, minimized?: boolean) {
		super();
		this.log = logModel;
		if (minimized) this.mode = "minimized";
		app.renderer?.schedule(async () => {
			await this.restoreState();
			setTimeout(() => this._fixElementOrder());
		}, true);
	}

	protected defineView() {
		return view;
	}

	mode?: "index" | "inspect" | "picker" | "minimized" = "index";
	docked = false;
	overlayPosition: UIComponent.Position = {
		bottom: 16,
		left: 16,
		gravity: "overlay",
	};

	indexView = this.attach(new IndexPanelView(), { delegate: this });
	inspectView = this.attach(new InspectPanelView(), { delegate: this });
	pickerView?: ViewComposite;
	consoleView?: ConsoleOverlayView;
	log: LogModel;

	async saveState() {
		try {
			await app.localData.writeAsync("webToolsOverlay", {
				mode: this.mode,
				dock: this._wasDocked,
				console: this.consoleView?.evalHistory.slice(-100),
			});
		} catch (e) {
			app.log.error("Web tools: failed to save state", e);
		}
	}

	async restoreState() {
		let [state] = await app.localData.readAsync("webToolsOverlay", {
			mode: { isString: {}, isOptional: true },
			dock: { isString: {}, isOptional: true },
		});
		if (!state) return;
		if (state.mode === "minimized") {
			this.minimize();
			this._wasDocked = state.dock as any;
			return;
		}
		if (state.dock === "left") this.dockLeftSide();
		else if (state.dock === "right") this.dockRightSide();
		else if (state.dock === "mobile") this.emulateMobile();
		else this.showIndex();
	}

	minimize() {
		if (this.docked) this.undock();
		this.mode = "minimized";
		this.clearPicker();
		this.saveState();
	}

	emulateMobile(size: "small" | "normal" = "normal") {
		this._mobileBgBox = this._mobileBgBox || document.createElement("div");
		this._mobileBgBox.style.position = "fixed";
		this._mobileBgBox.style.left = "0";
		this._mobileBgBox.style.right = "0";
		this._mobileBgBox.style.top = "0";
		this._mobileBgBox.style.bottom = "0";
		this._mobileBgBox.style.background = "rgba(0,0,0,0.1)";
		document.body.insertBefore(this._mobileBgBox, document.body.firstChild);
		(app.renderer as any).setViewportLocation({
			left: Math.max(328, window.innerWidth / 2 - 180),
			top: window.innerHeight > 680 ? 32 : 4,
			width: size === "small" ? 320 : 375,
			height: size === "small" ? 560 : 667,
		});
		this.setPosition({ top: 0, left: 0, bottom: 0 });
		this.docked = true;
		this._fixElementOrder();
		this._wasDocked = "mobile";
		this._mobileSize = size;
		this.mode = "index";
		this.saveState();
	}

	dockLeftSide() {
		(app.renderer as any).setViewportLocation({ left: 320 });
		this.setPosition({ top: 0, left: 0, bottom: 0 });
		this.docked = true;
		this._fixElementOrder();
		this._wasDocked = "left";
		this.mode = "index";
		this.saveState();
	}

	dockRightSide() {
		(app.renderer as any).setViewportLocation({ right: 320 });
		this.setPosition({ top: 0, right: 0, bottom: 0 });
		this.docked = true;
		this._fixElementOrder();
		this._wasDocked = "right";
		this.mode = "index";
		this.saveState();
	}

	undock() {
		if (this._mobileBgBox) {
			this._mobileBgBox.remove();
		}
		(app.renderer as any).setViewportLocation();
		this.docked = false;
		this._fixElementOrder();
		this.setPosition({ bottom: 16, left: 16 });
		this.saveState();
	}

	setPosition(position: UIComponent.Position) {
		if (this.docked) return;
		this.overlayPosition = { ...position, gravity: "overlay" };
	}

	showIndex() {
		this.mode = "index";
		this.saveState();
	}

	showInspect(object?: any) {
		this.mode = "inspect";
		if (object) {
			this.inspectView.setObject(object);
			if (object instanceof View) {
				this.inspectView.findHistory(View);
			}
			this.inspectView.findHistory(Activity);
			this.inspectView.findHistory(ActivityList);
		} else if (this.inspectView.object === undefined) {
			this.inspectView.setObject(app.activities.activated);
			this.inspectView.findHistory(Activity);
			this.inspectView.findHistory(ActivityList);
		}
	}

	showPicker() {
		this.mode = "picker";
		if (!this.pickerView) {
			this.pickerView = this.attach(new ViewPickerPanelView(), {
				delegate: this,
			});
		}
	}

	showConsole(errors?: boolean) {
		if (!this.consoleView || this.consoleView.isUnlinked()) {
			let view = this.attach(new ConsoleOverlayView(this.log), {
				delegate: this,
			});
			this.consoleView = view;
			app.render(view, { mode: "overlay" });
		} else {
			ClickForegroundEffect.bringToForeground(this.consoleView);
		}
		if (errors) this.consoleView.filterErrorsOnly();
		else this.consoleView.clearFilter();
	}

	showFloat(value: unknown, title?: string) {
		if (value == null) return;
		let window = this.attach(new FloatOverlayView(value, title), {
			delegate: this,
		});
		app.render(window, { mode: "overlay" });
	}

	clearPicker() {
		this.pickerView?.unlink();
		this.pickerView = undefined;
		this._highlightBox?.remove();
		this._highlightElt = undefined;
	}

	protected beforeRender() {
		let interval = setInterval(() => {
			if (this.isUnlinked()) {
				clearInterval(interval);
				return;
			}
			this._fixElementOrder();
		}, 100);
	}

	protected beforeUnlink() {
		this._highlightBox?.remove();
		this._highlightElt = undefined;
	}

	protected onClose() {
		this.unlink();
	}

	protected onToggleMinimized() {
		if (this.mode === "minimized") this.mode = "index";
		else this.minimize();
	}

	protected async onMoreMenu(e: ViewEvent<UIButton>) {
		let hasObject = !!this.inspectView.object;
		setTimeout(() => this._fixElementOrder(), 10);
		setTimeout(() => this._fixElementOrder(), 30);
		let option = await app.showModalMenuAsync(
			{
				items: [
					{ text: "Show log", key: "showLog" },
					{ text: "Log object", key: "logObject", disabled: !hasObject },
					{ text: "Pin new window", key: "showFloat", disabled: !hasObject },
					{ separate: true },
					...(this.docked
						? [{ text: "Undock", key: "undock" }]
						: [
								{ text: "Dock left side", key: "dockLeft" },
								{ text: "Dock right side", key: "dockRight" },
							]),
					{ separate: true },
					...(!this.docked || this._wasDocked !== "mobile"
						? [
								{ text: "Emulate mobile", key: "emulate" },
								{ text: "Emulate mobile (small)", key: "emulate-s" },
							]
						: []),
					...(this.docked && this._wasDocked === "mobile"
						? [
								this._mobileSize === "small"
									? { text: "Normal size", key: "emulate" }
									: { text: "Small size", key: "emulate-s" },
								{ text: "Responsive view", key: "dockLeft" },
							]
						: []),
				],
			},
			e.source,
		);
		switch (option) {
			case "showLog":
				this.showConsole();
				break;
			case "logObject":
				this.showConsole();
				this.consoleView?.goEval("$_ // Inspector object");
				break;
			case "showFloat":
				this.showFloat(this.inspectView.object);
				break;
			case "dockLeft":
				if (this.docked) this.undock();
				this.dockLeftSide();
				break;
			case "dockRight":
				if (this.docked) this.undock();
				this.dockRightSide();
				break;
			case "emulate":
			case "emulate-s":
				if (this.docked) this.undock();
				this.emulateMobile(option === "emulate-s" ? "small" : "normal");
				break;
			case "undock":
				this._wasDocked = undefined;
				this.undock();
				break;
		}
	}

	protected onUnminimize() {
		if (this._wasDocked === "left") this.dockLeftSide();
		else if (this._wasDocked === "right") this.dockRightSide();
		else if (this._wasDocked === "mobile") this.emulateMobile();
		else this.showIndex();
	}

	protected onShowConsole() {
		this.showConsole();
	}

	protected onShowErrors() {
		this.showConsole(true);
	}

	protected onShowIndex() {
		this.clearPicker();
		this.showIndex();
	}

	protected onShowInspector() {
		this.clearPicker();
		this.showInspect();
	}

	protected onShowPicker() {
		this.showPicker();
	}

	protected onClearPicker() {
		this.clearPicker();
	}

	protected onShowFloat(e: ManagedEvent) {
		this.showFloat(e.data.object, String(e.data.title || "") || undefined);
	}

	protected onInspectObject(e: ManagedEvent) {
		this.showInspect(e.data.object);
	}

	protected onHighlightView(e: ManagedEvent) {
		let view = e.data.view as View | undefined;
		this._highlightBox?.remove();
		this._highlightElt = undefined;
		while (view instanceof ViewComposite || view instanceof UIConditionalView) {
			view = view.body;
		}
		if (!(view instanceof UIComponent)) return;
		let elt = view.lastRenderOutput?.element;
		if (!(elt instanceof HTMLElement)) return;
		this._highlightElt = elt;
		let highlightBox = this._highlightBox || document.createElement("div");
		this._highlightBox = highlightBox;
		highlightBox.dataset.name = "WebToolsHighlight";
		highlightBox.style.position = "absolute";
		highlightBox.style.background = "rgba(0, 136, 255, 0.3)";
		highlightBox.style.boxShadow = "0 0 0px 2px #08f";
		highlightBox.style.pointerEvents = "none";
		highlightBox.style.zIndex = "1000";
		const update = () => {
			if (this._highlightElt !== elt) return;
			let rect = elt.getBoundingClientRect();
			if (!rect.x && !rect.y && !rect.width && !rect.height) return;
			highlightBox.style.top = rect.top + "px";
			highlightBox.style.left = rect.left + "px";
			highlightBox.style.width = rect.width + "px";
			highlightBox.style.height = rect.height + "px";
			let overlay = document.querySelector("[data-name=WebToolsOverlay]");
			while (overlay && overlay?.parentNode !== document.body) {
				overlay = overlay.parentNode as any;
			}
			document.body.insertBefore(highlightBox, overlay);
			setTimeout(update, 100);
		};
		update();
	}

	private _fixElementOrder() {
		// find all web tools overlays, AND dropdown menus
		const webToolsElements: HTMLElement[] = Array.from(
			document.querySelectorAll(
				'[data-name^="WebTools"],body>web-handler-overlay>div>[role=menu]',
			),
		);
		if (!webToolsElements.length) return;

		// find associated body elements
		const overlays = webToolsElements.map((elt) => {
			while (elt) {
				if (elt.parentElement === document.body) break;
				elt = elt.parentElement!;
			}
			if (this.docked && !elt.dataset.docked) {
				elt.dataset.docked = "true";
				elt.style.inset = "0";
				elt.style.width = "";
				elt.style.height = "";
			}
			if (!this.docked) {
				elt.removeAttribute("data-docked");
			}
			return elt;
		});

		// move all other elements after the first overlay to the back
		let cur = overlays[0];
		let first = cur!;
		while (cur) {
			const nextElement = cur.nextElementSibling;
			if (!overlays.includes(cur)) {
				document.body.insertBefore(cur, first);
			}
			cur = nextElement as any;
		}
	}

	_highlightBox?: HTMLElement;
	_highlightElt?: HTMLElement;
	_mobileBgBox?: HTMLElement;
	_wasDocked?: "left" | "right" | "mobile";
	_mobileSize?: "small" | "normal";
}
