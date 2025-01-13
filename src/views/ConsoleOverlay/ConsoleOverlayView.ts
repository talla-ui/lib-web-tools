import * as talla_ui from "talla-ui";
import {
	$list,
	$view,
	app,
	bind,
	ManagedEvent,
	ManagedList,
	ui,
	UICell,
	UIListView,
	UIScrollContainer,
	UITextField,
	ViewComposite,
	ViewEvent,
} from "talla-ui";
import { LogMessage, LogModel } from "../../LogModel";
import { PropertyInfo } from "../../PropertyInfo";
import { ClickForegroundEffect } from "../ClickForegroundEffect";
import { MainOverlayView } from "../MainOverlay/MainOverlayView";

const filterButtonStyle = ui.style.BUTTON_SMALL.extend({
	background: ui.color.CLEAR,
});

export class ConsoleOverlayView extends ViewComposite {
	protected defineView() {
		return ui.cell(
			{
				name: "WebToolsConsole",
				background: ui.color.BACKGROUND.alpha(0.8),
				borderRadius: 8,
				effect: ClickForegroundEffect,
				position: {
					gravity: "overlay",
					bottom: 16,
					right: 16,
				},
				style: {
					width: 620,
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
					ui.label("Console", { bold: true }),
					ui.spacer(8),
					ui.button({
						label: "all",
						width: "auto",
						style: filterButtonStyle,
						pressed: $view.not("errorFilter"),
						onClick: "FilterAll",
					}),
					ui.button({
						label: "errors",
						width: "auto",
						style: filterButtonStyle,
						pressed: $view.boolean("errorFilter"),
						onClick: "FilterError",
					}),
					ui.row(
						{ spacing: 0 },
						ui.label({
							icon: ui.icon.SEARCH,
							iconSize: 16,
							iconColor: ui.color.TEXT.alpha(0.5),
							position: { gravity: "overlay", top: 4, start: 4 },
							onPress: "RequestFocusNext",
						}),
						ui.textField({
							placeholder: "Search",
							type: "search",
							style: ui.style.TEXTFIELD.override({
								borderThickness: 0,
								padding: { start: 24, end: 4, y: 4 },
								fontSize: 12,
							}),
							onChange: "FilterSearch",
						}),
					),
					ui.spacer(),
					ui.button({
						icon: ui.icon.CLOSE,
						iconSize: 16,
						style: ui.style.BUTTON_ICON,
						onClick: "Close",
					}),
				),
			),
			ui.separator({ margin: 0 }),
			ui.scroll(
				ui.cell(),
				ui.list(
					{ items: $view.bind("list") },
					ui.cell(
						{
							padding: { x: 8, top: 16, bottom: 2 },
							style: {
								borderThickness: { top: 1 },
								borderColor: ui.color.SEPARATOR,
								css: { cursor: "pointer", outlineOffset: "-2px" },
							},
							onRendered: "ItemRendered",
							onClick: "ShowItem",
							onEnterKeyPress: "ShowItem",
							onArrowDownKeyPress: "FocusNext",
							onArrowUpKeyPress: "FocusPrevious",
							allowFocus: true,
						},
						ui.label(
							bind.strf(
								"%s %{?|= }%2$s",
								$list.bind("item.time"),
								$list.bind("item.var"),
							),
							{
								fontSize: 10,
								dim: true,
								position: { gravity: "overlay", top: 2, start: 8 },
							},
						),
						ui.label($list.bind("item.loc"), {
							fontSize: 10,
							dim: true,
							style: { grow: 1, textAlign: "end" },
							position: { gravity: "overlay", top: 2, end: 4 },
						}),
						ui.label($list.bind("item.expr"), {
							hidden: $list.not("item.expr"),
							width: "100%",
							dim: true,
							style: { fontFamily: "monospace", fontSize: 12 },
						}),
						ui.label($list.bind("item.text"), {
							hidden: $list.not("item.text"),
							width: "100%",
							style: $list.bind("item.level").matches(4, 5).select(
								{
									fontSize: 12,
									fontFamily: "monospace",
									lineBreakMode: "pre-wrap",
									textColor: ui.color.RED,
								},
								{
									fontSize: 12,
									fontFamily: "monospace",
									lineBreakMode: "pre-wrap",
								},
							),
						}),
						ui.label($list.bind("item.dataDisplay"), {
							hidden: $list.not("item.dataDisplay.length"),
							width: "100%",
							padding: { start: 16 },
							style: { fontFamily: "monospace", fontSize: 12 },
						}),
					),
					ui.cell({
						style: { grow: 0 },
						name: "WebToolsConsoleList",
						accessibleRole: "list",
						allowKeyboardFocus: true,
						onFocusIn: "+SetListFocus",
					}),
				),
			),
			ui.separator({ margin: 0 }),
			ui.row(
				{ spacing: 0, padding: 4, height: 36 },
				ui.label({
					icon: ui.icon.CHEVRON_NEXT,
					dim: $view.boolean("errorFilter"),
					position: { gravity: "overlay", top: 6, left: 4 },
				}),
				ui.textField({
					hidden: $view.boolean("errorFilter"),
					width: "100%",
					style: ui.style.TEXTFIELD.override({
						borderThickness: 0,
						padding: { start: 24, y: 4 },
						fontFamily: "monospace",
						fontSize: 12,
					}),
					requestFocus: true,
					onInput: "EvalInput",
					onKeyDown: "EvalKeyDown",
					onEnterKeyPress: "Eval",
					onArrowUpKeyPress: "HistoryBack",
					onArrowDownKeyPress: "HistoryForward",
				}),
			),
		);
	}

