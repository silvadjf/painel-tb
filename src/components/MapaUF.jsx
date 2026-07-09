import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import { COR_GRUPO, fmt } from '../data/meta';

const PAISES = feature(world, world.objects.countries);

const PALETAS = {
  light: { bg: '#e8ebef', ctxFill: 'rgba(0,0,0,0.04)', ctxStroke: 'rgba(0,0,0,0.08)', stroke: 'rgba(0,0,0,0.35)' },
  dark: { bg: '#10161e', ctxFill: 'rgba(255,255,255,0.06)', ctxStroke: 'rgba(255,255,255,0.10)', stroke: 'rgba(8,12,18,0.9)' },
};

const MALHA_UF =
  'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=intermediaria&intrarregiao=UF';

export default function MapaUF({ ufs, ufsFiltradas, ufSel, onUfSel, tema }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const geoRef = useRef(null); // malha crua do IBGE
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const onUfSelRef = useRef(onUfSel);
  onUfSelRef.current = onUfSel;

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
      zoom: 3,
      minZoom: 2,
      maxZoom: 7,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('contexto', { type: 'geojson', data: PAISES });
      map.addLayer({ id: 'contexto-fill', type: 'fill', source: 'contexto', paint: { 'fill-color': p.ctxFill } });
      map.addLayer({ id: 'contexto-line', type: 'line', source: 'contexto', paint: { 'line-color': p.ctxStroke, 'line-width': 0.6 } });
      map.addSource('ufs', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'ufs-fill', type: 'fill', source: 'ufs',
        paint: { 'fill-color': ['get', 'cor'], 'fill-opacity': ['get', 'opacidade'] },
      });
      map.addLayer({ id: 'ufs-line', type: 'line', source: 'ufs', paint: { 'line-color': p.stroke, 'line-width': 0.5 } });
      map.addLayer({
        id: 'ufs-sel', type: 'line', source: 'ufs',
        paint: { 'line-color': '#E7C84A', 'line-width': 2.5 },
        filter: ['==', ['get', 'sigla'], ''],
      });
      map.fitBounds([[-74, -34], [-34, 6]], { padding: 24, duration: 0 });
      setPronto(true);
    });

    map.on('mousemove', 'ufs-fill', (e) => {
      const f = e.features?.[0];
      if (!f) return;
      map.getCanvas().style.cursor = 'pointer';
      setTooltip({ x: e.point.x, y: e.point.y, p: f.properties });
    });
    map.on('mouseleave', 'ufs-fill', () => {
      map.getCanvas().style.cursor = '';
      setTooltip(null);
    });
    map.on('click', (e) => {
      if (!map.getLayer('ufs-fill')) return;
      const fs = map.queryRenderedFeatures(e.point, { layers: ['ufs-fill'] });
      onUfSelRef.current(fs.length ? fs[0].properties.sigla : null);
    });

    fetch(MALHA_UF)
      .then((r) => {
        if (!r.ok) throw new Error(`IBGE respondeu ${r.status}`);
        return r.json();
      })
      .then((gj) => { geoRef.current = gj; setErro(null); setPronto((v) => v); pintar(); })
      .catch((e) => setErro(String(e.message ?? e)));

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // pinta/repinta a malha com os dados atuais
  function pintar() {
    const map = mapRef.current;
    const gj = geoRef.current;
    if (!map || !gj || !map.getSource('ufs')) return;
    const cores = COR_GRUPO[tema];
    const visiveis = new Set(ufsFiltradas.map((u) => u.sigla));
    const porCod = new Map(ufs.map((u) => [u.cod, u]));

    const feats = gj.features.map((f) => {
      const u = porCod.get(String(f.properties.codarea));
      return {
        type: 'Feature',
        geometry: f.geometry,
        properties: u
          ? {
              sigla: u.sigla, nome: u.nome, grupo: u.grupo,
              escore: u.escore, avaliaveis: u.avaliaveis, atingidos: u.atingidos,
              alerta: u.alerta,
              cor: cores[u.grupo] ?? cores['Não classificável'],
              opacidade: visiveis.has(u.sigla) ? 1 : 0.18,
            }
          : { sigla: '', nome: '', grupo: '', cor: '#888', opacidade: 0.1 },
      };
    });
    map.getSource('ufs').setData({ type: 'FeatureCollection', features: feats });
  }

  useEffect(() => {
    if (!pronto) return;
    const p = PALETAS[tema];
    const map = mapRef.current;
    map.setPaintProperty('bg', 'background-color', p.bg);
    map.setPaintProperty('contexto-fill', 'fill-color', p.ctxFill);
    map.setPaintProperty('contexto-line', 'line-color', p.ctxStroke);
    map.setPaintProperty('ufs-line', 'line-color', p.stroke);
    pintar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema, pronto, ufsFiltradas]);

  useEffect(() => {
    if (!pronto) return;
    mapRef.current.setFilter('ufs-sel', ['==', ['get', 'sigla'], ufSel ?? '']);
  }, [ufSel, pronto]);

  return (
    <div className="mapa-wrap">
      <div ref={elRef} className="mapa" />
      {erro && <div className="mapa-status erro">Falha ao carregar a malha do IBGE: {erro}</div>}
      {tooltip && tooltip.p.sigla && (
        <div className="tooltip" style={{ left: Math.min(tooltip.x + 14, (elRef.current?.clientWidth ?? 400) - 250), top: tooltip.y + 14 }}>
          <strong>{tooltip.p.nome}</strong>
          <div className="tooltip-classe">
            <span className="ponto" style={{ background: tooltip.p.cor }} />
            {tooltip.p.grupo}
          </div>
          <div className="tooltip-linha">Escore: {fmt(tooltip.p.escore, 0)} de 9</div>
          <div className="tooltip-linha">
            Indicadores atingidos: {fmt(tooltip.p.atingidos, 0)} / {fmt(tooltip.p.avaliaveis, 0)} avaliáveis
          </div>
          {String(tooltip.p.alerta).includes('instável') && (
            <span className="selo abaixo">⚠ classificação com indicador instável</span>
          )}
        </div>
      )}
    </div>
  );
}
