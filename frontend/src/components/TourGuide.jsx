import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect } from "react";

export const runTour = () => {
    const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        doneBtnText: 'Finish',
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        steps: [
            {
                element: "#dashboard-sidebar",
                popover: {
                    title: "Welcome to Flood Analytics 🌊",
                    description: "This advanced tool models <strong>flood risk</strong> across Edinburgh. <br/><br/>Use it to identify at-risk properties, analyze financial impact, and explore deprivation zones.",
                    side: "right",
                    align: "center"
                }
            },
            {
                element: "#search-container",
                popover: {
                    title: "Find Any Property 📍",
                    description: "Search for a specific address (e.g., '1 Princes St') to fly directly to it, or use <strong>My Location</strong> to check the risk where you are standing right now.",
                    side: "right",
                    align: "center"
                }
            },
            {
                element: "#map-container",
                popover: {
                    title: "Interact with the Map 👆",
                    description: "Click on individual <strong>building centroids</strong> (dots) to see detailed damage info and property values.<br/><br/>When viewing <strong>SIMD Zones</strong>, click a zone to see aggregated neighborhood statistics.",
                    side: "left",
                    align: "center"
                }
            },
            {
                element: ".leaflet-draw-toolbar",
                popover: {
                    title: "Spatial Filtering (Lasso) 🤠",
                    description: "Use the <strong>Draw Tools</strong> (bottom right) to draw a Polygon or Rectangle around a specific area.<br/><br/>The dashboard will instantly update to show risk analysis <strong>only</strong> for the selected area.",
                    side: "left",
                    align: "center"
                }
            },
            {
                element: "#scenario-selector",
                popover: {
                    title: "Select Risk Scenario 🌧️",
                    description: "Floods vary in severity. <br/>• <strong>Low</strong>: Rare, severe events (1 in 1000 years).<br/>• <strong>High</strong>: More frequent events (1 in 10 years).<br/>Switch between them to see how the water spreads.",
                    side: "right",
                    align: "center"
                }
            },
            {
                element: "#layer-controls",
                popover: {
                    title: "Rich Data Layers 🗺️",
                    description: "Toggle <strong>Flood Extents</strong> to see the water itself.<br/>Toggle <strong>SIMD Zones</strong> to see the socio-economic impact on different neighborhoods.",
                    side: "right",
                    align: "center"
                }
            },
            {
                element: "#mitigation-simulator",
                popover: {
                    title: "Mitigation Simulator 🛡️",
                    description: "This tool replicates how <strong>greenspace usage</strong> (parks, sustainable drainage) can reduce flood water levels.<br/><br/>Drag the slider to lower the water depth and see the immediate <strong>ROI</strong> in saved damages.",
                    side: "right",
                    align: "center"
                }
            },
            {
                element: "#color-mode-toggle",
                popover: {
                    title: "Advanced Visualization 🎨",
                    description: "Change how buildings are colored:<br/>• <strong>Risk</strong>: Red means high damage cost.<br/>• <strong>Usage</strong>: Blue is Residential, Purple is Commercial.<br/>Helps you spot <em>what</em> is actually at risk.",
                    side: "right",
                    align: "center"
                }
            }
        ],
        onDestroyStarted: () => {
            localStorage.setItem("flood_app_seen_tour_v1", "true");
            driverObj.destroy();
        },
    });

    driverObj.drive();
};

export default function TourGuide() {
    useEffect(() => {
        const hasSeenTour = localStorage.getItem("flood_app_seen_tour_v1");
        if (!hasSeenTour) {
            setTimeout(() => {
                runTour();
            }, 1500);
        }
    }, []);

    return null;
}
