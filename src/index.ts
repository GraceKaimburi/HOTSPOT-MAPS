/******************************************
 * IMPORTS AND TYPE DEFINITIONS
 ******************************************/
import { geoEquirectangular, geoPath } from "d3-geo";
import * as d3 from "d3";
import * as d3Geo from "d3-geo";
const Datamap = require("datamaps");

// Define interfaces for type safety
interface GeoFeature {
  type: string;
  geometry: any;
  properties: {
    name: string;
    id: string;
  };
}

/******************************************
 * CONSTANTS AND CONFIGURATION
 ******************************************/
// List of African country codes for filtering
const africanCountries = [
  'DZA', 'AGO', 'BEN', 'BWA', 'BFA', 'BDI', 'CMR', 'CPV', 'CAF', 'TCD',
  'COM', 'COG', 'COD', 'DJI', 'EGY', 'GNQ', 'ERI', 'ETH', 'GAB', 'GMB',
  'GHA', 'GIN', 'GNB', 'CIV', 'KEN', 'LSO', 'LBR', 'LBY', 'MDG', 'MWI',
  'MLI', 'MRT', 'MUS', 'MAR', 'MOZ', 'NAM', 'NER', 'NGA', 'RWA', 'STP',
  'SEN', 'SYC', 'SLE', 'SOM', 'ZAF', 'SSD', 'SDN', 'SWZ', 'TZA', 'TGO',
  'TUN', 'UGA', 'ZMB', 'ZWE', 'ESH'
];

// Target countries with their coordinate data
const countryCenters: Record<string, { 
  latitude: number; 
  longitude: number; 
  bounds: [number, number, number, number] 
}> = {
  RWA: { 
    latitude: -1.9403, 
    longitude: 29.8739,
    bounds: [28.8617, -2.8389, 30.8990, -1.0474]
  },
  UGA: { 
    latitude: 1.3733, 
    longitude: 32.2903,
    bounds: [29.5794, -1.4821, 35.0361, 4.2340]
  },
  BWA: { 
    latitude: -22.3285, 
    longitude: 24.6849,
    bounds: [19.9995, -26.9075, 29.3682, -17.7808]
  },
  KEN: { 
    latitude: -1.36389, 
    longitude: 37.817223,
    bounds: [33.9089, -4.7677, 41.9062, 5.5196]
  },
  GHA: { 
    latitude: 7.9465, 
    longitude: -1.0232,
    bounds: [-3.2557, 4.7388, 1.1995, 11.1733]
  }
};

/******************************************
 * MAIN MAP INITIALIZATION
 ******************************************/
