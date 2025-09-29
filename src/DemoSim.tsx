import { useEffect, useState } from "preact/hooks"

import { request_historical_data_components, RequestDataComponentsReturn } from "core/data/fetch_from_db"
import { format_data_component_value_to_string } from "core/data/format/format_data_component_value_to_string"
import { IdAndVersion } from "core/data/id"
import { DataComponent } from "core/data/interface"
import { get_supabase } from "core/supabase/browser"


export const DemoSim = () =>
{
    const [response, set_response] = useState<RequestDataComponentsReturn | null>(null)

    useEffect(() =>
    {
        request_historical_data_components(get_supabase, [new IdAndVersion(1002, 6)])
        .then(set_response)
    }, [])

    return <div>
        {response === null && <p>Loading data from WikiSim...</p>}
        {response && response.error && <p>Error loading data from WikiSim: {response.error.message}</p>}
        {response && response.data && <Simulation data={response.data} />}
    </div>
}


function Simulation(props: { data: DataComponent[] })
{
    return <div>
        Loaded {props.data.length} data components from WikiSim:
        <ul>
            {props.data.map(component => (
                <div key={component.id.to_str()}>
                    <strong>ID:</strong> {component.id.id}<br/>
                    <strong>Version:</strong> {component.id.version}<br/>
                    <strong>Title:</strong> {component.title}<br/>
                    <strong>Value:</strong> {component.result_value}<br/>
                    <strong>Value as text:</strong> {format_data_component_value_to_string(component)}<br/>
                </div>
            ))}
        </ul>
    </div>
}
