import { app, UIRenderable } from "talla-ui";
import { LogModel } from "./LogModel";
import { MainOverlayView } from "./views/MainOverlay/MainOverlayView";

let instance: MainOverlayView | undefined;
let logModel: LogModel | undefined;

/**
 * Shows the main web tools overlay
 * @param inspect A value to show in the object inspector panel
 * @param minimized True if the overlay should be minimized into a button
 */
export function showWebTools(
	inspect?: unknown,
	minimized?: boolean,
	position?: UIRenderable.Position,
) {
	logModel ||= new LogModel();
	if (instance && !instance.isUnlinked()) {
		if (minimized) instance.minimize();
		else if (inspect) instance.showInspect(inspect);
		else instance.showIndex();
		if (position) instance.setPosition(position);
		return instance;
	}

	instance = new MainOverlayView(logModel, minimized);
	if (inspect) instance.showInspect(inspect);

	let vc = app.render(instance, { mode: "overlay" });
	if (position) instance.setPosition(position);
	app.renderer?.listen(() => {
		vc.render(instance, undefined, { mode: "overlay" });
	});
}

/**
 * Adds a global (window) key event listener, to show/hide the web tools overlay(s) when the user presses the specified key
 * @param key Name of the key to listen for
 * @param modifiers Modifiers that need to be pressed along with the key
 */
export function setWebToolsToggleKey(
	key: string,
	modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean },
	selectElement?: boolean,
) {
	logModel ||= new LogModel();
	window.addEventListener(
		"keydown",
		(e) => {
			if (e.key.toUpperCase() !== key.toUpperCase()) return;
			if (!!modifiers?.ctrl !== !!e.ctrlKey) return;
			if (!!modifiers?.shift !== !!e.shiftKey) return;
			if (!!modifiers?.alt !== !!e.altKey) return;
			if (selectElement) {
				showWebTools(undefined);
				instance?.showPicker();
				return;
			}
			if (instance && !instance.isUnlinked() && instance.mode !== "minimized") {
				if (instance.docked) instance.undock();
				instance.unlink();
			} else {
				showWebTools(undefined);
			}
		},
		true,
	);
}
