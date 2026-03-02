import { useEffect, useState } from 'react';

function useCountUp(target, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const iv = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.floor(start));
      if (start >= target) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [target]);
  return val;
}

const accentMap = {
  cyan:   'border-t-cyan',
  red:    'border-t-danger',
  purple: 'border-t-purple',
  orange: 'border-t-warn',
  green:  'border-t-success',
};
const valueColorMap = {
  cyan:   'text-white',
  red:    'text-danger',
  purple: 'text-white',
  orange: 'text-warn',
  green:  'text-success',
};

export default function KpiCard({ label, value, sub, subColor = 'muted', accent = 'cyan', icon: Icon, suffix = '' }) {
  const displayed = useCountUp(typeof value === 'number' ? value : 0);

  return (
    <div className={`card border-t-2 ${accentMap[accent]} p-5 relative overflow-hidden
                    hover:border-cyan/20 hover:-translate-y-0.5 transition-all duration-300`}>
      {Icon && <Icon size={20} className="absolute right-4 top-4 text-white opacity-10" />}
      <div className="eyebrow mb-3">{label}</div>
      <div className={`font-mono text-3xl font-bold leading-none mb-2 ${valueColorMap[accent]}`}>
        {typeof value === 'number' ? displayed.toLocaleString() : value}{suffix}
      </div>
      <div className={`font-mono text-[10px] tracking-[1px]
        ${subColor === 'up' ? 'text-success' : subColor === 'down' ? 'text-danger' : 'text-white/30'}`}>
        {sub}
      </div>
    </div>
  );
}