// Get the map container element
const mapElement = document.getElementById("map") as HTMLElement;
if (!mapElement) {
  console.error("Error: #map not found.");
} else {
  // Create reset button first (before it's used in other functions)
  const resetButton = document.createElement('button');
  resetButton.className = 'reset-button';
  resetButton.textContent = 'Reset View';
  mapElement.appendChild(resetButton);

  /******************************************
   * HELPER FUNCTIONS
   ******************************************/
  // Function to update insights panel with country data
  function updateInsights(countryCode: string) {
    const insights: Record<string, any> = {
      KEN: {
        name: "Kenya",
        highRisk: "Turkana",
        vulnerability: "high",
        women: "78%",
        factors: ["drought", "heat stress", "water scarcity"],
        text: "Turkana region shows the highest vulnerability with 78% of women in agriculture affected by severe drought conditions. Climate adaptation needs focus on water management and drought-resistant farming techniques."
      },
      RWA: {
        name: "Rwanda",
        highRisk: "Eastern Province",
        vulnerability: "moderate",
        women: "82%",
        factors: ["flooding", "landslides", "soil erosion"],
        text: "Eastern Province faces significant challenges with 82% of women farmers impacted by flooding and landslides. Soil conservation and flood-resistant farming practices are critical adaptation priorities."
      },
      UGA: {
        name: "Uganda",
        highRisk: "Karamoja",
        vulnerability: "high",
        women: "77%",
        factors: ["drought", "food insecurity"],
        text: "Karamoja region faces significant vulnerability with 77% of women farmers affected by recurring droughts and food insecurity. Climate adaptation focuses on drought-resistant crops and water management."
      },
      BWA: {
        name: "Botswana",
        highRisk: "Kalahari",
        vulnerability: "high",
        women: "75%",
        factors: ["heat stress", "water scarcity"],
        text: "Kalahari region shows severe vulnerability with 75% of women in agriculture impacted by extreme heat and water scarcity. Adaptation measures prioritize water conservation and heat-resistant farming."
      },
      GHA: {
        name: "Ghana",
        highRisk: "Northern Region",
        vulnerability: "moderate",
        women: "70%",
        factors: ["irregular rainfall", "soil erosion"],
        text: "Northern Region experiences moderate vulnerability with 70% of women farmers affected by irregular rainfall patterns. Focus is on soil conservation and climate-smart agriculture."
      }
    };

    const country = insights[countryCode];
    if (country) {
      const insightPanel = document.getElementById('country-insights');
      if (insightPanel) {
        insightPanel.innerHTML = `
          <h3>${country.name} Climate Vulnerability</h3>
          <p class="mb-4">${country.text}</p>
          <div class="country-stat">
            <span class="stat-label">High-Risk Area:</span> ${country.highRisk}
          </div>
          <div class="country-stat">
            <span class="stat-label">Women in Agriculture:</span> ${country.women}
          </div>
          <div class="country-stat">
            <span class="stat-label">Key Risk Factors:</span> ${country.factors.join(', ')}
          </div>
        `;
      }
    }
  }

  // Function to handle country zooming
  async function zoomToCountry(countryCode: string) {
    if (countryCenters[countryCode]) {
      try {
        // Get the country path element
        const countryPath = map.svg.select(`.datamaps-subunit.${countryCode.toLowerCase()}`);
        const bounds = countryPath.node().getBBox();
        
        // Calculate center and scale
        const width = mapElement.offsetWidth;
        const height = mapElement.offsetHeight;
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        
        // Calculate scale to fit country with padding
        const scale = 0.8 * Math.min(
          width / bounds.width,
          height / bounds.height
        );
  
        // First transition: fade out other countries and change color
        map.svg.selectAll('.datamaps-subunit')
          .transition()
          .duration(750)
          .style('opacity', function(d: any) {
            return d.id === countryCode ? 1 : 0;
          })
          .style('fill', function(d: any) {
            return d.id === countryCode ? '#e2e8f0' : null; // Change to default color
          });
  
        // Create new projection for zoomed state
        const targetProjection = d3Geo.geoEquirectangular()
          .center([countryCenters[countryCode].longitude, countryCenters[countryCode].latitude])
          .scale(scale * 200)
          .translate([width / 2, height / 2]);
  
        // Animate the zoom
        d3.select(mapElement)
          .transition()
          .duration(1000)
          .tween("projection", () => {
            const currentProjection = map.projection;
            const interpolator = d3.interpolate(
              [currentProjection.center(), currentProjection.scale()],
              [targetProjection.center(), targetProjection.scale()]
            );
  
            return (t: number) => {
              const [center, scale] = interpolator(t);
              map.projection
                .center(center)
                .scale(scale);
  
              // Update all paths during transition
              map.svg.selectAll("path")
                .attr("d", map.path);
            };
          })
          .on("end", async () => {
            try {
              // Load internal boundaries
              const response = await fetch(
                `https://raw.githubusercontent.com/deldersveld/topojson/master/countries/${countryCode.toLowerCase()}-provinces.json`
              );
              const internalBoundaries = await response.json();
  
              // Remove existing boundaries
              map.svg.selectAll('.internal-boundary').remove();
  
              // Add internal boundaries
              const boundaryGroup = map.svg.append('g')
                .attr('class', 'internal-boundary');
  
              // Add province boundaries
              boundaryGroup.selectAll('path')
                .data(internalBoundaries.features)
                .enter()
                .append('path')
                .attr('d', map.path)
                .style('fill', 'none')
                .style('stroke', '#666')
                .style('stroke-width', '0.5px')
                .style('opacity', 0)
                .transition()
                .duration(500)
                .style('opacity', 1);
  
              // Add province labels if available
              boundaryGroup.selectAll('text')
                .data(internalBoundaries.features)
                .enter()
                .append('text')
                .attr('class', 'province-label')
                .attr('transform', function(d: any) {
                  const centroid = map.path.centroid(d);
                  return `translate(${centroid[0]},${centroid[1]})`;
                })
                .attr('text-anchor', 'middle')
                .style('font-size', '8px')
                .style('fill', '#333')
                .style('opacity', 0)
                .text(function(d: any) {
                  return d.properties.name;
                })
                .transition()
                .duration(500)
                .style('opacity', 1);
  
            } catch (boundaryError) {
              console.log('Internal boundaries not available:', boundaryError);
            }
          });
  
      } catch (error) {
        console.error('Error in zoom operation:', error);
      }
    }
  }
  
  // Updated reset functionality
  resetButton.addEventListener('click', () => {
    // Fade out internal boundaries and labels
    map.svg.selectAll('.internal-boundary')
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove();
  
    // Create initial projection
    const initialProjection = d3Geo.geoEquirectangular()
      .center([20, 0])
      .rotate([0, 0])
      .scale(mapElement.offsetWidth / 2)
      .translate([mapElement.offsetWidth / 2, mapElement.offsetHeight / 2]);
  
    // Animate back to initial state
    d3.select(mapElement)
      .transition()
      .duration(1000)
      .tween("projection", () => {
        const interpolator = d3.interpolate(
          [map.projection.center(), map.projection.scale()],
          [initialProjection.center(), initialProjection.scale()]
        );
  
        return (t: number) => {
          const [center, scale] = interpolator(t);
          map.projection
            .center(center)
            .scale(scale);
  
          map.svg.selectAll("path")
            .attr("d", map.path);
        };
      })
      .on("end", () => {
        // Reset country colors and show all African countries
        map.svg.selectAll('.datamaps-subunit')
          .transition()
          .duration(500)
          .style('opacity', function(d: any) {
            return africanCountries.includes(d.id) ? 1 : 0;
          })
          .style('fill', function(d: any) {
            return ["RWA", "UGA", "BWA", "KEN", "GHA"].includes(d.id) 
              ? '#2563eb' // Target country color
              : '#e2e8f0'; // Default color
          });
  
        const insightPanel = document.getElementById('country-insights');
        if (insightPanel) {
          insightPanel.innerHTML = '';
        }
      });
  });

  /******************************************
   * MAP INITIALIZATION
   ******************************************/
  let map = new Datamap({
    element: mapElement,
    scope: "world",
    setProjection: function (element: HTMLElement) {
      const projection = d3Geo.geoEquirectangular()
        .center([20, 0])
        .rotate([0, 0])
        .scale(element.offsetWidth / 2)
        .translate([element.offsetWidth / 2, element.offsetHeight / 2]);

      const path = geoPath().projection(projection);
      return { path, projection };
    },
    fills: {
      defaultFill: "#e2e8f0",
      targetCountry: "#2563eb",
      highVuln: "#ef4444",
      medVuln: "#f97316",
      lowVuln: "#22c55e"
    },
    data: {
      RWA: { fillKey: "targetCountry" },
      UGA: { fillKey: "targetCountry" },
      BWA: { fillKey: "targetCountry" },
      KEN: { fillKey: "targetCountry" },
      GHA: { fillKey: "targetCountry" },
    },
    geographyConfig: {
      hideAntarctica: true,
      borderWidth: 1,
      borderColor: '#94a3b8',
      popupOnHover: true,
      highlightOnHover: false,
      highlightFillColor: '#1e40af',
      highlightBorderColor: '#fff',
      highlightBorderWidth: 1,
      popupTemplate: function(geo: any, data: any) {
        if (["RWA", "UGA", "BWA", "KEN", "GHA"].includes(geo.id)) {
          return `<div class="hoverinfo">
            <strong>${geo.properties.name}</strong>
            <br/>Click for vulnerability data
          </div>`;
        }
        return '';
      }
    },
    done: function(datamap: any) {
      // Hide all non-African countries
      datamap.svg.selectAll('.datamaps-subunit')
        .filter(function(d: any) {
          return !africanCountries.includes(d.id);
        })
        .remove();

      // Add combined hover and click effects for target countries
      datamap.svg.selectAll('.datamaps-subunit')
        .style('cursor', function(d: any) {
          return ["RWA", "UGA", "BWA", "KEN", "GHA"].includes(d.id) ? 'pointer' : 'default';
        })
        .on('mouseover', function(this: SVGPathElement, d: { id: string }) {
          if (["RWA", "UGA", "BWA", "KEN", "GHA"].includes(d.id)) {
            d3.select(this)
              .style('fill', '#1e40af');
          }
        })
        .on('mouseout', function(this: SVGPathElement, d: { id: string }) {
          if (["RWA", "UGA", "BWA", "KEN", "GHA"].includes(d.id)) {
            d3.select(this)
              .style('fill', '#2563eb');
          }
        })
        .on('click', function(this: SVGPathElement, d: any) {
          if (["RWA", "UGA", "BWA", "KEN", "GHA"].includes(d.id)) {
            zoomToCountry(d.id);
            updateInsights(d.id);
          }
        });
    }
  });

  /******************************************
   * RESET BUTTON FUNCTIONALITY
   ******************************************/
  resetButton.addEventListener('click', () => {
    // Remove internal boundaries
    map.svg.selectAll('.internal-boundary').remove();
    
    // Show all African countries again
    map.svg.selectAll('.datamaps-subunit')
      .style('opacity', 1);

    // Reset projection
    const projection = d3Geo.geoEquirectangular()
      .center([20, 0])
      .rotate([0, 0])
      .scale(mapElement.offsetWidth / 2)
      .translate([mapElement.offsetWidth / 2, mapElement.offsetHeight / 2]);

    map.options.setProjection = function(element: HTMLElement) {
      const path = geoPath().projection(projection);
      return { path, projection };
    };

    map.updateChoropleth({});
    const insightPanel = document.getElementById('country-insights');
    if (insightPanel) {
      insightPanel.innerHTML = '';
    }
  });
}