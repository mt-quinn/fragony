// FFA rewards are authored independently of imported weapon/powerup metadata.
// Each chosen anchor already has source collision and baked access navigation.
export const FFA_MAJOR_ANCHORS=Object.freeze({
 'siege':'source-37',
 'mutiny':'source-73',
 'ef-showdown':'source-201',
 'delta-station':'source-26',
 'beta-station':'source-3',
 'blast-radius':'source-4'
});
export function ffaHealthResources(spec){
 const major=FFA_MAJOR_ANCHORS[spec.id];if(!major)return spec.resources;
 if(!spec.resources.some(p=>p.id===major))throw Error('Missing FFA major anchor for '+spec.id);
 return spec.resources.map(p=>({...p,amount:p.id===major?50:p.amount===50?25:p.amount}));
}
