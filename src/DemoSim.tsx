import { useEffect, useState } from "preact/hooks"

import { request_archived_data_components, RequestDataComponentsReturn } from "core/data/fetch_from_db"
import { format_data_component_value_to_string } from "core/data/format/format_data_component_value_to_string"
import { IdAndVersion } from "core/data/id"
import { get_supabase } from "core/supabase"

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
        request_archived_data_components(get_supabase, [new IdAndVersion(10, 1)])
        .then(set_response)
    }, [])

    return <div>
        {response === null && <p>Loading data from WikiSim...</p>}
        {response && response.error && <p>Error loading data from WikiSim: {response.error.message}</p>}
        {response && response.data && <>
            Loaded {response.data.length} data components from WikiSim:
            <ul>
                {response.data.map((component, index) => (
                    <li key={index}>
                        <strong>ID:</strong> {component.id.id},
                        <strong>Version:</strong> {component.id.version},
                        <strong>Title:</strong> {component.title},
                        <strong>Value:</strong> {component.value},
                        <strong>Value as text:</strong> {format_data_component_value_to_string(component)}
                    </li>
                ))}
            </ul>
        </>}
    </div>
}
