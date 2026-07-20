'use client';

import { useState } from 'react';
import { PieChart as RechartPie, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';

const COLORS = { 'At-Risk': '#ef4444', Unhealthy: '#f59e0b', Fit: '#22c55e' };
const LABELS = { 'At-Risk': 'At-Risk', Unhealthy: 'Unhealthy', Fit: 'Fit' };
const GRADIENTS = { 'At-Risk': 'from-red-500 to-rose-600', Unhealthy: 'from-amber-500 to-orange-600', Fit: 'from-green-500 to-emerald-600' };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0];
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-2xl px-5 py-4 shadow-2xl border border-gray-700/50">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${GRADIENTS[d.name]}`} />
          <p className="font-bold text-sm">{d.name}</p>
        </div>
        <p className="text-gray-300">
          <span className="text-white font-bold text-base">{d.value}</span> students
        </p>
        <div className="mt-2 w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${GRADIENTS[d.name]}`}
            style={{ width: `${((d.value / d.payload.total) * 100).toFixed(1)}%` }} />
        </div>
        <p className="text-gray-400 mt-1.5">{((d.value / d.payload.total) * 100).toFixed(1)}% of total</p>
      </div>
    );
  }
  return null;
};

// Active shape (on hover)
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 3} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
        className="drop-shadow-xl transition-all duration-300" />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius + 2} outerRadius={outerRadius - 3}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
      {/* Glow effect */}
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 6} outerRadius={outerRadius + 12}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.15} />
    </g>
  );
};

export default function PieChartComponent({ data: distribution }) {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!distribution) return <Empty />;

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return <Empty />;

  const chartData = Object.entries(distribution).map(([key, value]) => ({
    name: LABELS[key] || key,
    value,
    total,
    color: COLORS[key] || '#94a3b8',
  }));

  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(null);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartPie>
          <Pie
            data={chartData}
            cx="50%" cy="50%"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={4}
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            animationBegin={200}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color}
                stroke={entry.color}
                strokeWidth={activeIndex === i ? 0 : 1.5}
                className="transition-all duration-300 cursor-pointer"
                style={{ filter: activeIndex === i ? 'brightness(1.1)' : 'brightness(1)' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value, entry) => {
              const item = chartData.find(d => d.name === value);
              return (
                <span className="text-gray-500 text-xs font-medium hover:text-gray-700 transition-colors cursor-default">
                  {value} ({item ? ((item.value / total) * 100).toFixed(0) : 0}%)
                </span>
              );
            }}
          />
        </RechartPie>
      </ResponsiveContainer>
    </div>
  );
}

function Empty() {
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          </svg>
        </div>
        <p className="text-gray-400 font-medium text-sm">No predictions yet</p>
        <p className="text-gray-300 text-xs mt-1">Run a prediction to see the chart</p>
      </div>
    </div>
  );
}
