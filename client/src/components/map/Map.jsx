import { MapContainer, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Pin from "../pin/Pin";
import "./map.scss";

function Map({ items }) {
  return (
    <MapContainer
      center={
        items.length === 1
          ? [items[0].latitude, items[0].longitude]
          : [17.385044, 78.486671]
      }
      zoom={10}
      scrollWheelZoom={false}
      className="map"
      style={{ marginBottom: "20px", borderRadius: "20px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {items.map((item) => (
        <Pin item={item} key={item.id}>
          <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
            {item.city}
          </Tooltip>
        </Pin>
      ))}
    </MapContainer>
  );
}

export default Map;