	constructor(logModel: LogModel) {
		super();
		this.log = logModel;
		this.list = logModel.list;
		this.restoreState();
	}

	log: LogModel;
	list: ManagedList<LogMessage>;
	errorFilter = false;
	evalHistory: string[] = [];
	historyPos?: number;

	saveState() {
		app.localData.write("webToolsConsole", {
			history: this.evalHistory,
		});
	}

	restoreState() {
		let [state] = app.localData.read("webToolsConsole", {
			history: { isArray: { items: { isString: {} } } },
		});
		if (state) this.evalHistory = state.history;
	}

	clearFilter() {
		this.errorFilter = false;
		this.list = this.log?.list;
	}

	filterErrorsOnly() {
		this.errorFilter = true;
		this.list = this.log?.errorList;
	}

	filterSearch(search?: string) {
		let list = this.errorFilter ? this.log?.errorList : this.log?.list;
		if (!search || !list) {
			this.list = list;
			return;
		}
		search = search.toLowerCase();
		this.list = new ManagedList(
			...list.filter((item) =>
				[item.text, item.expr, item.dataDisplay].some((text) =>
					text?.toLowerCase().includes(search),
				),
			),
		);
	}

	goEval(expr: string) {
		if (!expr) return;
		let varIdx = (window as any)._WebToolsEvalVar || 1;
		try {
			let result = this._runEval(expr);
			let varName = "$" + varIdx;
			(window as any)[varName] = result;
			app.log.debug("Eval result", { result, _eval: expr, _var: varName });
			(window as any)._WebToolsEvalVar = varIdx + 1;
			return true;
		} catch (err) {
			app.log.error("Eval error", {
				message: String(err),
				error: err,
				_eval: expr,
			});
		}
	}

	protected onClose() {
		this.unlink();
	}

	protected onFilterAll() {
		this.clearFilter();
	}

	protected onFilterError() {
		this.filterErrorsOnly();
	}

	protected onFilterSearch(e: ViewEvent<UITextField>) {
		this.filterSearch(e.source.value);
	}

	protected onItemRendered() {
		this._scrollSched.addOrReplace("scroll", () => {
			this.findViewContent(UIScrollContainer)[0]?.scrollToBottom();
		});
	}

	protected onSetListFocus(e: ManagedEvent) {
		while (e.inner) e = e.inner;
		if (e.source instanceof UICell && e.source.accessibleRole === "list") {
			e.source.content.last()?.requestFocus();
		}
	}

	protected onShowItem(e: ViewEvent) {
		let item = UIListView.getSourceItem<LogMessage>(e.source)!;
		let value = !item.data.length
			? item.text
			: item.data.length === 1
				? item.data[0]
				: item.data;
		this.emit("ShowFloat", { object: value, title: item.var });
	}

	protected onEval(e: ViewEvent<UITextField>) {
		let tf = e.source;
		let expr = tf.value || "";
		if (this.goEval(expr)) {
			tf.value = "";
			if (this.evalHistory[this.evalHistory.length - 1] !== expr) {
				this.evalHistory.push(expr);
			}
			this.saveState();
		}
		tf.requestFocus();
	}

	protected onEvalKeyDown(e: ViewEvent<UITextField>) {
		let tf = e.source;
		let expr = tf.value || "";
		let event = e.data.event as KeyboardEvent;

		// only care about tab key presses with simple variable/property
		if (!expr || event.key !== "Tab" || event.shiftKey) return;
		event.preventDefault();
		if (!/^[ \w\$\.\[\]]+$/.test(expr)) return;

		// match last part (ID) and trim it off, along with last dot
		let partialWord = expr.match(/[\w\$]+$/)?.[0] || "";
		if (partialWord) expr = expr.slice(0, -partialWord.length);
		if (expr.endsWith(".")) expr = expr.slice(0, -1);
		if (!expr) expr = "_";

		// get all properties of the expression result
		try {
			let result = this._runEval(expr);
			let keys = PropertyInfo.getPropertyMap(result, true).keys();
			for (let key of keys) {
				if (!partialWord && key.startsWith("_")) continue;
				if (key.startsWith(partialWord)) {
					let prefix = partialWord
						? tf.value.slice(0, -partialWord.length)
						: tf.value;
					if (/^\d|[^\w\$]/.test(key)) {
						key = "[" + JSON.stringify(key) + "]";
						if (prefix.endsWith(".")) prefix = prefix.slice(0, -1);
					}
					tf.value = prefix + key;
					break;
				}
			}
		} catch {}
	}

	protected onEvalInput() {
		this.historyPos = undefined;
	}

	protected onHistoryBack() {
		if (this.historyPos == null) this.historyPos = this.evalHistory.length;
		this.historyPos--;
		if (this.historyPos < 0) this.historyPos = 0;
		let tf = this.findViewContent(UITextField).pop()!;
		tf.value = this.evalHistory[this.historyPos] || "";
	}

	protected onHistoryForward() {
		if (this.historyPos == null) return;
		this.historyPos++;
		if (this.historyPos > this.evalHistory.length - 1) this.historyPos--;
		let tf = this.findViewContent(UITextField).pop()!;
		tf.value = this.evalHistory[this.historyPos] || "";
	}

	private _runEval(expr: string): unknown {
		let mainOverlay = MainOverlayView.whence(this)!;
		let context = {
			...talla_ui,
			$_: mainOverlay.inspectView.object,
		};
		let f = new Function("_", "with (_) return (\n" + expr + "\n)");
		return f(context);
	}

	private _scrollSched = app.scheduler.createQueue("consoleScroll", false, {
		throttleDelay: 10,
	});
}
