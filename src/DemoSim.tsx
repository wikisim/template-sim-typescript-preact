import { useEffect, useState } from "preact/hooks"

import { request_historical_data_components, RequestDataComponentsReturn } from "core/data/fetch_from_db"
import { format_data_component_value_to_string } from "core/data/format/format_data_component_value_to_string"
import { IdAndVersion } from "core/data/id"
import { get_supabase } from "core/supabase/browser"

import logo from "./assets/logo.svg"


export const DemoSim = () => {
    return <div>
        <img src={logo} alt="Logo" style={{ width: 64, height: 64 }} />
        <h3>Demo Simulation</h3>
        <p>This is a placeholder for the demo simulation component.</p>
        <LoadData />
        {/* Add your simulation content here */}
    </div>
}


function LoadData()
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
        {response && response.data && <>
            Loaded {response.data.length} data components from WikiSim:
            <ul>
                {response.data.map((component, index) => (
                    <div key={component.id.to_str()}>
                        <strong>ID:</strong> {component.id.id}<br/>
                        <strong>Version:</strong> {component.id.version}<br/>
                        <strong>Title:</strong> {component.title}<br/>
                        <strong>Value:</strong> {component.result_value}<br/>
                        <strong>Value as text:</strong> {format_data_component_value_to_string(component)}<br/>
                    </div>
                ))}
            </ul>
        </>}
    </div>
}
