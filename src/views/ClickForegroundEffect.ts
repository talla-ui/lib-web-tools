import { UICell, View } from "talla-ui";

function isDocked(elt: any) {
	while (elt) {
		if ("dataset" in elt) {
			if (String(elt.dataset.name).startsWith("WebTools")) {
				if (elt.dataset.name !== "WebToolsOverlay") return false;
			}
			if (elt.dataset.docked) return true;
		}
		elt = elt.parentElement!;
	}
}

export class ClickForegroundEffect {
	static bringToForeground(view: View) {
		let cell = view instanceof UICell ? view : view.findViewContent(UICell)[0];
		let elt = cell?.lastRenderOutput?.element as HTMLElement;
		while (elt && elt.parentElement !== document.body) {
			elt = elt.parentElement!;
		}
		if (!elt) return;
		if (document.body.lastElementChild !== elt) {
			while (elt.nextElementSibling) {
				let sib = elt.nextElementSibling;

				// remember and restore scroll positions
				let cont = Array.from(sib.querySelectorAll("container")).filter(
					(a) => a.scrollTop > 0,
				);
				let scrollSaved = cont.map((a) => a.scrollTop);
				document.body.insertBefore(sib, elt);
				cont.forEach((a, i) => {
					a.scrollTop = scrollSaved[i] || 0;
				});
			}
		}
	}

	static applyEffect(elt: HTMLElement, view: View) {
		if (elt.dataset.clickForegroundEffect) return;
		elt.dataset.clickForegroundEffect = "true";

		let last = Date.now();
		elt.addEventListener("mousedown", function () {
			if (Date.now() - last < 100) return;
			if (isDocked(elt)) return;
			ClickForegroundEffect.bringToForeground(view);
		});
	}
}
