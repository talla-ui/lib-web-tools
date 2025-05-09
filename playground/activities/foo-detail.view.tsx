import { $activity, $strf, $view, ui, UIComponent } from "talla-ui";
import { LayoutComponent } from "./layout";

const StatsLine = UIComponent.define(
	{ label: "", value: "" as unknown },
	() => (
		<row padding={{ x: 16, y: 8 }}>
			<label grow>{$view("label")}</label>
			<label>{$view("value")}</label>
		</row>
	),
);

export default (
	<LayoutComponent>
		<cell
			layout={{ distribution: "start" }}
			padding={16}
			style={{ width: "100%", maxWidth: 600 }}
			position={{ gravity: "center" }}
		>
			<show showAnimation={ui.animation.FADE_IN_DOWN}>
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
			</show>

			<row height={48}>
				<label bold fontSize={20}>
					{$activity("item.title")}
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
					<StatsLine label="Name" value={$activity("item.title")} />
					<StatsLine
						label="Weight"
						value={$strf("%n kg", $activity("item.weight"))}
					/>
					<StatsLine label="Quantity" value={$activity("item.quantity")} />
					<StatsLine
						label="Total weight"
						value={$strf("%n kg", $activity("item.total"))}
					/>
				</column>
			</cell>
		</cell>
	</LayoutComponent>
);
