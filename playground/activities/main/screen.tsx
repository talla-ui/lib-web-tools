import { $viewport, bind, ui, UIIconResource, ViewComposite } from "talla-ui";

const NavButton = ViewComposite.define(
	{ page: "", title: "", icon: undefined as UIIconResource | undefined },
	({ page, title, icon }) => (
		<button
			navigateTo={page}
			label={title}
			icon={icon}
			iconMargin={16}
			pressed={bind("navigation.pageId").matches(page)}
			style={ui.style.BUTTON_PLAIN.extend({
				borderRadius: 4,
				width: "100%",
				textAlign: "start",
			})}
		/>
	),
);

const MobileNavButton = ViewComposite.define(
	{ page: "", title: "", icon: undefined as UIIconResource | undefined },
	({ page, title, icon }) => (
		<button
			style={ui.style.BUTTON_PLAIN.override({
				width: 80,
				height: 60,
				textAlign: "center",
			})}
			navigateTo={page}
			icon={icon}
			pressed={bind("navigation.pageId").matches(page)}
			label={"\n" + title}
		/>
	),
);

export default (
	<cell
		layout={{ axis: "horizontal" }}
		background={ui.color.BACKGROUND.contrast(-0.05)}
		style={{ shrink: 1 }}
	>
		<column
			width={300}
			padding={{ y: 32, x: 8 }}
			align="start"
			hidden={$viewport.not("col3")}
		>
			<label bold fontSize={16} padding={{ x: 8 }}>
				Playground
			</label>
			<spacer height={32} />
			<NavButton page="foo" title="Foo" icon={ui.icon("foo", "🐘")} />
			<NavButton page="bar" title="Bar" icon={ui.icon("bar", "🐝")} />
		</column>
		<scroll>
			<cell
				background={ui.color.BACKGROUND}
				margin={$viewport.not("col3").select(-8, { end: 8, top: 8 })}
				padding={$viewport.not("col3").select({ x: 4 })}
				borderRadius={8}
			>
				<render view={bind("page.view")} />
			</cell>
		</scroll>

		<cell
			hidden={$viewport.boolean("col3")}
			background={ui.color.BACKGROUND}
			position={{ gravity: "overlay", bottom: 0, left: 0, right: 0 }}
		>
			<separator margin={0} />
			<row align="center" padding={8}>
				<MobileNavButton page="foo" title="Foo" icon={ui.icon("foo", "🐘")} />
				<MobileNavButton page="bar" title="Bar" icon={ui.icon("bar", "🐝")} />
			</row>
		</cell>
	</cell>
);
