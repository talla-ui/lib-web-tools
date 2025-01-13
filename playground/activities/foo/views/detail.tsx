import { $activity, $view, bind, ui, ViewComposite } from "talla-ui";

const StatsLine = ViewComposite.define(
	{ label: "", value: "" as unknown },
	() => (
		<row padding={{ x: 16, y: 8 }}>
			<label width={120}>{$view.string("label")}</label>
			<spacer />
			<label>{$view.string("value")}</label>
		</row>
	),
);

export default (
	<cell
		layout={{ distribution: "start" }}
		padding={16}
		style={{ width: "100%", maxWidth: 600 }}
		position={{ gravity: "center" }}
	>
		<animate showAnimation={ui.animation.FADE_IN_DOWN}>
			<row height={40}>
				<button
					onClick="NavigateBack"
					icon={ui.icon.CHEVRON_BACK}
					style={ui.style.BUTTON_PLAIN.override({
						background: ui.color.CLEAR,
						padding: { y: 6, x: 0 },
					})}
					position={{ start: -4 }}
				>
					Back
				</button>
			</row>
		</animate>

		<row height={48}>
			<label bold fontSize={20}>
				{$activity.string("item.title")}
			</label>
		</row>
		<separator />
		<spacer height={8} />

		<row height={48}>
			<label bold>Stats</label>
		</row>
		<cell
			style={ui.style.CELL_BG.override({
				grow: 0,
				maxWidth: 300,
				borderRadius: 16,
				padding: 8,
			})}
		>
			<column>
				<StatsLine label="Name" value={$activity.string("item.title")} />
				<StatsLine
					label="Weight"
					value={bind.strf("%n kg", $activity.number("item.weight"))}
				/>
				<StatsLine label="Quantity" value={$activity.number("item.quantity")} />
				<StatsLine
					label="Total weight"
					value={bind.strf("%n kg", $activity.number("item.total"))}
				/>
			</column>
		</cell>
	</cell>
);
