"""Recover rigid model geometry from the supplied Shipment2 source fastfile.
Used only to supply missing stock CoD4 cover models referenced by Radiant maps.
Run: python3 tools/extract-iw3-model-library.py /path/to/mp_shipment2.ff
No layout, texture, sound, or script is copied from Shipment2.
"""
import pathlib,sys,json
source=pathlib.Path(__file__).with_name('import-shipment.py').read_text()
state={'__file__':str(pathlib.Path(__file__).with_name('import-shipment.py')),'__name__':'__model_library__'}
exec(compile(source[:source.index('asset_indices=')],state['__file__'],'exec'),state)
models={}
for m in state['models']:
 p=[];n=[]
 for s in m['surfaces'][m['lodSurfaceStart']:m['lodSurfaceStart']+m['lodSurfaceCount']]:
  if not s['vertices'] or not s['indices']:continue
  for i in range(s['nt']):
   for vi in state['struct'].unpack_from('<3H',state['b'],s['indices']+i*6):
    p.extend(state['vec'](s['vertices']+vi*32));n.extend(state['unpack_normal'](s['vertices']+vi*32+24))
 if p:models[m['name']]={'p':p,'n':n}
path=pathlib.Path(__file__).resolve().parents[2]/'reference-maps/shipment/model-geometry.json'
path.write_text(json.dumps(models,separators=(',',':')))
print('Rigid model library:',len(models),'models /',path.stat().st_size,'bytes',','.join(models))
