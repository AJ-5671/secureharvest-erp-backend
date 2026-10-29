import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function EnvironmentChart({ readings }) {
  if (!readings || readings.length === 0) {
    return <p>No readings available for this batch yet.</p>;
  }

  // Recharts wants plain, flat objects with readable keys — so we reshape
  // our raw reading data into a "chart-friendly" format here.
  const chartData = readings.map((r) => ({
    time: new Date(r.timestamp * 1000).toLocaleTimeString(),
    Temperature: r.temperature,
    Humidity: r.humidity,
    device: r.deviceId,
  }));

  return (
    <div style={{ marginTop: '24px' }}>
      <h3>Environmental Timeline</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Temperature" stroke="#dc2626" strokeWidth={2} />
          <Line type="monotone" dataKey="Humidity" stroke="#2563eb" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EnvironmentChart;