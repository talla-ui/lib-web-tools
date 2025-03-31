import { $either, $view, ui } from "talla-ui";
import { ClickForegroundEffect } from "../ClickForegroundEffect";
import icons from "../icons";

export const badgeButtonStyle = ui.style.BUTTON.override({
	background: ui.color.DANGER_BG,
	textColor: ui.color.DANGER.text(),
	fontSize: 12,
	borderRadius: 16,
	height: 20,
	minWidth: 20,
	maxWidth: 20,
	padding: 0,
	lineHeight: 1,
	textAlign: "center",
	lineBreakMode: "clip",
});

const toolbarRow = ui.row(
	{ padding: 4, spacing: 2 },
	ui.button({
		icon: icons.information,
		iconSize: 20,
		style: ui.style.BUTTON_ICON,
		pressed: $view("mode").matches("index"),
		onClick: "ShowIndex",
	}),
	ui.button({
		icon: icons.treeStructure,
		iconSize: 20,
		style: ui.style.BUTTON_ICON,
		pressed: $view("mode").matches("inspect"),
		onClick: "ShowInspector",
	}),
	ui.button({
		icon: icons.selectElement,
		iconSize: 20,
		style: ui.style.BUTTON_ICON,
		pressed: $view("mode").matches("picker"),
		onClick: "ShowPicker",
	}),
	ui.spacer(4),
	ui.button({
		hidden: $view.not("log.numErrors"),
		label: $view("log.numErrors"),
		style: badgeButtonStyle,
		onClick: "ShowErrors",
	}),
	ui.spacer(),
	ui.button({
		icon: ui.icon.MORE,
		iconSize: 16,
		style: ui.style.BUTTON_ICON,
		onClick: "MoreMenu",
	}),
	ui.button({
		hidden: $view("docked"),
		icon: ui.icon.CHEVRON_DOWN,
		iconSize: 20,
		style: ui.style.BUTTON_ICON,
		onClick: "ToggleMinimized",
	}),
);

export default ui.cell(
	{
		name: "WebToolsOverlay",
		effect: ClickForegroundEffect,
		position: $view("overlayPosition"),
		style: $view("docked").select(
			{
				width: 320,
				background: ui.color.BACKGROUND,
				css: { boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.2)" },
			},
			{
				background: ui.color.BACKGROUND.alpha(0.8),
				borderRadius: 8,
				borderColor: ui.color.BACKGROUND.brighten(0.5),
				borderThickness: 2,
				css: {
					backdropFilter: "blur(15px)",
					boxShadow: "0 0 0 4px rgba(0,0,0,0.4)",
				},
			},
		),
	},
	ui.cell(
		{
			effect: ui.effect("DragModal"),
			hidden: $view("mode").matches("minimized").not(),
			style: $view.not("log.numErrors").select(
				{
					borderRadius: 8,
					borderThickness: 2,
					borderStyle: "dotted",
					borderColor: ui.color.SUCCESS,
				},
				{
					borderRadius: 8,
					borderThickness: 2,
					borderStyle: "dashed",
					borderColor: ui.color.DANGER,
				},
			),
		},
		ui.button({
			icon: icons.information,
			iconSize: 20,
			style: ui.style.BUTTON_ICON,
			onClick: "Unminimize",
		}),
	),
	ui.cell(
		{
			hidden: $view("mode").matches("minimized").or("docked"),
			background: $view.not("docked").select(ui.color.BACKGROUND),
			effect: ui.effect("DragModal"),
			style: { grow: 0 },
		},
		toolbarRow,
	),
	ui.cell(
		{
			hidden: $view.not("docked"),
			style: { grow: 0 },
		},
		toolbarRow,
	),
	ui.animatedCell(
		{
			animationDuration: 100,
			style: $either(
				$view("docked").select({ shrink: 1 }),
				$view("mode")
					.matches("minimized")
					.select(
						{ width: 0, height: 0 },
						{ width: 320, height: "calc(100vh - 160px)", maxHeight: 500 },
					),
			),
		},
		ui.separator({ margin: 0 }),
		ui.show({
			insert: $view("mode").matches("index").and("indexView").else(undefined),
		}),
		ui.show({
			insert: $view("mode")
				.matches("inspect")
				.and("inspectView")
				.else(undefined),
		}),
		ui.show({
			insert: $view("mode").matches("picker").and("pickerView").else(undefined),
		}),
		ui.cell({
			hidden: $view("docked"),
			style: { height: 4 },
			position: { gravity: "overlay", bottom: 0, left: 0, right: 0 },
			effect: ui.effect("DragModal"),
		}),
	),
);
