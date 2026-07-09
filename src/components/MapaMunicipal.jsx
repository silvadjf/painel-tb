import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { COR_GRUPO, ALERTA_MUN, fmt } from '../data/meta';

const PALETAS = {
  light: { bg: '#e8ebef', stroke: 'rgba(0,0,0,0.30)', semDado: 'rgba(0,0,0,0.06)' },
  dark: { bg: '#10161e', stroke: 'rgba(8,12,18,0.9)', semDado: 'rgba(255,255,255,0.05)' },
};

const cacheMalha = new Map();
function malhaMunicipal(ufId) {
  if (!cacheMalha.has(ufId)) {
    cacheMalha.set(
      ufId,
      fetch(
        `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${ufId}?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio`,
      ).then((r) => {
        if (!r.ok) throw new Error(`IBGE respondeu ${r.status}`);
        return r.json();
      }),
    );
  }
  return cacheMalha.get(ufId);
}

function bboxDe(features) {
  const mn = [Infinity, Infinity];
  const mx = [-Infinity, -Infinity];
  const anda = (c) => {
    if (typeof c[0] === 'number') {
      if (c[0] < mn[0]) mn[0] = c[0];
      if (c[1] < mn[1]) mn[1] = c[1];
      if (c[0] > mx[0]) mx[0] = c[0];
      if (c[1] > mx[1]) mx[1] = c[1];
    } else c.forEach(anda);
  };
  features.forEach((f) => anda(f.geometry.coordinates));
  return [mn, mx];
}

export default function MapaMunicipal({ ufId, municipios, nomes, munSel, onMunSel, tema }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const [pronto, setPronto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const onMunSelRef = useRef(onMunSel);
  onMunSelRef.current = onMunSel;

  useEffect(() => {
    const p = PALETAS.dark;
    const map = new maplibregl.Map({
      container: elRef.current,
      attributionControl: false,
      dragRotate: false,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': p.bg } }],
      },
      center: [-53, -15],
      zoom: 4,
      minZoom: 3,
      maxZoom: 10,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('muns', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'muns-fill', type: 'fill', source: 'muns',
        paint: { 'fill-color': ['get', 'cor'] },
      });
      map.addLayer({
        id: 'muns-line', type: 'line', source: 'muns',
        paint: { 'line-color': p.stroke, 'line-width': 0.3 },
      });
      map.addLayer({
        id: 'muns-sel', type: 'line', source: 'muns',
        paint: { 'line-color': '#E7C84A', 'line-width': 2.5 },
        filter: ['==', ['get', 'cod'], ''],
      });
      setPronto(true);
    });

    map.on('mousemove', 'muns-fill', (e) => {
      const f = e.features?.[0];
      if (!f) return;
      map.getCanvas().style.cursor = 'pointer';
      setTooltip({ x: e.point.x, y: e.point.y, p: f.properties });
    });
    map.on('mouseleave', 'muns-fill', () => {
      map.getCanvas().style.cursor = '';
      setTooltip(null);
    });
    map.on('click', (e) => {
      if (!map.getLayer('muns-fill')) return;
      const fs = map.queryRenderedFeatures(e.point, { layers: ['muns-fill'] });
      onMunSelRef.current(fs.length && fs[0].properties.temDado ? fs[0].properties.cod : null);
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pronto || !ufId) return;
    let ativo = true;

    (async () => {
      setCarregando(true);
      setErro(null);
      try {
        const gj = await malhaMunicipal(ufId);
        if (!ativo) return;
        const cores = COR_GRUPO[tema];
        const p = PALETAS[tema];

        const feats = gj.features.map((f) => {
          const cod7 = String(f.properties.codarea);
          const cod = cod7.slice(0, 6);
          const m = municipios[cod];
          return {
            type: 'Feature',
            geometry: f.geometry,
            properties: m
              ? {
                  cod, temDado: true,
                  nome: nomes.get(cod) ?? cod,
                  grupo: m.grupo, escore: m.escore, aval: m.aval, ating: m.ating,
                  alerta: m.alerta,
                  cor: cores[m.grupo] ?? cores['Não classificável'],
                }
              : { cod, temDado: false, nome: nomes.get(cod) ?? cod, grupo: 'Sem registro', cor: p.semDado },
          };
        });

        map.setPaintProperty('bg', 'background-color', p.bg);
        map.setPaintProperty('muns-line', 'line-color', p.stroke);
        map.getSource('muns').setData({ type: 'FeatureCollection', features: feats });
        map.fitBounds(bboxDe(feats), { padding: 30, duration: 600 });
      } catch (e) {
        if (ativo) setErro(String(e.message ?? e));
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => { ativo = false; };
  }, [ufId, municipios, nomes, tema, pronto]);

  useEffect(() => {
    if (!pronto) return;
    mapRef.current.setFilter('muns-sel', ['==', ['get', 'cod'], munSel ?? '']);
  }, [munSel, pronto]);

  return (
    <div className="mapa-wrap">
      <div ref={elRef} className="mapa" />
      {carregando && <div className="mapa-status">Carregando malha municipal do IBGE…</div>}
      {erro && <div className="mapa-status erro">Falha ao carregar a malha: {erro}</div>}
      {tooltip && (
        <div
          className="tooltip"
          style={{ left: Math.min(tooltip.x + 14, (elRef.current?.clientWidth ?? 400) - 250), top: tooltip.y + 14 }}
        >
          <strong>{tooltip.p.nome}</strong>
          <div className="tooltip-classe">
            <span className="ponto" style={{ background: tooltip.p.cor }} />
            {tooltip.p.temDado ? `${tooltip.p.grupo} (exploratório)` : 'Sem registro na base'}
          </div>
          {tooltip.p.temDado && (
            <>
              <div className="tooltip-linha">
                Escore: {fmt(tooltip.p.escore, 0)} · {fmt(tooltip.p.ating, 0)}/{fmt(tooltip.p.aval, 0)} indicadores avaliáveis
              </div>
              <div className="tooltip-linha">⚠ {ALERTA_MUN[tooltip.p.alerta] ?? tooltip.p.alerta}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
