import { LazyComponent } from "@utils/lazyReact";
import { ScrollerThin,useMemo, useRef, useState } from "@webpack/common";

export default LazyComponent(() => {

    const require = Vencord.Webpack.wreq;
    const cn = require.n(require("414456"));
    const SearchBar = require("810567").default;
    const DevToolsHeader = require("664336").default;
    const Inspector = require("50625").default;
    const DevToolsSubPanel = require("928063").default;
    const DataTable = require("637171").default;
    const useTabBar = require("724209").default;
    const _DevToolsClasses = require("232276");
    const _DevToolsClasses2 = require("699412");
    const _DevToolsClasses3 = require("731343");

    const columns = [
        {
            key: "name",
            cellClassName: _DevToolsClasses3.eventColumn,
            render({ plugin }) {
                return plugin.name;
            },
        },
        {
            key: "patches",
            cellClassName: _DevToolsClasses3.locationColumn,
            render({ plugin }) {
                return (plugin.patches ?? [])
                    .flatMap(({ replacement: r }) => Array.isArray(r) ? r : [r])
                    .length;
            },
        },
    ];

    const tabs = [
        {
            id: "instance",
            name: "Plugin Instance",
            render({ plugin }) {
                return (
                    <ScrollerThin className={_DevToolsClasses.inspectorContainer}>
                        <Inspector data={plugin} />
                    </ScrollerThin>
                );
            },
        },
    ];

    function PluginPanel({ plugin, initialHeight }) {
        const { TabBar, renderSelectedTab } = useTabBar({ tabs }, []);
        return (
            <DevToolsSubPanel className={_DevToolsClasses.subPanel} minHeight={100} initialHeight={initialHeight}>
                <TabBar />
                <DevToolsHeader className={cn(_DevToolsClasses2.headerBar, _DevToolsClasses.subPanelHeaderBar)}>
                    <DevToolsHeader.Title>{plugin.name}</DevToolsHeader.Title>
                </DevToolsHeader>
                {renderSelectedTab({ plugin })}
            </DevToolsSubPanel>
        );
    }

    return function PluginsTool() {
        const ref = useRef(null);
        const [query, setQuery] = useState("");

        const plugins = useMemo(() =>
            Object.values(Vencord.Plugins.plugins)
                .sort((a, b) => a.name.localeCompare(b.name))
        );
        const data = plugins
            .filter(plugin => (
                plugin.name.toLowerCase().includes(query) ||
            plugin.description.toLowerCase().includes(query) ||
            plugin.tags?.some(t => t.toLowerCase().includes(query))
            ))
            .map(plugin => ({ key: plugin.name, plugin }));

        const [selectedRow, selectRow] = useState();
        const current = plugins.find(plugin => plugin.name === selectedRow);

        return (
            <div ref={ref} className={cn(_DevToolsClasses2.panel, _DevToolsClasses.panel)}>
                <div className={_DevToolsClasses.toolbar}>
                    <SearchBar
                        className={_DevToolsClasses.searchBar}
                        size={SearchBar.Sizes.SMALL}
                        query={query}
                        onChange={setQuery}
                        onClear={() => setQuery("")}
                        placeholder="Search plugins"
                        aria-label="Search plugins"
                    />
                </div>
                <ScrollerThin className={_DevToolsClasses.tableContainer}>
                    <DataTable
                        columns={columns}
                        data={data}
                        selectedRowKey={selectedRow}
                        onClickRow={selectRow}
                    />
                </ScrollerThin>
                {current != null && (
                    <PluginPanel
                        plugin={current}
                        initialHeight={ref.current != null ? ref.current.clientHeight / 2 : 300}
                    />
                )}
            </div>
        );
    };

});
